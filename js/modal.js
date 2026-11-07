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
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) this.close();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  isOpen() {
    return this.modalEl?.classList.contains('open');
  }

  close() {
    this.modalEl?.classList.remove('open');
  }

  async open(game) {
    this.currentGame = game;
    this.titleEl.textContent = `${game.awayTeam.displayName} @ ${game.homeTeam.displayName}`;
    this.modalEl.classList.add('open');

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

    const keyLabels = [
      '1st Downs',
      'Total Yards',
      'Passing Yards',
      'Rushing Yards',
      'Turnovers',
      'Possession',
      '3rd down efficiency',
      '4th down efficiency',
      'Sacks'
    ];

    return `
      <div class="stats-comparison">
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem;padding-bottom:10px;border-bottom:1px solid var(--border-subtle);">
          <span style="color:${game.awayTeam.color}">${game.awayTeam.abbr}</span>
          <span style="color:var(--text-muted);font-size:0.8rem;text-transform:uppercase;">Stat Category</span>
          <span style="color:${game.homeTeam.color}">${game.homeTeam.abbr}</span>
        </div>

        ${keyLabels.map(label => {
          const aStat = awayStats.find(s => s.label.toLowerCase() === label.toLowerCase());
          const hStat = homeStats.find(s => s.label.toLowerCase() === label.toLowerCase());
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
                <span class="stat-title">${label}</span>
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
