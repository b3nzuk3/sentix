/**
 * Deduplication utilities
 */

/**
 * Find similar theme by title using Jaccard similarity
 */
export function findSimilarTheme(
  title: string,
  existingThemes: Array<{ id: string; title: string }>,
  threshold: number
): any | null {
  const normalize = (t: string) => t.toLowerCase().trim();

  const titleNorm = normalize(title);
  if (!titleNorm) return null;

  for (const theme of existingThemes) {
    const themeNorm = normalize(theme.title);
    if (!themeNorm) continue;

    // Simple Jaccard similarity on token sets
    const titleTokens = new Set(titleNorm.split(/\s+/).filter(t => t.length > 2));
    const themeTokens = new Set(themeNorm.split(/\s+/).filter(t => t.length > 2));

    if (titleTokens.size === 0 || themeTokens.size === 0) continue;

    const intersection = new Set([...titleTokens].filter(t => themeTokens.has(t)));
    const union = new Set([...titleTokens, ...themeTokens]);
    const jaccard = intersection.size / union.size;

    if (jaccard >= threshold) {
      return theme;
    }
  }

  return null;
}
