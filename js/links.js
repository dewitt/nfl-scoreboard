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

  // Slug: e.g. "jaguars", "ravens", "49ers", "chiefs"
  const awaySlug = (game.awayTeam?.name || game.awayTeam?.shortDisplayName || game.awayTeam?.abbr || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const homeSlug = (game.homeTeam?.name || game.homeTeam?.shortDisplayName || game.homeTeam?.abbr || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  // Exact NFL.com Game Center slug format:
  // e.g. https://www.nfl.com/games/jaguars-at-ravens-2026-reg-9
  const nflGameUrl = `https://www.nfl.com/games/${awaySlug}-at-${homeSlug}-${seasonYear}-${seasonTypeStr}-${weekNum}`;

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
    // 1. Official NFL.com Game Center / Highlights
    links.push({
      label: 'NFL.com Game Center',
      url: nflGameUrl,
      icon: '🏈',
      badgeClass: 'badge-watch-nfl'
    });
    // 2. YouTube TV Library Replay
    links.push({
      label: 'YouTube TV Replay',
      url: `https://tv.youtube.com/search/${query}`,
      icon: '📺',
      badgeClass: 'badge-watch-yt'
    });
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
