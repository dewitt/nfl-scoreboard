import { getSimulatedSummary } from './simulation.js';

/**
 * ESPN NFL API Client & Data Normalizer
 */
export class NFLApiClient {
  constructor() {
    this.baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
    this.previousScores = new Map(); // eventId -> { homeScore, awayScore }
    this.previousPossession = new Map(); // eventId -> possessionTeamId
    this.cachedSummary = new Map();
  }

  /**
   * Fetch current scoreboard
   * @param {Object} options - { week, year, seasonType, date }
   */
  async fetchScoreboard(options = {}) {
    const params = new URLSearchParams();
    if (options.date) {
      params.append('dates', options.date);
    } else if (options.week) {
      params.append('week', options.week);
      if (options.seasonType) params.append('seasontype', options.seasonType);
      if (options.year) params.append('dates', options.year);
    }

    params.append('_t', Date.now().toString());
    const url = `${this.baseUrl}/scoreboard${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Scoreboard fetch failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return this.normalizeScoreboard(data);
  }

  /**
   * Fetch detailed game summary
   * @param {string} eventId
   * @param {Array} simGames - Optional simulated games array for demo mode
   */
  async fetchGameSummary(eventId, simGames = []) {
    if (String(eventId).startsWith('sim_')) {
      const simData = getSimulatedSummary(eventId, simGames);
      if (simData) return simData;
    }

    const url = `${this.baseUrl}/summary?event=${eventId}&_t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Game summary fetch failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    this.cachedSummary.set(eventId, data);
    return data;
  }

  /**
   * Normalize ESPN scoreboard payload into clean domain models
   */
  normalizeScoreboard(data) {
    const season = data.season || {};
    const week = data.week || {};
    const seasonYear = season.year || new Date().getFullYear();
    const seasonType = season.type || 2;
    const weekNumber = week.number || 1;
    const events = (data.events || []).map(evt => this.normalizeEvent(evt, { seasonYear, seasonType, weekNumber }));

    return {
      seasonYear,
      seasonType,
      weekNumber,
      teamsOnBye: (week.teamsOnBye || []).map(t => ({
        id: t.id,
        name: t.displayName,
        displayName: t.displayName,
        abbr: t.abbreviation,
        logo: t.logo
      })),
      events
    };
  }

  /**
   * Normalize an individual event
   */
  normalizeEvent(evt, context = {}) {
    const comp = evt.competitions?.[0] || {};
    const competitors = comp.competitors || [];
    const homeComp = competitors.find(c => c.homeAway === 'home') || {};
    const awayComp = competitors.find(c => c.homeAway === 'away') || {};

    const homeTeam = this.normalizeTeam(homeComp);
    const awayTeam = this.normalizeTeam(awayComp);

    const status = evt.status || {};
    const statusType = status.type || {};
    const state = statusType.state || 'pre'; // 'pre', 'in', 'post'
    const statusDesc = statusType.description || '';
    const statusDetail = statusType.shortDetail || statusType.detail || '';
    const isHalftime = statusDesc.toLowerCase().includes('halftime') ||
                       statusDetail.toLowerCase().includes('halftime') ||
                       statusType.name === 'STATUS_HALFTIME';

    // Situation (clear if Halftime or not in progress)
    const sit = comp.situation || {};
    const situation = isHalftime ? null : this.normalizeSituation(sit, homeTeam, awayTeam, state, evt.id);

    // Broadcast
    const broadcasts = (comp.broadcasts || []).flatMap(b => b.names || []);
    const broadcastStr = broadcasts.join(', ') || comp.broadcast || '';

    // Odds
    const oddsObj = comp.odds?.[0] || {};
    const odds = {
      details: oddsObj.details || '',
      overUnder: oddsObj.overUnder ? `O/U ${oddsObj.overUnder}` : '',
      spread: oddsObj.spread || 0
    };

    // Venue
    const venue = comp.venue || {};
    const venueStr = [venue.fullName, venue.address?.city, venue.address?.state].filter(Boolean).join(', ');

    // Score change detection
    const prev = this.previousScores.get(evt.id);
    let scoreChanged = null;

    if (prev && state === 'in') {
      const homeDiff = homeTeam.score - prev.homeScore;
      const awayDiff = awayTeam.score - prev.awayScore;
      if (homeDiff > 0) {
        scoreChanged = {
          team: homeTeam,
          diff: homeDiff,
          type: homeDiff === 6 ? 'TD' : (homeDiff === 3 ? 'FG' : 'SCORE')
        };
      } else if (awayDiff > 0) {
        scoreChanged = {
          team: awayTeam,
          diff: awayDiff,
          type: awayDiff === 6 ? 'TD' : (awayDiff === 3 ? 'FG' : 'SCORE')
        };
      }
    }

    // Update score tracker
    this.previousScores.set(evt.id, {
      homeScore: homeTeam.score,
      awayScore: awayTeam.score
    });

    // Extract ESPN web links
    const espnLinks = (evt.links || []).reduce((acc, l) => {
      const rels = l.rel || [];
      if (rels.includes('summary') || rels.includes('gamecast')) acc.gamecast = l.href;
      if (rels.includes('recap')) acc.recap = l.href;
      if (rels.includes('highlights')) acc.highlights = l.href;
      if (rels.includes('boxscore')) acc.boxscore = l.href;
      return acc;
    }, {});

    return {
      id: evt.id,
      uid: evt.uid,
      name: evt.name,
      shortName: evt.shortName,
      date: evt.date,
      seasonYear: context.seasonYear || evt.season?.year || new Date(evt.date || Date.now()).getFullYear(),
      seasonType: context.seasonType || evt.season?.type || 2,
      weekNumber: context.weekNumber || evt.week?.number || 1,
      state, // 'pre', 'in', 'post'
      isHalftime,
      statusDescription: statusDesc,
      statusDetail: isHalftime ? 'HALFTIME' : statusDetail,
      period: status.period || 0,
      displayClock: status.displayClock || '',
      homeTeam,
      awayTeam,
      situation,
      broadcast: broadcastStr,
      odds,
      venue: venueStr,
      scoreChanged,
      espnLinks
    };
  }

  /**
   * Normalize competitor team
   */
  normalizeTeam(comp) {
    const team = comp.team || {};
    const score = parseInt(comp.score || '0', 10);
    const records = comp.records || [];
    const overallRecord = records.find(r => r.type === 'total' || !r.type)?.summary || records[0]?.summary || '';

    const linescores = (comp.linescores || []).map(ls => ({
      value: ls.value !== undefined ? ls.value : '-'
    }));

    // Primary & alternate brand color
    const primaryColor = team.color ? `#${team.color}` : '#3b82f6';
    const altColor = team.alternateColor ? `#${team.alternateColor}` : '#ffffff';

    return {
      id: team.id || comp.id,
      name: team.name || '',
      displayName: team.displayName || '',
      shortDisplayName: team.shortDisplayName || team.name || '',
      abbr: team.abbreviation || '',
      logo: team.logo || `https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbreviation?.toLowerCase()}.png`,
      color: primaryColor,
      altColor,
      score,
      linescores,
      record: overallRecord,
      winner: comp.winner || false
    };
  }

  /**
   * Normalize live situation
   */
  normalizeSituation(sit, homeTeam, awayTeam, state, eventId) {
    if (state !== 'in' || !sit) {
      return null;
    }

    const possessionId = sit.possession;
    const possessingTeam = possessionId === homeTeam.id ? homeTeam : (possessionId === awayTeam.id ? awayTeam : null);
    const defendingTeam = possessingTeam === homeTeam ? awayTeam : homeTeam;

    // Possession change detection
    let possessionChanged = false;
    if (eventId && possessionId) {
      const prevPossession = this.previousPossession.get(eventId);
      if (prevPossession && prevPossession !== possessionId) {
        possessionChanged = true;
      }
      this.previousPossession.set(eventId, possessionId);
    }

    const down = sit.down && sit.down > 0 ? sit.down : null;
    const distance = sit.distance !== undefined ? sit.distance : null;
    const yardLine = sit.yardLine !== undefined ? sit.yardLine : 50; // 0 to 100 relative to offense
    const isRedZone = !!sit.isRedZone || yardLine >= 80;

    let downDistanceText = sit.downDistanceText || '';
    if (!downDistanceText) {
      if (down && distance !== null) {
        const downSuffix = down === 1 ? '1st' : (down === 2 ? '2nd' : (down === 3 ? '3rd' : '4th'));
        downDistanceText = `${downSuffix} & ${distance === 0 ? 'Goal' : distance}`;
      } else if (sit.lastPlay?.type?.text) {
        downDistanceText = sit.lastPlay.type.text;
      } else {
        downDistanceText = 'Drive in Progress';
      }
    }

    let possessionText = sit.possessionText || '';
    if (!possessionText && yardLine !== undefined) {
      if (yardLine <= 50) {
        possessionText = `${possessingTeam?.abbr || 'OWN'} ${yardLine}`;
      } else {
        possessionText = `${defendingTeam?.abbr || 'OPP'} ${100 - yardLine}`;
      }
    }

    // Last play & win probability
    const lastPlay = sit.lastPlay || {};
    const lastPlayText = lastPlay.text || '';
    const drive = lastPlay.drive || {};
    const driveSummary = drive.description || '';

    // Win probability
    const prob = lastPlay.probability || {};
    const homeWinPct = prob.homeWinPercentage !== undefined ? Math.round(prob.homeWinPercentage * 100) : 50;
    const awayWinPct = 100 - homeWinPct;

    return {
      possessionTeamId: possessionId,
      possessingTeam,
      defendingTeam,
      possessionChanged,
      down,
      distance,
      yardLine, // 0 to 100
      isRedZone,
      downDistanceText,
      shortDownDistance: sit.shortDownDistanceText || downDistanceText,
      possessionText: sit.possessionText || '',
      homeTimeouts: sit.homeTimeouts ?? 3,
      awayTimeouts: sit.awayTimeouts ?? 3,
      lastPlayText,
      driveSummary,
      winProbability: {
        homeWinPct,
        awayWinPct
      }
    };
  }
}
