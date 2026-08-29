const PLACEHOLDER_PATTERNS = [
  "your-project",
  "your-anon-key",
  "your-service-role-key",
  "example.supabase.co",
];

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !isPlaceholder(url) && !isPlaceholder(key);
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured() || !url || !key) {
    return null;
  }

  return { url, key };
}
