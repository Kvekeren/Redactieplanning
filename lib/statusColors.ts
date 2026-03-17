/**
 * Status-kleuren voor de planning. Subtiele stip naast de naam.
 */
export const STATUS_COLORS: Record<string, string> = {
  Gepubliceerd: "bg-emerald-500",
  "Mee bezig": "bg-orange-500",
  Ingepland: "bg-amber-400",
};

export function getStatusColor(status: string): string | null {
  const trimmed = status?.trim();
  if (!trimmed) return null;
  return STATUS_COLORS[trimmed] ?? null;
}
