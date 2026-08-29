import type { InsightType, IntelligenceToolName } from "./constants";

export interface AiInsightRecord {
  id: string;
  restaurant_id: string;
  insight_type: InsightType;
  source_metrics: Record<string, unknown>;
  generated_text: string;
  created_at: string;
}

export interface IntelligenceToolDefinition {
  name: IntelligenceToolName;
  description: string;
  parameters: Record<string, unknown>;
}

export interface IntelligenceMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface IntelligenceToolCall {
  id: string;
  name: IntelligenceToolName;
  arguments: Record<string, unknown>;
}

export interface IntelligenceCompletionRequest {
  systemPrompt: string;
  messages: IntelligenceMessage[];
  tools: IntelligenceToolDefinition[];
}

export interface IntelligenceCompletionResponse {
  content: string | null;
  toolCalls: IntelligenceToolCall[];
  finishReason: "stop" | "tool_calls" | "error";
}

export interface IntelligenceProvider {
  readonly name: string;
  complete(request: IntelligenceCompletionRequest): Promise<IntelligenceCompletionResponse>;
}

export interface ToolExecutionResult {
  tool: IntelligenceToolName;
  data: Record<string, unknown>;
}

export interface AskRestaurantResult {
  answer: string;
  insight: AiInsightRecord;
  toolsUsed: IntelligenceToolName[];
  sourceMetrics: Record<string, unknown>;
}

export interface DailyBriefResult {
  brief: string;
  insight: AiInsightRecord;
  sourceMetrics: Record<string, unknown>;
}

export interface MenuDescriptionDraftResult {
  draft: string;
  insight: AiInsightRecord;
}

export interface RestaurantContext {
  restaurantId: string;
  timezone: string;
}
