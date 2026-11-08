import { getAccessibleTeamColor } from './colors.js';

/**
 * SVG Win Probability Chart Generator
 */
export class WinProbabilityChart {
  /**
   * Render an SVG win probability chart
   * @param {Array} points - Array of { homeWinPercentage, playId }
   * @param {Object} homeTeam - Home team object
   * @param {Object} awayTeam - Away team object
   * @returns {string} SVG HTML string
   */
  static render(points = [], homeTeam, awayTeam) {
    if (!points || points.length < 2) {
      return `
        <div class="chart-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.8rem;">
          Win probability data will appear as the game progresses.
        </div>
      `;
    }

    const width = 800;
    const height = 180;
    const padding = 20;

    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const midY = padding + chartH / 2;

    const homeColor = getAccessibleTeamColor(homeTeam?.color || '#3b82f6', 0.72);
    const awayColor = getAccessibleTeamColor(awayTeam?.color || '#ef4444', 0.72);
    const gradId = 'wp-grad-home-' + Math.random().toString(36).slice(2, 7);

    // Map points to SVG coordinates
    const coords = points.map((p, idx) => {
      const x = padding + (idx / (points.length - 1)) * chartW;
      // homeWinPercentage is 0.0 to 1.0 (1.0 = top = 100% home win)
      const pct = Math.max(0, Math.min(1, p.homeWinPercentage ?? 0.5));
      const y = padding + chartH * (1 - pct);
      return { x, y, pct };
    });

    // Build path string
    const pathD = coords.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    // Current probability
    const latestPct = Math.round((points[points.length - 1].homeWinPercentage ?? 0.5) * 100);

    return `
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${homeColor}" stop-opacity="0.3" />
            <stop offset="100%" stop-color="${homeColor}" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- 50% Baseline -->
        <line x1="${padding}" y1="${midY}" x2="${width - padding}" y2="${midY}" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="4,4" />

        <!-- Probability Curve Line -->
        <path d="${pathD}" fill="none" stroke="${homeColor}" stroke-width="2.5" />

        <!-- Latest Point Pulsing Dot -->
        <circle cx="${coords[coords.length - 1].x}" cy="${coords[coords.length - 1].y}" r="4" fill="#ffffff" stroke="${homeColor}" stroke-width="2" />

        <!-- Labels -->
        <text x="${padding + 5}" y="${padding + 14}" font-size="11" font-weight="800" fill="${homeColor}">${homeTeam?.abbr || 'HOME'} 100%</text>
        <text x="${padding + 5}" y="${midY - 4}" font-size="9" fill="var(--text-muted)">50% TIE</text>
        <text x="${padding + 5}" y="${height - padding - 4}" font-size="11" font-weight="800" fill="${awayColor}">${awayTeam?.abbr || 'AWAY'} 100%</text>

        <!-- Current Status -->
        <text x="${width - padding - 5}" y="${padding + 14}" font-size="12" font-weight="800" fill="var(--text-bright)" text-anchor="end">
          ${latestPct >= 50 ? `${homeTeam?.abbr} ${latestPct}%` : `${awayTeam?.abbr} ${100 - latestPct}%`}
        </text>
      </svg>
    `;
  }
}
