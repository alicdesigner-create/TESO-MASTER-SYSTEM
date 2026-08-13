/**
 * All dates in this app are stored as "YYYY-MM-DD" strings.
 * NEVER do `new Date(isoDateString)` directly — JS parses date-only strings
 * as UTC midnight, which shifts to the wrong day/month once converted to the
 * browser's local timezone (e.g. "2026-05-01" can render as April 30 or even
 * roll into a different month entirely). Always go through parseLocalDate /
 * formatLocalDate instead.
 */

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Today's date as "YYYY-MM-DD" in the browser's local timezone.
 * NEVER use `new Date().toISOString().slice(0, 10)` for this — toISOString()
 * converts to UTC first, so at night in a timezone behind UTC it silently
 * returns tomorrow's date.
 */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Adds `days` to a "YYYY-MM-DD" string and returns the result in the same
 * format, staying in local time throughout (see note above re: UTC drift).
 */
export function addDaysISO(iso: string, days: number): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatLocalDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
): string {
  if (!iso) return "—";
  return parseLocalDate(iso).toLocaleDateString("en-US", opts);
}
