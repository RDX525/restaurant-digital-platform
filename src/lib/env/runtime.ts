export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevelopmentRuntime(): boolean {
  return process.env.NODE_ENV === "development";
}

/** In-memory demo stores are never used in production builds. */
export function allowsInMemoryDemoStores(): boolean {
  return !isProductionRuntime();
}
