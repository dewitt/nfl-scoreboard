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
  const awayAbbr = (game.awayTeam?.abbr || '').toLowerCase();
  const homeAbbr = (game.homeTeam?.abbr || '').toLowerCase();
  const query = encodeURIComponent(`NFL ${awayName} vs ${homeName}`);

  const links = [];

  if (isLive) {
    // Live: Amazon Prime if TNF, otherwise YouTube TV
    if (broadcast.includes('prime') || broadcast.includes('amazon')) {
      links.push({
        label: 'Prime Video',
        url: 'https://www.amazon.com/gp/video/storefront?benefitId=tnf',
        icon: '▶',
        badgeClass: 'badge-watch-prime'
      });
    }
    links.push({
      label: 'YouTube TV',
      url: `https://tv.youtube.com/search/${query}`,
      icon: '📺',
      badgeClass: 'badge-watch-yt'
    });
  } else if (isPost) {
    // Archived / Final: NFL.com and YouTube TV Library
    links.push({
      label: 'NFL.com',
      url: `https://www.nfl.com/games/${awayAbbr}-at-${homeAbbr}`,
      icon: '🏈',
      badgeClass: 'badge-watch-nfl'
    });
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
  }

  // ESPN Gamecast / Recap
  links.push({
    label: isPost ? 'ESPN Recap' : 'ESPN Gamecast',
    url: `https://www.espn.com/nfl/game/_/gameId/${game.id}`,
    icon: '📊',
    badgeClass: 'badge-watch-espn'
  });

  return links;
}
