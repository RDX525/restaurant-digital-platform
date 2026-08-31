export function replaceIfUnchanged<T>(current: T, next: T): T {
  try {
    if (JSON.stringify(current) === JSON.stringify(next)) return current;
  } catch {
    return next;
  }
  return next;
}
