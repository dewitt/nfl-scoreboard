import { MiniFieldRenderer } from './field.js';
import { getGameWatchLinks } from './links.js';
import { getAccessibleTeamColor } from './colors.js';

/**
 * Scoreboard DOM Renderer
 */
export class ScoreboardRenderer {
  constructor(options = {}) {
    this.onGameSelect = options.onGameSelect || (() => {});
    this.onOpenModal = options.onOpenModal || (() => {});
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
    const isHalftime = game.isHalftime;
    const isLive = game.state === 'in' && !isHalftime;
    const isRedZone = isLive && (game.situation?.isRedZone || false);
    const isPost = game.state === 'post';
    const isPre = game.state === 'pre';

    // State class
    let cardClasses = `game-card state-${game.state}`;
    if (isHalftime) cardClasses += ' is-halftime';
    if (isRedZone) cardClasses += ' is-redzone';
    if (game.scoreChanged) cardClasses += ' score-updated';

    // Status badge
    let statusBadge = '';
    if (isHalftime) {
      statusBadge = `<span class="badge badge-halftime">HALFTIME</span>`;
    } else if (isLive) {
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
      <div class="game-card-wrapper">
        <div class="${cardClasses}" data-game-id="${game.id}" style="view-transition-name: game-${game.id};">
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
          ${this.renderTeamRow(game.awayTeam, game.situation?.possessionTeamId === game.awayTeam.id, game.situation?.awayTimeouts, isLive, isPost, game.situation?.possessionChanged && game.situation?.possessionTeamId === game.awayTeam.id)}
          ${this.renderTeamRow(game.homeTeam, game.situation?.possessionTeamId === game.homeTeam.id, game.situation?.homeTimeouts, isLive, isPost, game.situation?.possessionChanged && game.situation?.possessionTeamId === game.homeTeam.id)}
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
          <div class="card-footer-right">
            ${(() => {
              const watchLinks = getGameWatchLinks(game).filter(l => !l.modalOnly);
              const primary = watchLinks[0];
              return primary ? `
                <a href="${primary.url}" target="_blank" rel="noopener noreferrer" class="card-watch-link ${primary.badgeClass || ''}" onclick="event.stopPropagation();" title="${primary.label}">
                  <span>${primary.icon}</span>
                  <span>${primary.label}</span>
                </a>
              ` : '';
            })()}
            <button class="card-action-btn">
              <span>Box Score & Stats</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * Render team row inside card
   */
  renderTeamRow(team, hasPossession, timeouts, isLive, isPost, possessionChanged = false) {
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
                <span class="possession-beacon ${possessionChanged ? 'just-changed' : ''}" title="Has Ball">🏈</span>
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
   * Render full head-to-head linescore breakdown table for theater view
   */
  renderLinescore(game) {
    const awayLines = game.awayTeam.linescores || [];
    const homeLines = game.homeTeam.linescores || [];
    const periods = Math.max(4, awayLines.length, homeLines.length);

    const headers = [];
    for (let i = 0; i < periods; i++) {
      headers.push(i < 4 ? `${i + 1}` : (i === 4 ? 'OT' : `OT${i - 3}`));
    }

    const awayScoreColor = getAccessibleTeamColor(game.awayTeam.color, 0.75);
    const homeScoreColor = getAccessibleTeamColor(game.homeTeam.color, 0.75);

    return `
      <table class="theater-linescore-table" style="border-collapse:collapse;font-family:var(--font-mono);font-size:0.85rem;text-align:center;width:100%;max-width:440px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border-subtle);color:var(--text-muted);">
            <th style="text-align:left;padding:6px 10px;">Team</th>
            ${headers.map(h => `<th style="padding:6px 8px;">${h}</th>`).join('')}
            <th style="padding:6px 10px;font-weight:700;color:var(--text-primary);">T</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--border-subtle);">
            <td style="text-align:left;padding:6px 10px;font-weight:700;display:flex;align-items:center;gap:6px;">
              <img src="${game.awayTeam.logo}" style="width:18px;height:18px;object-fit:contain;" alt="" />
              <span>${game.awayTeam.abbr}</span>
            </td>
            ${headers.map((_, i) => `<td style="padding:6px 8px;color:var(--text-secondary);">${awayLines[i]?.value !== undefined ? awayLines[i].value : '-'}</td>`).join('')}
            <td style="padding:6px 10px;font-weight:800;color:${awayScoreColor};">${game.awayTeam.score}</td>
          </tr>
          <tr>
            <td style="text-align:left;padding:6px 10px;font-weight:700;display:flex;align-items:center;gap:6px;">
              <img src="${game.homeTeam.logo}" style="width:18px;height:18px;object-fit:contain;" alt="" />
              <span>${game.homeTeam.abbr}</span>
            </td>
            ${headers.map((_, i) => `<td style="padding:6px 8px;color:var(--text-secondary);">${homeLines[i]?.value !== undefined ? homeLines[i].value : '-'}</td>`).join('')}
            <td style="padding:6px 10px;font-weight:800;color:${homeScoreColor};">${game.homeTeam.score}</td>
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
        ${games.map(game => {
          const isHalftime = game.isHalftime;
          const isLive = game.state === 'in' && !isHalftime;
          const isRedZone = isLive && (game.situation?.isRedZone || false);
          const badgeClass = isHalftime ? 'badge-halftime' : (isLive ? 'badge-live' : (game.state === 'post' ? 'badge-final' : 'badge-pre'));

          return `
            <div class="ticker-row state-${game.state} ${isHalftime ? 'is-halftime' : ''} ${isRedZone ? 'is-redzone' : ''}" data-game-id="${game.id}" style="view-transition-name: game-${game.id};">
              <div class="ticker-status">
                <span class="badge ${badgeClass}">
                  ${game.statusDetail || game.statusDescription}
                </span>
              </div>

              <div class="ticker-matchup">
                <div class="ticker-team">
                  <img class="ticker-team-logo" src="${game.awayTeam.logo}" alt="" />
                  <span class="ticker-team-name">${game.awayTeam.abbr}</span>
                  <span class="ticker-score">${game.awayTeam.score}</span>
                  ${game.situation?.possessionTeamId === game.awayTeam.id && isLive ? '🏈' : ''}
                </div>

                <span style="color:var(--text-muted);font-weight:700;">@</span>

                <div class="ticker-team">
                  <img class="ticker-team-logo" src="${game.homeTeam.logo}" alt="" />
                  <span class="ticker-team-name">${game.homeTeam.abbr}</span>
                  <span class="ticker-score">${game.homeTeam.score}</span>
                  ${game.situation?.possessionTeamId === game.homeTeam.id && isLive ? '🏈' : ''}
                </div>
              </div>

              <div class="ticker-situation">
                ${game.situation ? `${game.situation.downDistanceText} - ${game.situation.lastPlayText || ''}` : (game.isHalftime ? 'Halftime Intermission' : (game.odds?.details || ''))}
              </div>

              <div class="ticker-field-wrapper">
                ${game.situation ? MiniFieldRenderer.render(game.situation, game.homeTeam, game.awayTeam) : ''}
              </div>
            </div>
          `;
        }).join('')}
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
    const isHalftime = game.isHalftime;
    const isLive = game.state === 'in' && !isHalftime;
    const badgeClass = isHalftime ? 'badge-halftime' : (isLive ? 'badge-live' : (game.state === 'post' ? 'badge-final' : 'badge-pre'));

    const watchLinks = getGameWatchLinks(game);
    const awayScoreColor = getAccessibleTeamColor(game.awayTeam.color, 0.75);
    const homeScoreColor = getAccessibleTeamColor(game.homeTeam.color, 0.75);

    container.innerHTML = `
      <div class="theater-layout">
        <!-- Main Stage -->
        <div class="theater-main">
          <div class="stage-header">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span class="badge ${badgeClass}">
                ${game.statusDetail || game.statusDescription}
              </span>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                ${watchLinks.slice(0, 3).map(l => `
                  <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="card-watch-link ${l.badgeClass || ''}" title="Open ${l.label}">
                    <span>${l.icon}</span>
                    <span>${l.shortLabel || l.label}</span>
                  </a>
                `).join('')}
                <button class="stage-modal-btn card-action-btn" id="stage-open-modal-btn" style="background:var(--bg-tertiary);padding:3px 10px;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);cursor:pointer;">
                  Box Score &amp; Stats &rarr;
                </button>
              </div>
            </div>
            <div style="display:flex;gap:12px;color:var(--text-secondary);font-size:0.8rem;font-family:var(--font-mono);flex-wrap:wrap;">
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
              <span class="stage-score" style="color:${awayScoreColor}">${game.awayTeam.score}</span>
              <span class="stage-score-divider">-</span>
              <span class="stage-score" style="color:${homeScoreColor}">${game.homeTeam.score}</span>
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
              <div class="stage-panel-title">${game.situation?.winProbability ? 'Win Probability' : 'Linescore Breakdown'}</div>
              ${game.situation?.winProbability ? `
                <div class="wp-container" style="padding-top:10px;">
                  <div class="wp-bar" style="height:10px;">
                    <div class="wp-fill-away" style="width:${game.situation.winProbability.awayWinPct}%;background:${awayScoreColor}"></div>
                    <div class="wp-fill-home" style="width:${game.situation.winProbability.homeWinPct}%;background:${homeScoreColor}"></div>
                  </div>
                  <div class="wp-labels" style="font-size:0.85rem;margin-top:6px;">
                    <span>${game.awayTeam.abbr} ${game.situation.winProbability.awayWinPct}%</span>
                    <span>${game.homeTeam.abbr} ${game.situation.winProbability.homeWinPct}%</span>
                  </div>
                </div>
              ` : (game.homeTeam.linescores?.length > 0 || game.state === 'post' || game.isHalftime) ? `
                <div style="display:flex;justify-content:center;padding:12px 0;">
                  ${this.renderLinescore(game)}
                </div>
              ` : '<div style="color:var(--text-muted);font-size:0.8rem;">Win probability and linescores will appear during the game.</div>'}
            </div>
          </div>
        </div>

        <!-- Right Side Rail of games -->
        <div class="theater-sidebar">
          <div class="theater-sidebar-header">Matchup Selection</div>
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
        if (nextGame) {
          if (this.onGameSelect) {
            this.onGameSelect(nextGame);
          } else {
            this.renderTheater(container, nextGame, allGames);
          }
        }
      });
    });

    const modalBtn = container.querySelector('#stage-open-modal-btn');
    if (modalBtn) {
      modalBtn.addEventListener('click', () => {
        if (this.onOpenModal) this.onOpenModal(game);
      });
    }
  }
}
