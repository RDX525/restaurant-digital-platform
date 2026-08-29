export function collectNumericValues(value: unknown, output: Set<number> = new Set()): Set<number> {
  if (typeof value === "number" && Number.isFinite(value)) {
    output.add(value);
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectNumericValues(item, output);
    return output;
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectNumericValues(nested, output);
    }
  }

  return output;
}

export function extractNumericClaims(text: string): number[] {
  const claims = new Set<number>();
  const patterns = [
    /NZ\$?\s*([\d,]+(?:\.\d+)?)/gi,
    /\$([\d,]+(?:\.\d+)?)/gi,
    /([\d,]+(?:\.\d+)?)\s*%/gi,
    /(?<![A-Za-z])([\d,]+(?:\.\d+)?)(?![A-Za-z%$])/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[1]?.replace(/,/g, "");
      if (!raw) continue;
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) claims.add(parsed);
    }
  }

  return Array.from(claims);
}

function numbersRoughlyEqual(a: number, b: number): boolean {
  if (a === b) return true;
  const tolerance = Math.max(0.05, Math.abs(a) * 0.01);
  return Math.abs(a - b) <= tolerance;
}

export function claimIsSupported(claim: number, allowed: Set<number>): boolean {
  for (const value of allowed) {
    if (numbersRoughlyEqual(claim, value)) return true;
    if (Number.isInteger(claim) && Number.isInteger(value) && claim === value) return true;
  }
  return false;
}

export function validateMetricClaims(input: {
  text: string;
  sourceMetrics: Record<string, unknown>;
}): { valid: boolean; unsupportedClaims: number[] } {
  const allowed = collectNumericValues(input.sourceMetrics);
  const claims = extractNumericClaims(input.text);
  const unsupportedClaims = claims.filter((claim) => !claimIsSupported(claim, allowed));

  return {
    valid: unsupportedClaims.length === 0,
    unsupportedClaims,
  };
}

export function requiresVerifiedMetrics(question: string): boolean {
  const normalized = question.toLowerCase();
  const keywords = [
    "revenue",
    "sales",
    "order",
    "customer",
    "reservation",
    "best",
    "slow",
    "weakest",
    "trend",
    "average",
    "returning",
    "how much",
    "how many",
  ];
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function buildSafeMetricSummary(sourceMetrics: Record<string, unknown>): string {
  const sales = sourceMetrics.get_sales_summary as
    | { revenue?: number; orders?: number; averageOrderValue?: number }
    | undefined;
  const trends = sourceMetrics.get_sales_trends as
    | {
        yesterday?: { revenue?: number; deltaPercent?: number; weekday?: string };
        weakestDay?: { date?: string; revenue?: number } | null;
      }
    | undefined;
  const customers = sourceMetrics.get_customer_summary as
    | { inactiveCustomers?: number; returningCustomers?: number; newCustomers?: number }
    | undefined;
  const topItems = sourceMetrics.get_top_items as
    | { items?: Array<{ name?: string; revenue?: number; quantity?: number }> }
    | undefined;

  const parts: string[] = [];

  if (sales) {
    parts.push(
      `Verified sales summary: NZ$${sales.revenue ?? 0} revenue from ${sales.orders ?? 0} paid orders (AOV NZ$${sales.averageOrderValue ?? 0}).`,
    );
  }

  if (trends?.yesterday) {
    parts.push(
      `Yesterday (${trends.yesterday.weekday ?? "day"}) revenue was NZ$${trends.yesterday.revenue ?? 0}, ${trends.yesterday.deltaPercent ?? 0}% vs recent same-weekday average.`,
    );
  }

  if (trends?.weakestDay) {
    parts.push(
      `Weakest recent day: ${trends.weakestDay.date} at NZ$${trends.weakestDay.revenue ?? 0}.`,
    );
  }

  if (customers) {
    parts.push(
      `Customers: ${customers.newCustomers ?? 0} new, ${customers.returningCustomers ?? 0} returning, ${customers.inactiveCustomers ?? 0} inactive beyond typical visit interval.`,
    );
  }

  if (topItems?.items?.[0]) {
    parts.push(
      `Top item: ${topItems.items[0].name} (${topItems.items[0].quantity ?? 0} sold, NZ$${topItems.items[0].revenue ?? 0} revenue).`,
    );
  }

  if (parts.length === 0) {
    return "No verified restaurant metrics were available for this request.";
  }

  return parts.join(" ");
}

export function mergeSourceMetrics(
  current: Record<string, unknown>,
  tool: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...current,
    [tool]: data,
  };
}
