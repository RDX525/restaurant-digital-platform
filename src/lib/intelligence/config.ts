export function getIntelligenceProviderName(): string {
  return process.env.INTELLIGENCE_PROVIDER?.trim().toLowerCase() || "demo";
}

export function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "your-openai-api-key") return null;
  return key;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export function isOpenAiConfigured(): boolean {
  return getOpenAiApiKey() !== null;
}

export function resolveActiveIntelligenceProviderName(): string {
  const configured = getIntelligenceProviderName();
  if (configured === "openai" && !isOpenAiConfigured()) {
    return "demo";
  }
  return configured;
}
