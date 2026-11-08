/**
 * Color utilities using modern CSS relative color syntax (OKLCH).
 */

/**
 * Returns an accessible CSS color for text or stroke on dark surfaces,
 * ensuring a minimum perceptual lightness while preserving hue and chroma.
 * @param {string} hex - Source hex or CSS color
 * @param {number} minLightness - Minimum OKLCH lightness (0.0 to 1.0)
 * @returns {string} CSS color expression
 */
export function getAccessibleTeamColor(hex, minLightness = 0.72) {
  if (!hex) return 'var(--text-primary)';
  return `oklch(from ${hex} max(l, ${minLightness}) max(c, 0.12) h)`;
}

/**
 * Returns an accessible CSS color for progress bars and filled regions on dark surfaces.
 * @param {string} hex - Source hex or CSS color
 * @param {number} minLightness - Minimum OKLCH lightness (0.0 to 1.0)
 * @returns {string} CSS color expression
 */
export function getAccessibleBarColor(hex, minLightness = 0.55) {
  if (!hex) return 'var(--accent-blue)';
  return `oklch(from ${hex} max(l, ${minLightness}) max(c, 0.14) h)`;
}
