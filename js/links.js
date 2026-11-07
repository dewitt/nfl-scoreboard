import { NFL_PRO_GAMES } from './nflProGames.js';

/**
 * Helper to generate streaming and archive links for NFL games
 */
export function getGameWatchLinks(game) {
  if (!game) return [];

  const isLive = game.state === 'in';
  const isPost = game.state === 'post';
  const broadcast = (game.broadcast || '').toLowerCase();
  const awayName = game.awayTeam?.displayName || game.awayTeam?.name || 'Away';
  const homeName = game.homeTeam?.displayName || game.homeTeam?.name || 'Home';
  const query = encodeURIComponent(`NFL ${awayName} vs ${homeName}`);

  const seasonYear = game.seasonYear || new Date(game.date || Date.now()).getFullYear();
  const seasonTypeNum = game.seasonType || 2;
  const seasonTypeStr = seasonTypeNum === 3 ? 'post' : (seasonTypeNum === 1 ? 'pre' : 'reg');
  const weekNum = game.weekNumber || 1;

  // Slug: e.g. "jaguars", "ravens", "buccaneers", "cowboys"
  const awaySlug = (game.awayTeam?.name || game.awayTeam?.shortDisplayName || game.awayTeam?.abbr || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const homeSlug = (game.homeTeam?.name || game.homeTeam?.shortDisplayName || game.homeTeam?.abbr || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const awayAbbr = (game.awayTeam?.abbr || '').toLowerCase();
  const homeAbbr = (game.homeTeam?.abbr || '').toLowerCase();

  // Exact NFL.com Game Center slug format:
  // e.g. https://www.nfl.com/games/jaguars-at-ravens-2026-reg-9
  const nflGameUrl = `https://www.nfl.com/games/${awaySlug}-at-${homeSlug}-${seasonYear}-${seasonTypeStr}-${weekNum}`;

  // NFL Pro lookup
  const canonicalSlug = `${awaySlug}-at-${homeSlug}-${seasonYear}-${seasonTypeStr}-${weekNum}`;
  const shortKey = `${seasonYear}-${seasonTypeStr}-${weekNum}-${awayAbbr}-${homeAbbr}`;
  const proGameInfo = NFL_PRO_GAMES[canonicalSlug] || NFL_PRO_GAMES[shortKey];

  // Deep film link: specific game film if UUID is known, else week-level film cards
  const proWeekSlug = proGameInfo?.weekSlug || (seasonTypeNum === 3 ? 'WC' : `WEEK_${weekNum}`);
  const proFilmUrl = proGameInfo?.id
    ? `https://pro.nfl.com/film/plays?season=${proGameInfo.season || seasonYear}&seasonType=${proGameInfo.seasonType || seasonTypeStr.toUpperCase()}&weekSlug=${proWeekSlug}&gameId=${proGameInfo.id}`
    : `https://pro.nfl.com/film/plays?season=${seasonYear}&seasonType=${seasonTypeStr.toUpperCase()}&weekSlug=${proWeekSlug}&displayGameFilmCards=true`;

  const proGameCenterUrl = proGameInfo?.id
    ? `https://pro.nfl.com/games/game/${proGameInfo.id}`
    : `https://pro.nfl.com/games/scores/${seasonYear}/${seasonTypeStr.toUpperCase()}/${weekNum}`;

  const links = [];

  if (isLive) {
    // 1. Prime Video if TNF or broadcast on Prime
    if (broadcast.includes('prime') || broadcast.includes('amazon')) {
      links.push({
        label: 'Prime Video',
        url: 'https://www.amazon.com/gp/video/storefront?benefitId=tnf',
        icon: '▶',
        badgeClass: 'badge-watch-prime'
      });
    }
    // 2. YouTube TV Live Matchup
    links.push({
      label: 'YouTube TV',
      url: `https://tv.youtube.com/search/${query}`,
      icon: '📺',
      badgeClass: 'badge-watch-yt'
    });
    // 3. NFL.com Game Center
    links.push({
      label: 'NFL.com Game Center',
      url: nflGameUrl,
      icon: '🏈',
      badgeClass: 'badge-watch-nfl'
    });
  } else if (isPost) {
    // 1. NFL Pro All-22 Game Film
    links.push({
      label: 'NFL Pro (All-22)',
      shortLabel: '🎬 All-22',
      url: proFilmUrl,
      icon: '🎬',
      badgeClass: 'badge-watch-pro'
    });
    // 2. Official NFL.com Game Center / Highlights
    links.push({
      label: 'NFL.com Game Center',
      shortLabel: '🏈 NFL.com',
      url: nflGameUrl,
      icon: '🏈',
      badgeClass: 'badge-watch-nfl'
    });
    // 3. NFL Pro Game Center (Modal only)
    if (proGameCenterUrl) {
      links.push({
        label: 'NFL Pro Analytics',
        shortLabel: 'NFL Pro Stats',
        url: proGameCenterUrl,
        icon: '📈',
        badgeClass: 'badge-watch-pro',
        modalOnly: true
      });
    }
    // 4. YouTube TV Library Replay
    links.push({
      label: 'YouTube TV Replay',
      shortLabel: '📺 YouTube TV',
      url: `https://tv.youtube.com/search/${query}`,
      icon: '📺',
      badgeClass: 'badge-watch-yt'
    });

    // Team specific film rooms
    if (game.awayTeam?.abbr) {
      links.push({
        label: `${game.awayTeam.abbr} Film Room`,
        shortLabel: `${game.awayTeam.abbr} Film`,
        url: `https://pro.nfl.com/teams/team/${game.awayTeam.abbr}/film-room`,
        icon: '🎞️',
        badgeClass: 'badge-watch-team-film',
        modalOnly: true
      });
    }
    if (game.homeTeam?.abbr) {
      links.push({
        label: `${game.homeTeam.abbr} Film Room`,
        shortLabel: `${game.homeTeam.abbr} Film`,
        url: `https://pro.nfl.com/teams/team/${game.homeTeam.abbr}/film-room`,
        icon: '🎞️',
        badgeClass: 'badge-watch-team-film',
        modalOnly: true
      });
    }
  } else {
    // Upcoming
    if (broadcast.includes('prime') || broadcast.includes('amazon')) {
      links.push({
        label: 'Prime Video',
        url: 'https://www.amazon.com/gp/video/storefront?benefitId=tnf',
        icon: '▶',
        badgeClass: 'badge-watch-prime'
      });
    } else {
      links.push({
        label: 'YouTube TV',
        url: `https://tv.youtube.com/search/${query}`,
        icon: '📺',
        badgeClass: 'badge-watch-yt'
      });
    }
    links.push({
      label: 'NFL.com Preview',
      url: nflGameUrl,
      icon: '🏈',
      badgeClass: 'badge-watch-nfl'
    });
  }

  // ESPN Gamecast / Recap
  const espnUrl = (isPost ? game.espnLinks?.recap : game.espnLinks?.gamecast) ||
                  `https://www.espn.com/nfl/game/_/gameId/${game.id}`;
  links.push({
    label: isPost ? 'ESPN Recap' : 'ESPN Gamecast',
    url: espnUrl,
    icon: '📊',
    badgeClass: 'badge-watch-espn'
  });

  return links;
}
