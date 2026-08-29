import type { IntelligenceToolName } from "./constants";
import { storeAiInsight } from "./data";
import { getIntelligenceProvider } from "./providers";
import { IntelligenceProviderError } from "./providers/demo";
import {
  buildSafeMetricSummary,
  mergeSourceMetrics,
  requiresVerifiedMetrics,
  validateMetricClaims,
} from "./safeguards";
import {
  executeIntelligenceTool,
  INTELLIGENCE_TOOL_DEFINITIONS,
} from "./tools";
import type {
  AskRestaurantResult,
  DailyBriefResult,
  IntelligenceMessage,
  MenuDescriptionDraftResult,
} from "./types";

const SYSTEM_PROMPT = `You are Restaurant Intelligence for a single restaurant.
You explain verified operational metrics retrieved from approved database tools.
Rules:
- NEVER invent revenue, order counts, percentages, or customer counts.
- ONLY cite numbers present in tool results.
- If data is empty or zero, say so clearly.
- Do not recommend changing prices, sending campaigns, or modifying production data.
- Keep answers concise and actionable.`;

function extractMetricsFromMessages(messages: IntelligenceMessage[]): Record<string, unknown> {
  for (const message of [...messages].reverse()) {
    if (!message.content.includes("Verified metrics JSON:")) continue;
    const json = message.content.split("Verified metrics JSON:")[1]?.trim();
    if (!json) continue;
    try {
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

async function runToolLoop(input: {
  restaurantId: string;
  question: string;
  presetTools?: IntelligenceToolCallPreset[];
  now?: Date;
}): Promise<{
  sourceMetrics: Record<string, unknown>;
  toolsUsed: IntelligenceToolName[];
  messages: IntelligenceMessage[];
}> {
  const provider = getIntelligenceProvider();
  const messages: IntelligenceMessage[] = [{ role: "user", content: input.question }];
  const sourceMetrics: Record<string, unknown> = {};
  const toolsUsed: IntelligenceToolName[] = [];

  if (input.presetTools?.length) {
    for (const preset of input.presetTools) {
      const data = await executeIntelligenceTool({
        restaurantId: input.restaurantId,
        tool: preset.name,
        arguments: preset.arguments,
        now: input.now,
      });
      Object.assign(sourceMetrics, { [preset.name]: data });
      toolsUsed.push(preset.name);
    }
    return { sourceMetrics, toolsUsed, messages };
  }

  const response = await provider.complete({
    systemPrompt: SYSTEM_PROMPT,
    messages,
    tools: INTELLIGENCE_TOOL_DEFINITIONS,
  });

  if (response.toolCalls.length > 0) {
    for (const call of response.toolCalls) {
      const data = await executeIntelligenceTool({
        restaurantId: input.restaurantId,
        tool: call.name,
        arguments: call.arguments,
        now: input.now,
      });
      Object.assign(sourceMetrics, mergeSourceMetrics(sourceMetrics, call.name, data));
      toolsUsed.push(call.name);
      messages.push({
        role: "tool",
        content: JSON.stringify(data),
        toolCallId: call.id,
        name: call.name,
      });
    }
  }

  return { sourceMetrics, toolsUsed, messages };
}

interface IntelligenceToolCallPreset {
  name: IntelligenceToolName;
  arguments: Record<string, unknown>;
}

async function generateExplanation(input: {
  question: string;
  sourceMetrics: Record<string, unknown>;
  messages: IntelligenceMessage[];
}): Promise<string> {
  const provider = getIntelligenceProvider();

  if (Object.keys(input.sourceMetrics).length === 0) {
    return "I do not have verified restaurant data for that question yet.";
  }

  const explainMessages: IntelligenceMessage[] = [
    ...input.messages,
    {
      role: "user",
      content: `Verified metrics JSON:\n${JSON.stringify(input.sourceMetrics)}\n\nQuestion: ${input.question}`,
    },
  ];

  try {
    const response = await provider.complete({
      systemPrompt: `${SYSTEM_PROMPT}\nProvide a natural-language answer using ONLY the verified metrics JSON.`,
      messages: explainMessages,
      tools: [],
    });

    const candidate =
      response.content?.trim() ||
      buildSafeMetricSummary(input.sourceMetrics);

    const validation = validateMetricClaims({
      text: candidate,
      sourceMetrics: input.sourceMetrics,
    });

    if (validation.valid) return candidate;
    return buildSafeMetricSummary(input.sourceMetrics);
  } catch (error) {
    if (error instanceof IntelligenceProviderError) {
      return buildSafeMetricSummary(input.sourceMetrics);
    }
    throw error;
  }
}

export async function askRestaurant(input: {
  restaurantId: string;
  question: string;
  now?: Date;
}): Promise<AskRestaurantResult> {
  if (requiresVerifiedMetrics(input.question) === false && input.question.length > 0) {
    // Still route through tools for operational questions; no-op safeguard.
  }

  const { sourceMetrics, toolsUsed, messages } = await runToolLoop({
    restaurantId: input.restaurantId,
    question: input.question,
    now: input.now,
  });

  if (requiresVerifiedMetrics(input.question) && toolsUsed.length === 0) {
    throw new IntelligenceProviderError(
      "Unable to retrieve verified metrics for this question.",
    );
  }

  const answer = await generateExplanation({
    question: input.question,
    sourceMetrics,
    messages,
  });

  const insight = await storeAiInsight({
    restaurantId: input.restaurantId,
    insightType: "ask_restaurant",
    sourceMetrics,
    generatedText: answer,
  });

  return {
    answer,
    insight,
    toolsUsed: [...new Set(toolsUsed)],
    sourceMetrics,
  };
}

export async function generateDailyBrief(input: {
  restaurantId: string;
  now?: Date;
}): Promise<DailyBriefResult> {
  const presetTools: IntelligenceToolCallPreset[] = [
    { name: "get_sales_summary", arguments: { preset: "yesterday" } },
    { name: "get_sales_trends", arguments: { weeks: 4 } },
    { name: "get_top_items", arguments: { preset: "7d", limit: 3 } },
    { name: "get_customer_summary", arguments: { preset: "30d" } },
  ];

  const question = "Generate today's daily restaurant brief using verified metrics.";
  const { sourceMetrics, messages } = await runToolLoop({
    restaurantId: input.restaurantId,
    question,
    presetTools,
    now: input.now,
  });

  const brief = await generateExplanation({
    question,
    sourceMetrics,
    messages,
  });

  const insight = await storeAiInsight({
    restaurantId: input.restaurantId,
    insightType: "daily_brief",
    sourceMetrics,
    generatedText: brief,
  });

  return { brief, insight, sourceMetrics };
}

export async function generateMenuDescriptionDraft(input: {
  restaurantId: string;
  itemName: string;
  category?: string;
  ingredients?: string;
  notes?: string;
  tone?: "friendly" | "elegant" | "casual";
}): Promise<MenuDescriptionDraftResult> {
  const provider = getIntelligenceProvider();
  const sourceMetrics = {
    itemName: input.itemName,
    category: input.category ?? null,
    ingredients: input.ingredients ?? null,
    notes: input.notes ?? null,
    tone: input.tone ?? "friendly",
  };

  const prompt = `Write a ${input.tone ?? "friendly"} menu description draft for "${input.itemName}"${
    input.category ? ` in the ${input.category} category` : ""
  }.
Use only the provided item facts. Do not invent prices, awards, or nutritional claims.
${input.ingredients ? `Ingredients: ${input.ingredients}` : ""}
${input.notes ? `Notes: ${input.notes}` : ""}
Return 2-3 sentences suitable for a restaurant menu. Mark clearly as a draft for staff approval.`;

  let draft: string;
  try {
    const response = await provider.complete({
      systemPrompt:
        "You write menu description drafts for restaurant staff approval. Never invent prices or factual claims.",
      messages: [{ role: "user", content: prompt }],
      tools: [],
    });
    draft =
      response.content?.trim() ||
      `${input.itemName}: draft description pending provider response. Please review before publishing.`;
  } catch {
    draft = `${input.itemName}: ${input.ingredients ?? "A house favorite"} — draft description for staff review before publishing.`;
  }

  const insight = await storeAiInsight({
    restaurantId: input.restaurantId,
    insightType: "menu_description_draft",
    sourceMetrics,
    generatedText: draft,
  });

  return { draft, insight };
}

export { extractMetricsFromMessages };
