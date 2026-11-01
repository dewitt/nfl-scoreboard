import { MiniFieldRenderer } from './field.js';

/**
 * Scoreboard DOM Renderer
 */
export class ScoreboardRenderer {
  constructor(options = {}) {
    this.onGameSelect = options.onGameSelect || (() => {});
  }

  /**
   * Render games in standard Responsive Grid Mode
   */
  renderGrid(container, games) {
    if (!games || games.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-text">No games found for this selection.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="scoreboard-grid" id="main-grid">
        ${games.map(game => this.renderGameCard(game)).join('')}
      </div>
    `;

    // Attach click handlers
    container.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.dataset.gameId;
        const game = games.find(g => g.id === gameId);
        if (game) this.onGameSelect(game);
      });
    });
  }

  /**
   * Render individual game card
   */
  renderGameCard(game) {
    const isLive = game.state === 'in';
    const isRedZone = game.situation?.isRedZone || false;
    const isPost = game.state === 'post';
    const isPre = game.state === 'pre';

    // State class
    let cardClasses = `game-card state-${game.state}`;
    if (isRedZone) cardClasses += ' is-redzone';
    if (game.scoreChanged) cardClasses += ' score-updated';

    // Status badge
    let statusBadge = '';
    if (isLive) {
      statusBadge = `
        <span class="badge badge-live">
          <span class="live-dot"></span>
          ${game.statusDetail || 'LIVE'}
        </span>
      `;
      if (isRedZone) {
        statusBadge += `
          <span class="badge badge-redzone">RED ZONE</span>
        `;
      }
    } else if (isPost) {
      statusBadge = `<span class="badge badge-final">${game.statusDetail || 'FINAL'}</span>`;
    } else {
      statusBadge = `<span class="badge badge-pre">${game.statusDetail || 'UPCOMING'}</span>`;
    }

    return `
      <div class="${cardClasses}" data-game-id="${game.id}">
        <!-- Card Top Bar -->
        <div class="card-header">
          <div class="card-header-left">
            ${statusBadge}
            ${game.broadcast ? `<span class="badge badge-network">${game.broadcast}</span>` : ''}
          </div>
          <div class="card-header-right">
            ${game.odds?.details ? `<span class="card-odds">${game.odds.details}</span>` : ''}
            ${game.venue ? `<span class="card-venue" title="${game.venue}">${game.venue}</span>` : ''}
          </div>
        </div>

        <!-- Teams & Score Area -->
        <div class="card-teams">
          ${this.renderTeamRow(game.awayTeam, game.situation?.possessionTeamId === game.awayTeam.id, game.situation?.awayTimeouts, isLive, isPost)}
          ${this.renderTeamRow(game.homeTeam, game.situation?.possessionTeamId === game.homeTeam.id, game.situation?.homeTimeouts, isLive, isPost)}
        </div>

        <!-- Live Situation & Mini Field Tracker -->
        ${isLive && game.situation ? `
          <div class="situation-bar">
            <span class="situation-down-distance ${game.situation.down === 4 ? 'fourth-down' : ''}">
              ${game.situation.downDistanceText || 'Active Drive'}
            </span>
            <span class="situation-yardline">
              ${game.situation.possessionText || ''}
            </span>
          </div>

          ${MiniFieldRenderer.render(game.situation, game.homeTeam, game.awayTeam)}

          ${game.situation.lastPlayText ? `
            <div class="card-last-play">
              <div>${game.situation.lastPlayText}</div>
              ${game.situation.driveSummary ? `<div class="drive-summary">${game.situation.driveSummary}</div>` : ''}
            </div>
          ` : ''}

          <!-- Win Probability Bar -->
          <div class="wp-container">
            <div class="wp-bar">
              <div class="wp-fill-away" style="width:${game.situation.winProbability.awayWinPct}%;background:${game.awayTeam.color}"></div>
              <div class="wp-fill-home" style="width:${game.situation.winProbability.homeWinPct}%;background:${game.homeTeam.color}"></div>
            </div>
            <div class="wp-labels">
              <span>${game.awayTeam.abbr} ${game.situation.winProbability.awayWinPct}%</span>
              <span>${game.homeTeam.abbr} ${game.situation.winProbability.homeWinPct}%</span>
            </div>
          </div>
        ` : ''}

        <!-- Pre-game odds / Post-game final line -->
        ${isPre && game.odds?.overUnder ? `
          <div style="font-size:0.75rem;color:var(--text-muted);display:flex;justify-content:space-between;padding:4px 0;">
            <span>Line: ${game.odds.details || 'Even'}</span>
            <span>${game.odds.overUnder}</span>
          </div>
        ` : ''}

        <!-- Card Footer -->
        <div class="card-footer">
          <span style="font-size:0.68rem;color:var(--text-muted);">${game.shortName || game.name}</span>
          <button class="card-action-btn">
            <span>Box Score & Stats</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render team row inside card
   */
  renderTeamRow(team, hasPossession, timeouts, isLive, isPost) {
    const isWinner = isPost && team.winner;

    return `
      <div class="team-row ${hasPossession ? 'has-possession' : ''}">
        <div class="team-info">
          <img class="team-logo" src="${team.logo}" alt="${team.abbr}" onerror="this.src='https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/${team.abbr.toLowerCase()}.png'" />
          <div class="team-meta">
            <div class="team-name-group">
              <span class="team-abbr" style="${hasPossession ? `color:${team.color}` : ''}">${team.abbr}</span>
              <span class="team-name">${team.shortDisplayName}</span>
              ${hasPossession && isLive ? `
                <span class="possession-beacon" title="Has Ball">🏈</span>
              ` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="team-record">${team.record}</span>
              ${isLive && timeouts !== undefined ? this.renderTimeouts(timeouts) : ''}
            </div>
          </div>
        </div>

        <div class="team-score-group">
          ${team.linescores?.length > 0 ? this.renderLinescores(team.linescores) : ''}
          <div class="team-score ${isWinner ? 'is-winner' : ''}">${team.score}</div>
        </div>
      </div>
    `;
  }

  /**
   * Render linescores table
   */
  renderLinescores(linescores) {
    return `
      <table class="linescore-table">
        <thead>
          <tr>
            ${linescores.map((_, i) => `<th>${i < 4 ? i + 1 : 'OT'}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            ${linescores.map(ls => `<td>${ls.value}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    `;
  }

  /**
   * Render timeout indicator bars (3 per team)
   */
  renderTimeouts(count = 3) {
    return `
      <div class="timeouts-container" title="${count} timeouts remaining">
        <span class="timeout-bar ${count >= 1 ? 'active' : ''}"></span>
        <span class="timeout-bar ${count >= 2 ? 'active' : ''}"></span>
        <span class="timeout-bar ${count >= 3 ? 'active' : ''}"></span>
      </div>
    `;
  }

  /**
   * Render Compact Ticker / Strip Mode
   */
  renderTicker(container, games) {
    if (!games || games.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-text">No games found.</div></div>';
      return;
    }

    container.innerHTML = `
      <div class="ticker-view">
        ${games.map(game => `
          <div class="ticker-row state-${game.state} ${game.situation?.isRedZone ? 'is-redzone' : ''}" data-game-id="${game.id}">
            <div class="ticker-status">
              <span class="badge ${game.state === 'in' ? 'badge-live' : (game.state === 'post' ? 'badge-final' : 'badge-pre')}">
                ${game.statusDetail || game.statusDescription}
              </span>
            </div>

            <div class="ticker-matchup">
              <div class="ticker-team">
                <img class="ticker-team-logo" src="${game.awayTeam.logo}" alt="" />
                <span class="ticker-team-name">${game.awayTeam.abbr}</span>
                <span class="ticker-score">${game.awayTeam.score}</span>
                ${game.situation?.possessionTeamId === game.awayTeam.id ? '🏈' : ''}
              </div>

              <span style="color:var(--text-muted);font-weight:700;">@</span>

              <div class="ticker-team">
                <img class="ticker-team-logo" src="${game.homeTeam.logo}" alt="" />
                <span class="ticker-team-name">${game.homeTeam.abbr}</span>
                <span class="ticker-score">${game.homeTeam.score}</span>
                ${game.situation?.possessionTeamId === game.homeTeam.id ? '🏈' : ''}
              </div>
            </div>

            <div class="ticker-situation">
              ${game.situation ? `${game.situation.downDistanceText} - ${game.situation.lastPlayText || ''}` : (game.odds?.details || '')}
            </div>

            <div class="ticker-field-wrapper">
              ${game.situation ? MiniFieldRenderer.render(game.situation, game.homeTeam, game.awayTeam) : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.ticker-row').forEach(row => {
      row.addEventListener('click', () => {
        const game = games.find(g => g.id === row.dataset.gameId);
        if (game) this.onGameSelect(game);
      });
    });
  }

  /**
   * Render Focus / Theater Mode
   */
  renderTheater(container, selectedGame, allGames) {
    if (!selectedGame) {
      selectedGame = allGames.find(g => g.state === 'in') || allGames[0];
    }
    if (!selectedGame) return;

    const game = selectedGame;
    const isLive = game.state === 'in';

    container.innerHTML = `
      <div class="theater-layout">
        <!-- Main Stage -->
        <div class="theater-main">
          <div class="stage-header">
            <span class="badge ${isLive ? 'badge-live' : (game.state === 'post' ? 'badge-final' : 'badge-pre')}">
              ${game.statusDetail || game.statusDescription}
            </span>
            <div style="display:flex;gap:12px;color:var(--text-secondary);font-size:0.8rem;font-family:var(--font-mono);">
              ${game.broadcast ? `<span>TV: <strong>${game.broadcast}</strong></span>` : ''}
              ${game.odds?.details ? `<span>Line: <strong>${game.odds.details}</strong></span>` : ''}
              ${game.venue ? `<span>Venue: <strong>${game.venue}</strong></span>` : ''}
            </div>
          </div>

          <!-- Giant Stage Scoreboard -->
          <div class="stage-teams">
            <div class="stage-team away">
              <img class="stage-logo" src="${game.awayTeam.logo}" alt="" />
              <div class="stage-team-details">
                <span class="stage-team-name">${game.awayTeam.displayName}</span>
                <span class="stage-team-record">${game.awayTeam.record}</span>
              </div>
            </div>

            <div class="stage-vs-score">
              <span class="stage-score" style="color:${game.awayTeam.color}">${game.awayTeam.score}</span>
              <span class="stage-score-divider">-</span>
              <span class="stage-score" style="color:${game.homeTeam.color}">${game.homeTeam.score}</span>
            </div>

            <div class="stage-team home">
              <img class="stage-logo" src="${game.homeTeam.logo}" alt="" />
              <div class="stage-team-details">
                <span class="stage-team-name">${game.homeTeam.displayName}</span>
                <span class="stage-team-record">${game.homeTeam.record}</span>
              </div>
            </div>
          </div>

          <!-- Enlarged Field Tracker -->
          ${isLive && game.situation ? `
            <div class="stage-field-box">
              <div class="stage-field-header">
                <span style="font-weight:800;color:var(--accent-gold);font-family:var(--font-mono);font-size:1.1rem;">
                  ${game.situation.downDistanceText}
                </span>
                <span style="color:var(--text-secondary);font-weight:700;">
                  Ball at ${game.situation.possessionText}
                </span>
              </div>

              ${MiniFieldRenderer.render(game.situation, game.homeTeam, game.awayTeam)}

              <div style="font-size:0.85rem;color:var(--text-primary);padding:8px 0;">
                <strong>Last Play:</strong> ${game.situation.lastPlayText}
              </div>
            </div>
          ` : ''}

          <!-- Panels Grid -->
          <div class="stage-panels">
            <div class="stage-panel">
              <div class="stage-panel-title">Game Information</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);display:flex;flex-direction:column;gap:6px;">
                <div><strong>Matchup:</strong> ${game.name}</div>
                <div><strong>Stadium:</strong> ${game.venue || 'NFL Stadium'}</div>
                <div><strong>Network Broadcast:</strong> ${game.broadcast || 'Regional'}</div>
                <div><strong>Spread:</strong> ${game.odds?.details || 'N/A'} (${game.odds?.overUnder || ''})</div>
              </div>
            </div>

            <div class="stage-panel">
              <div class="stage-panel-title">Win Probability</div>
              ${game.situation?.winProbability ? `
                <div class="wp-container" style="padding-top:10px;">
                  <div class="wp-bar" style="height:10px;">
                    <div class="wp-fill-away" style="width:${game.situation.winProbability.awayWinPct}%;background:${game.awayTeam.color}"></div>
                    <div class="wp-fill-home" style="width:${game.situation.winProbability.homeWinPct}%;background:${game.homeTeam.color}"></div>
                  </div>
                  <div class="wp-labels" style="font-size:0.85rem;margin-top:6px;">
                    <span>${game.awayTeam.abbr} ${game.situation.winProbability.awayWinPct}%</span>
                    <span>${game.homeTeam.abbr} ${game.situation.winProbability.homeWinPct}%</span>
                  </div>
                </div>
              ` : '<div style="color:var(--text-muted);font-size:0.8rem;">Available during active games.</div>'}
            </div>
          </div>
        </div>

        <!-- Right Side Rail of all games -->
        <div class="theater-sidebar">
          <div class="theater-sidebar-header">All Games Today</div>
          ${allGames.map(g => `
            <div class="game-card state-${g.state} ${g.id === game.id ? 'is-selected' : ''}" data-game-id="${g.id}" style="${g.id === game.id ? 'border:2px solid var(--accent-blue);' : ''}">
              <div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-bottom:4px;">
                <span class="badge ${g.state === 'in' ? 'badge-live' : (g.state === 'post' ? 'badge-final' : 'badge-pre')}">
                  ${g.statusDetail || g.statusDescription}
                </span>
                <span style="color:var(--text-muted);font-family:var(--font-mono);">${g.odds?.details || ''}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;font-weight:700;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <img src="${g.awayTeam.logo}" style="width:20px;height:20px;" alt="" />
                  <span>${g.awayTeam.abbr}</span>
                </div>
                <span>${g.awayTeam.score}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;font-weight:700;margin-top:2px;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <img src="${g.homeTeam.logo}" style="width:20px;height:20px;" alt="" />
                  <span>${g.homeTeam.abbr}</span>
                </div>
                <span>${g.homeTeam.score}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.theater-sidebar .game-card').forEach(card => {
      card.addEventListener('click', () => {
        const nextGame = allGames.find(g => g.id === card.dataset.gameId);
        if (nextGame) this.renderTheater(container, nextGame, allGames);
      });
    });
  }
}
