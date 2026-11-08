import { WinProbabilityChart } from './chart.js';
import { MiniFieldRenderer } from './field.js';
import { getGameWatchLinks } from './links.js';

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

  isOpen() {
    return this.modalEl?.open || this.modalEl?.classList.contains('open');
  }

  close() {
    if (this.modalEl?.open) {
      this.modalEl.close();
    }
    this.modalEl?.classList.remove('open');
  }

  async open(game) {
    this.currentGame = game;
    this.titleEl.textContent = `${game.awayTeam.displayName} @ ${game.homeTeam.displayName}`;
    
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
      this.summaryData = await this.api.fetchGameSummary(game.id);
      this.render();
    } catch (err) {
      this.bodyEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-text">Failed to load detailed game stats: ${err.message}</div>
        </div>
      `;
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

    return `
      <div class="stats-comparison">
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem;padding-bottom:10px;border-bottom:1px solid var(--border-subtle);">
          <span style="color:${game.awayTeam.color}">${game.awayTeam.abbr}</span>
          <span style="color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;">${categoryTitle}</span>
          <span style="color:${game.homeTeam.color}">${game.homeTeam.abbr}</span>
        </div>

        ${categories.map(cat => {
          const aStat = awayStats.find(s => cat.match.includes(s.label?.toLowerCase()) || cat.match.includes(s.name?.toLowerCase()));
          const hStat = homeStats.find(s => cat.match.includes(s.label?.toLowerCase()) || cat.match.includes(s.name?.toLowerCase()));
          const aVal = aStat?.displayValue || '-';
          const hVal = hStat?.displayValue || '-';

          // Numeric comparison for progress bar if parsable
          const aNum = parseFloat(aVal);
          const hNum = parseFloat(hVal);
          let aPct = 50;
          let hPct = 50;
          if (!isNaN(aNum) && !isNaN(hNum) && (aNum + hNum) > 0) {
            aPct = Math.round((aNum / (aNum + hNum)) * 100);
            hPct = 100 - aPct;
          }

          return `
            <div class="stat-row">
              <div class="stat-labels">
                <span style="font-family:var(--font-mono)">${aVal}</span>
                <span class="stat-title">${cat.label}</span>
                <span style="font-family:var(--font-mono)">${hVal}</span>
              </div>
              <div class="stat-bar-track">
                <div class="stat-bar-away" style="width:${aPct}%;background:${game.awayTeam.color}"></div>
                <div class="stat-bar-home" style="width:${hPct}%;background:${game.homeTeam.color}"></div>
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

    const cards = [];
    leaders.forEach(teamLeaders => {
      const teamLeadArr = teamLeaders.leaders || [];
      teamLeadArr.forEach(leadCat => {
        const topAthlete = leadCat.leaders?.[0];
        if (topAthlete) {
          const ath = topAthlete.athlete || {};
          cards.push({
            category: leadCat.displayName || 'Leader',
            name: ath.displayName || ath.shortName || 'Player',
            photo: ath.headshot || 'https://a.espncdn.com/i/headshots/nfl/players/full/default.png',
            stat: topAthlete.displayValue || ''
          });
        }
      });
    });

    return `
      <div class="leaders-grid">
        ${cards.map(c => `
          <div class="leader-card">
            <img class="leader-photo" src="${c.photo}" alt="${c.name}" onerror="this.src='https://a.espncdn.com/combiner/i?img=/i/headshots/nophoto.png'" />
            <div class="leader-info">
              <span class="leader-category">${c.category}</span>
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
