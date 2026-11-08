import { WinProbabilityChart } from './chart.js';
import { MiniFieldRenderer } from './field.js';
import { getGameWatchLinks } from './links.js';
import { getAccessibleTeamColor, getAccessibleBarColor } from './colors.js';

/**
 * Game Details & Box Score Modal Controller
 */
export class GameDetailsModal {
  constructor(apiClient) {
    this.api = apiClient;
    this.modalEl = document.getElementById('game-modal');
    this.bodyEl = document.getElementById('modal-body-content');
    this.titleEl = document.getElementById('modal-game-title');
    this.closeBtn = document.getElementById('modal-close-btn');

    this.activeTab = 'stats';
    this.currentGame = null;
    this.summaryData = null;

    this.setupListeners();
  }

  setupListeners() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.modalEl) {
      // Backdrop click on native dialog
      this.modalEl.addEventListener('click', (e) => {
        const rect = this.modalEl.getBoundingClientRect();
        const isInside = (
          rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );
        if (!isInside) this.close();
      });

      this.modalEl.addEventListener('cancel', () => {
        this.close();
      });
    }
  }

  get isOpen() {
    return !!(this.modalEl?.open || this.modalEl?.classList.contains('open'));
  }

  close() {
    if (this.modalEl?.open) {
      this.modalEl.close();
    }
    this.modalEl?.classList.remove('open');
  }

  async open(game, simGames = []) {
    this.currentGame = game;
    this.updateTitle(game);
    
    if (typeof this.modalEl.showModal === 'function') {
      if (!this.modalEl.open) {
        this.modalEl.showModal();
      }
    } else {
      this.modalEl.classList.add('open');
    }

    // Show initial skeleton
    this.bodyEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:250px;">
        <div class="loading-spinner"></div>
      </div>
    `;

    try {
      this.summaryData = await this.api.fetchGameSummary(game.id, simGames);
      this.render();
    } catch (err) {
      this.bodyEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-text">Failed to load detailed game stats: ${err.message}</div>
        </div>
      `;
    }
  }

  updateTitle(game) {
    if (!this.titleEl || !game) return;
    if (game.state === 'pre') {
      this.titleEl.textContent = `${game.awayTeam.displayName} @ ${game.homeTeam.displayName}`;
    } else {
      this.titleEl.textContent = `${game.awayTeam.displayName} (${game.awayTeam.score}) @ ${game.homeTeam.displayName} (${game.homeTeam.score})`;
    }
  }

  async updateGame(game, simGames = []) {
    this.currentGame = game;
    this.updateTitle(game);

    if (this.isOpen && game.state === 'in') {
      try {
        const freshSummary = await this.api.fetchGameSummary(game.id, simGames);
        if (freshSummary && this.isOpen) {
          this.summaryData = freshSummary;
          this.render();
        }
      } catch (err) {
        console.warn('Silent modal update failed:', err);
      }
    }
  }

  render() {
    if (!this.summaryData) return;

    const game = this.currentGame;
    const summary = this.summaryData;
    const watchLinks = getGameWatchLinks(game);

    this.bodyEl.innerHTML = `
      <!-- Streaming & Watch Links Bar -->
      ${watchLinks.length > 0 ? `
        <div class="modal-watch-bar">
          <span class="modal-watch-label">Broadcast & Streaming:</span>
          ${watchLinks.map(l => `
            <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="modal-watch-pill ${l.badgeClass || ''}" title="Open ${l.label}">
              <span>${l.icon}</span>
              <span>${l.label}</span>
              <span class="modal-ext-icon">↗</span>
            </a>
          `).join('')}
        </div>
      ` : ''}

      <!-- Modal Navigation Tabs -->
      <div class="modal-tabs">
        <button class="modal-tab-btn ${this.activeTab === 'stats' ? 'active' : ''}" data-tab="stats">Team Stats</button>
        <button class="modal-tab-btn ${this.activeTab === 'scoring' ? 'active' : ''}" data-tab="scoring">Scoring Plays</button>
        <button class="modal-tab-btn ${this.activeTab === 'leaders' ? 'active' : ''}" data-tab="leaders">Game Leaders</button>
        <button class="modal-tab-btn ${this.activeTab === 'winprob' ? 'active' : ''}" data-tab="winprob">Win Probability</button>
        <button class="modal-tab-btn ${this.activeTab === 'drives' ? 'active' : ''}" data-tab="drives">Drives</button>
      </div>

      <!-- Tab Content Panel -->
      <div class="modal-tab-panel">
        ${this.renderActiveTab(summary, game)}
      </div>
    `;

    // Wire tab clicks
    this.bodyEl.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });
  }

  renderActiveTab(summary, game) {
    switch (this.activeTab) {
      case 'stats':
        return this.renderTeamStats(summary, game);
      case 'scoring':
        return this.renderScoringPlays(summary);
      case 'leaders':
        return this.renderLeaders(summary);
      case 'winprob':
        return this.renderWinProbability(summary, game);
      case 'drives':
        return this.renderDrives(summary, game);
      default:
        return '';
    }
  }

  renderTeamStats(summary, game) {
    const teams = summary.boxscore?.teams || [];
    if (teams.length < 2) {
      return '<div style="color:var(--text-muted);text-align:center;padding:20px;">Team statistics unavailable.</div>';
    }

    const awayBox = teams.find(t => t.team.id === game.awayTeam.id) || teams[0];
    const homeBox = teams.find(t => t.team.id === game.homeTeam.id) || teams[1];

    const awayStats = awayBox.statistics || [];
    const homeStats = homeBox.statistics || [];

    const isPreGame = game.state === 'pre' || awayStats.some(s => s.name?.includes('PerGame'));

    const categories = isPreGame ? [
      { label: 'Points Per Game', match: ['points per game', 'totalpointspergame'] },
      { label: 'Total Yards / Game', match: ['total yards', 'yardspergame'] },
      { label: 'Passing Yards / Game', match: ['yards passing', 'passingyardspergame'] },
      { label: 'Rushing Yards / Game', match: ['yards rushing', 'rushingyardspergame'] },
      { label: 'Points Allowed / Game', match: ['points allowed per game', 'totalpointspergameallowed'] },
      { label: 'Yards Allowed / Game', match: ['yards allowed', 'yardspergameallowed'] },
      { label: 'Pass Yards Allowed', match: ['pass yards allowed', 'passingyardspergameallowed'] },
      { label: 'Rush Yards Allowed', match: ['rush yards allowed', 'rushingyardspergameallowed'] }
    ] : [
      { label: '1st Downs', match: ['1st downs', 'firstdowns'] },
      { label: 'Total Yards', match: ['total yards', 'totalyards'] },
      { label: 'Passing Yards', match: ['passing yards', 'netpassingyards', 'yards passing'] },
      { label: 'Rushing Yards', match: ['rushing yards', 'rushingyards', 'yards rushing'] },
      { label: 'Turnovers', match: ['turnovers'] },
      { label: 'Possession', match: ['possession', 'possessiontime'] },
      { label: '3rd down efficiency', match: ['3rd down efficiency', 'thirddowneff'] },
      { label: '4th down efficiency', match: ['4th down efficiency', 'fourthdowneff'] },
      { label: 'Sacks', match: ['sacks', 'sacksyardslost'] }
    ];

    const categoryTitle = isPreGame ? 'Season Averages (Per Game)' : 'Stat Category';

    const awayTextColor = getAccessibleTeamColor(game.awayTeam.color, 0.72);
    const homeTextColor = getAccessibleTeamColor(game.homeTeam.color, 0.72);
    const awayBarColor = getAccessibleBarColor(game.awayTeam.color, 0.55);
    const homeBarColor = getAccessibleBarColor(game.homeTeam.color, 0.55);

    const parseStatValue = (rawVal, label) => {
      if (!rawVal || rawVal === '-') return null;
      const str = String(rawVal).trim();
      if (/^(\d+)\s*-\s*(\d+)$/.test(str)) {
        const [, made, att] = str.match(/^(\d+)\s*-\s*(\d+)$/);
        const m = parseFloat(made);
        const a = parseFloat(att);
        if (label.toLowerCase().includes('efficiency')) {
          return a > 0 ? (m / a) * 100 : 0;
        }
        return m;
      }
      if (/^(\d+):(\d{2})$/.test(str)) {
        const [, min, sec] = str.match(/^(\d+):(\d{2})$/);
        return parseInt(min, 10) * 60 + parseInt(sec, 10);
      }
      const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? null : num;
    };

    return `
      <div class="stats-comparison">
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem;padding-bottom:10px;border-bottom:1px solid var(--border-subtle);">
          <span style="color:${awayTextColor}">${game.awayTeam.abbr}</span>
          <span style="color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;">${categoryTitle}</span>
          <span style="color:${homeTextColor}">${game.homeTeam.abbr}</span>
        </div>

        ${categories.map(cat => {
          const aStat = awayStats.find(s => cat.match.includes(s.label?.toLowerCase()) || cat.match.includes(s.name?.toLowerCase()));
          const hStat = homeStats.find(s => cat.match.includes(s.label?.toLowerCase()) || cat.match.includes(s.name?.toLowerCase()));
          const aVal = aStat?.displayValue || '-';
          const hVal = hStat?.displayValue || '-';

          const aNum = parseStatValue(aVal, cat.label);
          const hNum = parseStatValue(hVal, cat.label);
          const isInverted = ['turnovers', 'allowed'].some(k => cat.label.toLowerCase().includes(k));

          let aPct = 50;
          let hPct = 50;
          if (aNum !== null && hNum !== null) {
            const sum = aNum + hNum;
            if (sum > 0) {
              if (isInverted) {
                aPct = Math.round((hNum / sum) * 100);
                hPct = 100 - aPct;
              } else {
                aPct = Math.round((aNum / sum) * 100);
                hPct = 100 - aPct;
              }
            } else if (aNum === 0 && hNum === 0) {
              aPct = 50;
              hPct = 50;
            }
          } else if (aNum !== null && hNum === null) {
            aPct = 100;
            hPct = 0;
          } else if (aNum === null && hNum !== null) {
            aPct = 0;
            hPct = 100;
          }

          return `
            <div class="stat-row">
              <div class="stat-labels">
                <span style="font-family:var(--font-mono)">${aVal}</span>
                <span class="stat-title">${cat.label}</span>
                <span style="font-family:var(--font-mono)">${hVal}</span>
              </div>
              <div class="stat-bar-track">
                <div class="stat-bar-away" style="width:${aPct}%;background:${awayBarColor}"></div>
                <div class="stat-bar-home" style="width:${hPct}%;background:${homeBarColor}"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderScoringPlays(summary) {
    const plays = summary.scoringPlays || [];
    if (plays.length === 0) {
      return '<div style="color:var(--text-muted);text-align:center;padding:20px;">No scoring plays recorded yet.</div>';
    }

    return `
      <div class="scoring-timeline">
        ${plays.map(sp => `
          <div class="scoring-item">
            <div class="scoring-time">Q${sp.period?.number || '-'} ${sp.clock?.displayValue || ''}</div>
            <div class="scoring-desc">${sp.text}</div>
            <div class="scoring-score">${sp.awayScore} - ${sp.homeScore}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderLeaders(summary) {
    const leaders = summary.leaders || [];
    if (leaders.length === 0) {
      return '<div style="color:var(--text-muted);text-align:center;padding:20px;">Leader information unavailable.</div>';
    }

    const game = this.currentGame;
    const cards = [];
    leaders.forEach(teamLeaders => {
      const teamObj = teamLeaders.team || {};
      const teamAbbr = teamObj.abbreviation || (teamObj.id === game?.homeTeam.id ? game?.homeTeam.abbr : game?.awayTeam.abbr) || '';
      const teamLogo = teamObj.logo || (teamObj.id === game?.homeTeam.id ? game?.homeTeam.logo : game?.awayTeam.logo) || '';
      const rawColor = teamObj.color ? `#${teamObj.color}` : (teamObj.id === game?.homeTeam.id ? game?.homeTeam.color : game?.awayTeam.color) || '#3b82f6';
      const teamColor = getAccessibleTeamColor(rawColor, 0.75);
      const teamLeadArr = teamLeaders.leaders || [];

      teamLeadArr.forEach(leadCat => {
        const topAthlete = leadCat.leaders?.[0];
        if (topAthlete) {
          const ath = topAthlete.athlete || {};
          const photoUrl = ath.headshot?.href || ath.headshot || '';
          cards.push({
            teamAbbr,
            teamLogo,
            teamColor,
            category: leadCat.displayName || 'Leader',
            name: ath.displayName || ath.shortName || 'Player',
            photo: photoUrl,
            fallbackPhoto: teamLogo || 'https://a.espncdn.com/combiner/i?img=/i/headshots/nophoto.png',
            stat: topAthlete.displayValue || ''
          });
        }
      });
    });

    return `
      <div class="leaders-grid">
        ${cards.map(c => `
          <div class="leader-card">
            <img class="leader-photo" src="${c.photo || c.fallbackPhoto}" alt="${c.name}" onerror="this.onerror=null;this.src='${c.fallbackPhoto}';" />
            <div class="leader-info">
              <div style="display:flex;align-items:center;gap:6px;">
                ${c.teamAbbr ? `<span class="badge" style="background:oklch(1 0 0 / 0.1);color:${c.teamColor};font-size:0.6rem;padding:1px 5px;">${c.teamAbbr}</span>` : ''}
                <span class="leader-category">${c.category}</span>
              </div>
              <span class="leader-name">${c.name}</span>
              <span class="leader-stat">${c.stat}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderWinProbability(summary, game) {
    const points = summary.winprobability || [];
    return `
      <div class="chart-container">
        ${WinProbabilityChart.render(points, game.homeTeam, game.awayTeam)}
      </div>
    `;
  }

  renderDrives(summary, game) {
    const drivesObj = summary.drives || {};
    const previous = drivesObj.previous || [];
    const current = drivesObj.current;

    const allDrives = current ? [current, ...previous] : previous;
    if (allDrives.length === 0) {
      return '<div style="color:var(--text-muted);text-align:center;padding:20px;">Drive data unavailable.</div>';
    }

    return `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${allDrives.map((d, i) => {
          const isTD = d.result === 'TD';
          const isFG = d.result === 'FG';
          const badgeClass = isTD ? 'badge-live' : (isFG ? 'badge-redzone' : 'badge-final');

          return `
            <div style="background:var(--bg-card);padding:10px 14px;border-radius:var(--radius-md);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-weight:700;font-size:0.85rem;color:var(--text-bright);">${d.team?.displayName || 'Drive'}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">${d.description || `${d.offensivePlays || 0} plays`}</div>
              </div>
              <span class="badge ${badgeClass}">${d.displayResult || d.result || 'Punt'}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}
