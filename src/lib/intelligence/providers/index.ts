import { resolveActiveIntelligenceProviderName } from "../config";
import type { IntelligenceProvider } from "../types";
import { DemoIntelligenceProvider } from "./demo";
import { OpenAiIntelligenceProvider } from "./openai";

let provider: IntelligenceProvider | null = null;
let overrideProvider: IntelligenceProvider | null = null;

export function setIntelligenceProviderForTests(next: IntelligenceProvider | null): void {
  overrideProvider = next;
  provider = null;
}

export function getIntelligenceProvider(): IntelligenceProvider {
  if (overrideProvider) return overrideProvider;
  if (provider) return provider;

  const name = resolveActiveIntelligenceProviderName();
  switch (name) {
    case "openai":
      provider = new OpenAiIntelligenceProvider();
      return provider;
    case "demo":
      provider = new DemoIntelligenceProvider();
      return provider;
    default:
      throw new Error(`Unsupported intelligence provider: ${name}`);
  }
}
