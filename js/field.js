/**
 * Mini Football Field SVG Generator (100 Yards + End Zones)
 */
export class MiniFieldRenderer {
  /**
   * Render an SVG 100-yard mini football field for a game situation
   * @param {Object} situation - Normalized situation object
   * @param {Object} homeTeam - Home team object
   * @param {Object} awayTeam - Away team object
   * @returns {string} HTML string
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
    const offLogo = offTeam.logo || '';
    const defLogo = defTeam.logo || '';

    // Total width: 120 (10 off endzone + 100 field + 10 def endzone)
    // Height: 28
    const clampedYard = Math.max(0, Math.min(100, yardLine));
    const scrimmageX = 10 + clampedYard;

    const clampedDist = distance !== null && distance !== undefined ? distance : 10;
    const firstDownYard = Math.min(100, clampedYard + clampedDist);
    const firstDownX = 10 + firstDownYard;

    // Red zone active when in red zone or inside 20
    const redZoneActive = isRedZone || clampedYard >= 80;

    const ballPercent = ((scrimmageX / 120) * 100).toFixed(2);

    return `
      <div class="mini-field-container" title="Ball at ${situation.possessionText || clampedYard + ' yd line'}">
        <!-- Background Turf & Vector Yard Lines -->
        <svg class="mini-field-svg" viewBox="0 0 120 28" preserveAspectRatio="none">
          <defs>
            <linearGradient id="turf-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#144627" />
              <stop offset="50%" stop-color="#1e5c35" />
              <stop offset="100%" stop-color="#144627" />
            </linearGradient>

            <filter id="glow-scrimmage" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-firstdown" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Main Field Turf -->
          <rect x="10" y="0" width="100" height="28" fill="url(#turf-grad)" />

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

          <!-- First Down Line (Yellow) -->
          <line x1="${firstDownX}" y1="0" x2="${firstDownX}" y2="28" class="field-firstdown-line" filter="url(#glow-firstdown)" />

          <!-- Line of Scrimmage (Electric Blue) -->
          <line x1="${scrimmageX}" y1="0" x2="${scrimmageX}" y2="28" class="field-scrimmage-line" filter="url(#glow-scrimmage)" />
        </svg>

        <!-- Left Endzone (Offense Logo & Color) -->
        <div class="field-endzone endzone-left" style="background: ${offColor};" title="${offTeam.displayName || offAbbr}">
          ${offLogo ? `
            <img src="${offLogo}" alt="${offAbbr}" class="endzone-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
            <span class="endzone-abbr" style="display:none;">${offAbbr}</span>
          ` : `
            <span class="endzone-abbr">${offAbbr}</span>
          `}
        </div>

        <!-- Right Endzone (Defense Logo & Color) -->
        <div class="field-endzone endzone-right" style="background: ${defColor};" title="${defTeam.displayName || defAbbr}">
          ${defLogo ? `
            <img src="${defLogo}" alt="${defAbbr}" class="endzone-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
            <span class="endzone-abbr" style="display:none;">${defAbbr}</span>
          ` : `
            <span class="endzone-abbr">${defAbbr}</span>
          `}
        </div>

        <!-- Crisp Monospace Yard Numbers (Unstretched) -->
        <div class="field-yard-numbers">
          <span class="field-yard-num" style="left: 25.00%;">20</span>
          <span class="field-yard-num" style="left: 41.67%;">40</span>
          <span class="field-yard-num" style="left: 50.00%;">50</span>
          <span class="field-yard-num" style="left: 58.33%;">40</span>
          <span class="field-yard-num" style="left: 75.00%;">20</span>
        </div>

        <!-- Authentic Pro Football Marker (Fixed Aspect Ratio) -->
        <div class="field-ball-wrapper ${redZoneActive ? 'redzone-pulse' : ''}" style="left: ${ballPercent}%;">
          <svg class="pro-football-svg" viewBox="0 0 24 16" width="22" height="15">
            <defs>
              <radialGradient id="ball-leather" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#b45309" />
                <stop offset="50%" stop-color="#78350f" />
                <stop offset="100%" stop-color="#451a03" />
              </radialGradient>
              <filter id="ball-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="1.2" stdDeviation="0.8" flood-color="#000000" flood-opacity="0.85" />
              </filter>
            </defs>
            <!-- Pointed Pigskin Body -->
            <path d="M 2 8 C 5 2.2, 19 2.2, 22 8 C 19 13.8, 5 13.8, 2 8 Z"
                  fill="url(#ball-leather)"
                  stroke="#291003"
                  stroke-width="0.8"
                  filter="url(#ball-shadow)" />
            <!-- White End Stripes -->
            <path d="M 6.2 4.2 C 6.8 6, 6.8 10, 6.2 11.8" stroke="#ffffff" stroke-width="0.9" fill="none" opacity="0.85" />
            <path d="M 17.8 4.2 C 17.2 6, 17.2 10, 17.8 11.8" stroke="#ffffff" stroke-width="0.9" fill="none" opacity="0.85" />
            <!-- White Grip Laces -->
            <line x1="8.5" y1="8" x2="15.5" y2="8" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" />
            <line x1="10" y1="6.3" x2="10" y2="9.7" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" />
            <line x1="12" y1="6.0" x2="12" y2="10.0" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" />
            <line x1="14" y1="6.3" x2="14" y2="9.7" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" />
          </svg>
          <span class="ball-drive-arrow">▶</span>
        </div>

        <!-- Floating Drive Direction Badge -->
        <div class="drive-direction-indicator">
          <span>DRIVE</span>
          <span>▶</span>
        </div>
      </div>
    `;
  }
}
