import { NFLApiClient } from './api.js';
import { NFLAudioEngine } from './audio.js';
import { ScoreboardRenderer } from './renderer.js';
import { GameDetailsModal } from './modal.js';
import { NFLSimulator } from './simulation.js';

/**
 * Main NFL Scoreboard Application Controller
 */
class NFLScoreboardApp {
  constructor() {
    this.api = new NFLApiClient();
    this.audio = new NFLAudioEngine();
    this.modal = new GameDetailsModal(this.api);
    this.simulator = new NFLSimulator();

    this.renderer = new ScoreboardRenderer({
      onGameSelect: (game) => this.handleGameSelect(game)
    });

    // App State
    this.currentData = null;
    this.activeFilter = 'all'; // 'all', 'live', 'redzone', 'upcoming', 'final'
    this.activeView = 'grid'; // 'grid', 'theater', 'ticker'
    this.activeGame = null;
    this.selectedWeek = null; // null = current week
    this.scaleFactor = parseFloat(localStorage.getItem('nfl_scale_factor') || '1.0');

    // Polling State
    this.pollInterval = 15; // seconds
    this.secondsRemaining = this.pollInterval;
    this.pollTimerId = null;
    this.countdownTimerId = null;
    this.isPaused = false;

    // DOM Elements
    this.mainContainer = document.getElementById('main-container');
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.viewButtons = document.querySelectorAll('.view-btn');
    this.countdownCircle = document.getElementById('countdown-circle');
    this.pollSecondsEl = document.getElementById('poll-seconds');
    this.refreshBtn = document.getElementById('btn-refresh');
    this.fullscreenBtn = document.getElementById('btn-fullscreen');
    this.soundBtn = document.getElementById('btn-sound');
    this.demoBtn = document.getElementById('btn-demo');
    this.weekSelect = document.getElementById('week-select');
    this.byeTeamsEl = document.getElementById('bye-teams-container');
    this.scaleDownBtn = document.getElementById('scale-down');
    this.scaleUpBtn = document.getElementById('scale-up');
    this.scaleDisplayEl = document.getElementById('scale-display');
  }

  async init() {
    this.applyScale();
    this.updateSoundButtonUI();
    this.populateWeekOptions();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();

    // Initial fetch
    await this.refresh();

    // Start auto-polling
    this.startPolling();
  }

  setupEventListeners() {
    // Filter buttons
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.render();
      });
    });

    // View switcher buttons
    this.viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeView = btn.dataset.view;
        this.render();
      });
    });

    // Manual Refresh
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => {
        this.refresh();
      });
    }

    // Fullscreen Toggle
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    // Sound Toggle
    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', () => {
        this.audio.init();
        const isMuted = this.audio.toggleMute();
        this.updateSoundButtonUI();
      });
    }

    // Demo Mode Toggle
    if (this.demoBtn) {
      this.demoBtn.addEventListener('click', () => {
        this.toggleDemoMode();
      });
    }

    // Week selector
    if (this.weekSelect) {
      this.weekSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.selectedWeek = val === 'current' ? null : parseInt(val, 10);
        this.refresh();
      });
    }

    // Scaling controls
    if (this.scaleDownBtn) {
      this.scaleDownBtn.addEventListener('click', () => {
        this.scaleFactor = Math.max(0.65, Math.round((this.scaleFactor - 0.05) * 100) / 100);
        this.applyScale();
      });
    }
    if (this.scaleUpBtn) {
      this.scaleUpBtn.addEventListener('click', () => {
        this.scaleFactor = Math.min(1.4, Math.round((this.scaleFactor + 0.05) * 100) / 100);
        this.applyScale();
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is inside an input or select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'r':
          e.preventDefault();
          this.refresh();
          break;
        case 'm':
          e.preventDefault();
          this.audio.init();
          this.audio.toggleMute();
          this.updateSoundButtonUI();
          break;
        case ' ':
          e.preventDefault();
          this.togglePause();
          break;
        case '1':
          this.setView('grid');
          break;
        case '2':
          this.setView('theater');
          break;
        case '3':
          this.setView('ticker');
          break;
        case '?':
          this.openShortcutsModal();
          break;
      }
    });
  }

  applyScale() {
    document.documentElement.style.setProperty('--scale-factor', this.scaleFactor);
    if (this.scaleDisplayEl) {
      this.scaleDisplayEl.textContent = `${Math.round(this.scaleFactor * 100)}%`;
    }
    localStorage.setItem('nfl_scale_factor', this.scaleFactor.toString());
  }

  updateSoundButtonUI() {
    if (!this.soundBtn) return;
    if (this.audio.isMuted) {
      this.soundBtn.innerHTML = '<span>🔇</span><span>Muted</span>';
      this.soundBtn.classList.remove('active');
    } else {
      this.soundBtn.innerHTML = '<span>🔊</span><span>Sound On</span>';
      this.soundBtn.classList.add('active');
    }
  }

  populateWeekOptions() {
    if (!this.weekSelect) return;
    this.weekSelect.innerHTML = `
      <option value="current">Current Week</option>
      ${Array.from({ length: 18 }, (_, i) => `
        <option value="${i + 1}">Week ${i + 1}</option>
      `).join('')}
      <option value="19">Wild Card</option>
      <option value="20">Divisional</option>
      <option value="21">Conf Champ</option>
      <option value="22">Super Bowl</option>
    `;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.pollSecondsEl) {
      this.pollSecondsEl.textContent = this.isPaused ? 'PAUSED' : `${this.secondsRemaining}s`;
    }
  }

  setView(viewName) {
    this.activeView = viewName;
    this.viewButtons.forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });
    this.render();
  }

  toggleDemoMode() {
    if (this.simulator.isActive) {
      this.simulator.stop();
      this.demoBtn.classList.remove('active');
      this.demoBtn.innerHTML = '<span>⚡</span><span>Demo Off</span>';
      this.refresh();
    } else {
      this.demoBtn.classList.add('active');
      this.demoBtn.innerHTML = '<span>⚡</span><span>Demo Active</span>';
      this.simulator.start((simData) => {
        this.handleScoreboardData(simData);
      });
    }
  }

  async refresh() {
    if (this.simulator.isActive) return;

    try {
      this.secondsRemaining = this.pollInterval;
      this.updateCountdownRing();

      const options = {};
      if (this.selectedWeek) {
        options.week = this.selectedWeek;
      }

      const data = await this.api.fetchScoreboard(options);
      this.handleScoreboardData(data);
    } catch (err) {
      console.error('Fetch error:', err);
      if (this.mainContainer && !this.currentData) {
        this.mainContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-text">Failed to connect to NFL live score feed.</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${err.message}</div>
            <button class="ctrl-btn" onclick="location.reload()" style="margin-top:12px;">Retry Now</button>
          </div>
        `;
      }
    }
  }

  handleScoreboardData(data) {
    this.currentData = data;

    // Check for score alert triggers across games
    const scoreChanges = data.events.filter(e => e.scoreChanged);
    scoreChanges.forEach(e => {
      const chg = e.scoreChanged;
      if (chg.type === 'TD') {
        this.audio.playTouchdown();
      } else if (chg.type === 'FG') {
        this.audio.playFieldGoal();
      }
    });

    this.updateHeaderBadges(data);
    this.render();
    document.body.dataset.rendered = "true";
  }

  updateHeaderBadges(data) {
    const events = data.events || [];
    const liveCount = events.filter(e => e.state === 'in').length;
    const redZoneCount = events.filter(e => e.situation?.isRedZone && !e.isHalftime).length;
    const upcomingCount = events.filter(e => e.state === 'pre').length;
    const finalCount = events.filter(e => e.state === 'post').length;

    // Update filter counts
    this.setFilterCount('all', events.length);
    this.setFilterCount('live', liveCount);
    this.setFilterCount('redzone', redZoneCount);
    this.setFilterCount('upcoming', upcomingCount);
    this.setFilterCount('final', finalCount);

    // Update Bye Teams
    if (this.byeTeamsEl && data.teamsOnBye?.length > 0) {
      this.byeTeamsEl.innerHTML = `
        <span>BYE:</span>
        ${data.teamsOnBye.map(t => `<span class="bye-chip" title="${t.displayName}">${t.abbr}</span>`).join('')}
      `;
    }
  }

  setFilterCount(filterName, count) {
    const el = document.getElementById(`count-${filterName}`);
    if (el) el.textContent = count;
  }

  getFilteredGames() {
    if (!this.currentData?.events) return [];
    const all = this.currentData.events;

    switch (this.activeFilter) {
      case 'live':
        return all.filter(g => g.state === 'in');
      case 'redzone':
        return all.filter(g => g.situation?.isRedZone && !g.isHalftime);
      case 'upcoming':
        return all.filter(g => g.state === 'pre');
      case 'final':
        return all.filter(g => g.state === 'post');
      default:
        return all;
    }
  }

  render() {
    if (!this.mainContainer || !this.currentData) return;

    const games = this.getFilteredGames();

    if (this.activeView === 'theater') {
      this.renderer.renderTheater(this.mainContainer, this.activeGame, this.currentData.events);
    } else if (this.activeView === 'ticker') {
      this.renderer.renderTicker(this.mainContainer, games);
    } else {
      this.renderer.renderGrid(this.mainContainer, games);
    }
  }

  handleGameSelect(game) {
    this.activeGame = game;
    if (this.activeView === 'theater') {
      this.render();
    } else {
      // Open detailed modal
      this.modal.open(game);
    }
  }

  startPolling() {
    this.stopPolling();

    // 1-second interval to update countdown UI
    this.countdownTimerId = setInterval(() => {
      if (this.isPaused) return;

      this.secondsRemaining -= 1;
      if (this.secondsRemaining <= 0) {
        this.refresh();
      } else {
        this.updateCountdownRing();
      }
    }, 1000);
  }

  stopPolling() {
    if (this.countdownTimerId) clearInterval(this.countdownTimerId);
  }

  updateCountdownRing() {
    if (this.pollSecondsEl) {
      this.pollSecondsEl.textContent = `${this.secondsRemaining}s`;
    }

    if (this.countdownCircle) {
      const circumference = 56.5; // 2 * PI * r (r=9)
      const offset = circumference * (1 - this.secondsRemaining / this.pollInterval);
      this.countdownCircle.style.strokeDashoffset = offset;
    }
  }

  openShortcutsModal() {
    alert(
      "Keyboard Shortcuts:\n\n" +
      "F - Toggle Fullscreen Mode\n" +
      "R - Refresh Scores Instantly\n" +
      "M - Mute / Unmute Audio Alerts\n" +
      "Space - Pause / Resume Polling\n" +
      "1 - Grid View (All Games)\n" +
      "2 - Theater / Focus View\n" +
      "3 - Compact Ticker View\n" +
      "? - Show Shortcuts"
    );
  }
}

// Bootstrap app on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  const app = new NFLScoreboardApp();
  app.init();
  window.__nflApp = app;
});
