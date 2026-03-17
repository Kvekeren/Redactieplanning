/**
 * Categorie-kleuren voor de planning. Subtiele achtergronden.
 */
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Hub: { bg: "#2d5a3a", text: "#ffffff" },           // donkergroen
  Snoeien: { bg: "#f0d8a8", text: "#5c4a28" },      // oranje
  Inspiratie: { bg: "#f0b8b8", text: "#5c3a3a" },    // rood
  Tuinklussen: { bg: "#b8d8f0", text: "#2a4a5c" },  // lichtblauw
  Kweken: { bg: "#e0d8f0", text: "#4a3a5c" },        // lichtpaars
  Biodiversiteit: { bg: "#f5f0b8", text: "#5c5428" }, // geel
  Moestuin: { bg: "#d0e8c8", text: "#3a4a28" },
  Kamerplanten: { bg: "#c8e8d0", text: "#2a4a2a" },
  Pagina: { bg: "#e8e0d8", text: "#5c4a3a" },
  Partnerbijdrage: { bg: "#e0e4e8", text: "#4a4a52" },
  "TV-pagina": { bg: "#f0d8e0", text: "#5c3a42" },
  RERUN: { bg: "#e8e8e8", text: "#5a5a5a" },
};

const DEFAULT_COLOR = { bg: "#e8e8e8", text: "#5a5a5a" };

export function getCategoryStyle(categorie: string) {
  const trimmed = categorie?.trim();
  if (!trimmed) return null;
  return CATEGORY_COLORS[trimmed] ?? DEFAULT_COLOR;
}
