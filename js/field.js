/**
 * Mini Football Field SVG Generator (100 Yards + End Zones)
 */
export class MiniFieldRenderer {
  /**
   * Render an SVG 100-yard mini football field for a game situation
   * @param {Object} situation - Normalized situation object
   * @param {Object} homeTeam - Home team object
   * @param {Object} awayTeam - Away team object
   * @returns {string} SVG HTML string
   */
  static render(situation, homeTeam, awayTeam) {
    if (!situation) {
      return '';
    }

    const {
      possessingTeam,
      defendingTeam,
      yardLine, // 0 to 100
      distance,
      isRedZone,
      down
    } = situation;

    const offTeam = possessingTeam || awayTeam;
    const defTeam = defendingTeam || homeTeam;

    const offColor = offTeam.color || '#1e3a8a';
    const defColor = defTeam.color || '#7f1d1d';
    const offAbbr = offTeam.abbr || 'OFF';
    const defAbbr = defTeam.abbr || 'DEF';

    // Total width: 120 (10 off endzone + 100 field + 10 def endzone)
    // Height: 28
    const clampedYard = Math.max(0, Math.min(100, yardLine));
    const scrimmageX = 10 + clampedYard;

    const clampedDist = distance !== null && distance !== undefined ? distance : 10;
    const firstDownYard = Math.min(100, clampedYard + clampedDist);
    const firstDownX = 10 + firstDownYard;

    // Red zone rect is 90 to 110 (20 yards from opponent goal line)
    const redZoneActive = isRedZone || clampedYard >= 80;

    return `
      <div class="mini-field-container" title="Ball at ${situation.possessionText || clampedYard + ' yd line'}">
        <svg class="mini-field-svg" viewBox="0 0 120 28" preserveAspectRatio="none">
          <defs>
            <!-- Turf Grass Gradient -->
            <linearGradient id="turf-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#144627" />
              <stop offset="50%" stop-color="#1e5c35" />
              <stop offset="100%" stop-color="#144627" />
            </linearGradient>

            <!-- Glow Filters -->
            <filter id="glow-scrimmage" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-firstdown" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-ball" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Main Field Turf -->
          <rect x="10" y="0" width="100" height="28" fill="url(#turf-grad)" />

          <!-- Left Endzone (Offense) -->
          <rect x="0" y="0" width="10" height="28" fill="${offColor}" />
          <text x="5" y="14" class="endzone-label">${offAbbr}</text>

          <!-- Right Endzone (Defense) -->
          <rect x="110" y="0" width="10" height="28" fill="${defColor}" />
          <text x="115" y="14" class="endzone-label">${defAbbr}</text>

          <!-- Red Zone Shading (Yards 80 to 100) -->
          <rect x="90" y="0" width="20" height="28" class="field-redzone-zone ${redZoneActive ? 'active' : ''}" />

          <!-- 10-Yard Hash Lines -->
          ${[20, 30, 40, 50, 70, 80, 90, 100].map(x => `
            <line x1="${x}" y1="0" x2="${x}" y2="28" class="field-yardline" />
          `).join('')}

          <!-- 50-Yard Midfield Line -->
          <line x1="60" y1="0" x2="60" y2="28" class="field-50-line" />

          <!-- Goal Lines -->
          <line x1="10" y1="0" x2="10" y2="28" class="field-goal-line" />
          <line x1="110" y1="0" x2="110" y2="28" class="field-goal-line" />

          <!-- Yard Numbers -->
          <text x="30" y="23" class="field-number">20</text>
          <text x="50" y="23" class="field-number">40</text>
          <text x="60" y="23" class="field-number">50</text>
          <text x="70" y="23" class="field-number">40</text>
          <text x="90" y="23" class="field-number">20</text>

          <!-- First Down Line (Yellow) -->
          <line x1="${firstDownX}" y1="0" x2="${firstDownX}" y2="28" class="field-firstdown-line" filter="url(#glow-firstdown)" />

          <!-- Line of Scrimmage (Electric Blue) -->
          <line x1="${scrimmageX}" y1="0" x2="${scrimmageX}" y2="28" class="field-scrimmage-line" filter="url(#glow-scrimmage)" />

          <!-- Football Marker -->
          <g transform="translate(${scrimmageX}, 14)">
            <!-- Outer pulse glow -->
            <circle cx="0" cy="0" r="2.8" fill="rgba(245, 158, 11, 0.4)" filter="url(#glow-ball)" />
            <!-- Football ellipse -->
            <ellipse cx="0" cy="0" rx="2" ry="1.2" class="field-ball-marker" />
            <!-- White lace -->
            <line x1="-0.8" y1="0" x2="0.8" y2="0" stroke="#ffffff" stroke-width="0.4" />
          </g>

          <!-- Drive Arrow pointing towards defense endzone -->
          <polygon points="${Math.min(108, scrimmageX + 3)},14 ${Math.min(106, scrimmageX + 1.5)},12.5 ${Math.min(106, scrimmageX + 1.5)},15.5" fill="#facc15" />
        </svg>

        <!-- Floating Drive Direction Badge -->
        <div class="drive-direction-indicator">
          <span>DRIVE</span>
          <span>▶</span>
        </div>
      </div>
    `;
  }
}
