import { getOpenAiApiKey, getOpenAiModel } from "../config";
import type {
  IntelligenceCompletionRequest,
  IntelligenceCompletionResponse,
  IntelligenceProvider,
} from "../types";
import { IntelligenceProviderError, parseOpenAiToolCalls } from "./demo";

export class OpenAiIntelligenceProvider implements IntelligenceProvider {
  readonly name = "openai";

  async complete(request: IntelligenceCompletionRequest): Promise<IntelligenceCompletionResponse> {
    const apiKey = getOpenAiApiKey();
    if (!apiKey) {
      throw new IntelligenceProviderError("OpenAI API key is not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getOpenAiModel(),
        messages: [
          { role: "system", content: request.systemPrompt },
          ...request.messages.map((message) => ({
            role: message.role,
            content: message.content,
            ...(message.role === "tool"
              ? { tool_call_id: message.toolCallId, name: message.name }
              : {}),
          })),
        ],
        tools: request.tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        tool_choice: request.tools.length > 0 ? "auto" : undefined,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new IntelligenceProviderError(`OpenAI request failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        finish_reason?: string;
        message?: {
          content?: string | null;
          tool_calls?: unknown;
        };
      }>;
    };

    const choice = payload.choices?.[0];
    const finishReason = choice?.finish_reason === "tool_calls" ? "tool_calls" : "stop";

    return {
      content: choice?.message?.content ?? null,
      toolCalls: parseOpenAiToolCalls(choice?.message?.tool_calls),
      finishReason,
    };
  }
}
