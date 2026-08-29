export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertProductionEnvironment, validateProductionEnvironment } = await import(
    "@/lib/env/production"
  );

  const result = validateProductionEnvironment();

  if (!result.ok) {
    assertProductionEnvironment();
  }

  for (const warning of result.warnings) {
    console.warn(`[production-config] ${warning}`);
  }

  if (process.env.NODE_ENV === "development") {
    const { ensureDemoStoresSeeded } = await import("@/lib/restaurant/demo-data");
    ensureDemoStoresSeeded();
  }
}
