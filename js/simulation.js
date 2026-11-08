/**
 * NFL Game Simulator for Offline Testing & Demo Showcases
 */
export class NFLSimulator {
  constructor() {
    this.isActive = false;
    this.intervalId = null;
    this.onTickCallback = null;

    this.simulatedGames = this.createInitialGames();
  }

  createInitialGames() {
    const away1 = {
      id: '12',
      abbr: 'KC',
      displayName: 'Kansas City Chiefs',
      shortDisplayName: 'Chiefs',
      logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
      color: '#e31837',
      score: 24,
      record: '7-1',
      linescores: [{ value: 7 }, { value: 3 }, { value: 7 }, { value: 7 }]
    };
    const home1 = {
      id: '2',
      abbr: 'BUF',
      displayName: 'Buffalo Bills',
      shortDisplayName: 'Bills',
      logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
      color: '#00338d',
      score: 27,
      record: '6-2',
      linescores: [{ value: 10 }, { value: 7 }, { value: 3 }, { value: 7 }]
    };

    const away2 = {
      id: '33',
      abbr: 'BAL',
      displayName: 'Baltimore Ravens',
      shortDisplayName: 'Ravens',
      logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
      color: '#29126f',
      score: 17,
      record: '5-3',
      linescores: [{ value: 7 }, { value: 7 }, { value: 3 }]
    };
    const home2 = {
      id: '23',
      abbr: 'PIT',
      displayName: 'Pittsburgh Steelers',
      shortDisplayName: 'Steelers',
      logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
      color: '#ffb612',
      score: 14,
      record: '5-2',
      linescores: [{ value: 0 }, { value: 7 }, { value: 7 }]
    };

    return [
      {
        id: 'sim_1',
        seasonYear: 2026,
        seasonType: 2,
        weekNumber: 8,
        name: 'Kansas City Chiefs at Buffalo Bills',
        state: 'in',
        period: 4,
        displayClock: '2:15',
        statusDetail: '2:15 - 4th Quarter',
        statusDescription: 'In Progress',
        broadcast: 'CBS',
        odds: { details: 'BUF -2.5', overUnder: 'O/U 48.5' },
        venue: 'Highmark Stadium, Orchard Park, NY',
        awayTeam: away1,
        homeTeam: home1,
        situation: {
          possessionTeamId: '12',
          possessingTeam: away1,
          defendingTeam: home1,
          down: 3,
          distance: 4,
          yardLine: 88, // In opponent red zone!
          isRedZone: true,
          downDistanceText: '3rd & 4 at BUF 12',
          possessionText: 'BUF 12',
          homeTimeouts: 2,
          awayTimeouts: 1,
          lastPlayText: '(Shotgun) P.Mahomes pass short middle to T.Kelce for 8 yards to BUF 12.',
          driveSummary: '9 plays, 63 yards, 3:14',
          winProbability: { homeWinPct: 58, awayWinPct: 42 }
        }
      },
      {
        id: 'sim_2',
        seasonYear: 2026,
        seasonType: 2,
        weekNumber: 8,
        name: 'Baltimore Ravens at Pittsburgh Steelers',
        state: 'in',
        period: 3,
        displayClock: '8:42',
        statusDetail: '8:42 - 3rd Quarter',
        statusDescription: 'In Progress',
        broadcast: 'FOX',
        odds: { details: 'BAL -3.5', overUnder: 'O/U 41.0' },
        venue: 'Acrisure Stadium, Pittsburgh, PA',
        awayTeam: away2,
        homeTeam: home2,
        situation: {
          possessionTeamId: '33',
          possessingTeam: away2,
          defendingTeam: home2,
          down: 1,
          distance: 10,
          yardLine: 45,
          isRedZone: false,
          downDistanceText: '1st & 10 at PIT 45',
          possessionText: 'PIT 45',
          homeTimeouts: 3,
          awayTimeouts: 3,
          lastPlayText: 'D.Henry right tackle for 15 yards to the PIT 45 (M.Fitzpatrick).',
          driveSummary: '4 plays, 32 yards, 1:45',
          winProbability: { homeWinPct: 41, awayWinPct: 59 }
        }
      },
      {
        id: 'sim_3',
        seasonYear: 2026,
        seasonType: 2,
        weekNumber: 8,
        name: 'Detroit Lions at Green Bay Packers',
        state: 'in',
        isHalftime: true,
        period: 2,
        displayClock: '0:00',
        statusDetail: 'Halftime',
        statusDescription: 'Halftime',
        broadcast: 'NBC',
        odds: { details: 'DET -1.0', overUnder: 'O/U 51.5' },
        venue: 'Lambeau Field, Green Bay, WI',
        awayTeam: {
          id: '8',
          abbr: 'DET',
          displayName: 'Detroit Lions',
          shortDisplayName: 'Lions',
          logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
          color: '#0076b6',
          score: 21,
          record: '6-1',
          linescores: [{ value: 14 }, { value: 7 }]
        },
        homeTeam: {
          id: '9',
          abbr: 'GB',
          displayName: 'Green Bay Packers',
          shortDisplayName: 'Packers',
          logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',
          color: '#203731',
          score: 17,
          record: '5-2',
          linescores: [{ value: 7 }, { value: 10 }]
        },
        situation: null
      },
      {
        id: 'sim_4',
        seasonYear: 2026,
        seasonType: 2,
        weekNumber: 8,
        name: 'San Francisco 49ers at Dallas Cowboys',
        state: 'post',
        statusDetail: 'Final',
        statusDescription: 'Final',
        broadcast: 'FOX',
        odds: { details: 'SF -4.5', overUnder: 'O/U 46.5' },
        venue: 'AT&T Stadium, Arlington, TX',
        awayTeam: {
          id: '25',
          abbr: 'SF',
          displayName: 'San Francisco 49ers',
          shortDisplayName: '49ers',
          logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
          color: '#aa0000',
          score: 30,
          record: '5-4',
          linescores: [{ value: 6 }, { value: 14 }, { value: 7 }, { value: 3 }],
          winner: true
        },
        homeTeam: {
          id: '6',
          abbr: 'DAL',
          displayName: 'Dallas Cowboys',
          shortDisplayName: 'Cowboys',
          logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
          color: '#041e42',
          score: 24,
          record: '3-5',
          linescores: [{ value: 7 }, { value: 3 }, { value: 7 }, { value: 7 }]
        },
        situation: null
      },
      {
        id: 'sim_5',
        seasonYear: 2026,
        seasonType: 2,
        weekNumber: 8,
        name: 'Philadelphia Eagles at Washington Commanders',
        state: 'pre',
        statusDetail: '8:20 PM EST',
        statusDescription: 'Scheduled',
        broadcast: 'NBC',
        odds: { details: 'PHI -2.5', overUnder: 'O/U 47.0' },
        venue: 'Northwest Stadium, Landover, MD',
        awayTeam: {
          id: '21',
          abbr: 'PHI',
          displayName: 'Philadelphia Eagles',
          shortDisplayName: 'Eagles',
          logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
          color: '#004c54',
          score: 0,
          record: '5-2',
          linescores: []
        },
        homeTeam: {
          id: '28',
          abbr: 'WSH',
          displayName: 'Washington Commanders',
          shortDisplayName: 'Commanders',
          logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png',
          color: '#5a1414',
          score: 0,
          record: '6-2',
          linescores: []
        },
        situation: null
      }
    ];
  }

  start(onTick) {
    this.isActive = true;
    this.onTickCallback = onTick;

    // Run simulation tick every 4 seconds
    this.intervalId = setInterval(() => this.tick(), 4000);
    this.tick();
  }

  stop() {
    this.isActive = false;
    if (this.intervalId) clearInterval(this.intervalId);
  }

  tick() {
    if (!this.isActive) return;

    // Pick a live game with an active situation to advance
    const activeDriveGames = this.simulatedGames.filter(g => g.state === 'in' && g.situation);
    let scoreChanged = null;

    if (activeDriveGames.length > 0) {
      const game = activeDriveGames[Math.floor(Math.random() * activeDriveGames.length)];
      const sit = game.situation;

      // Advance drive
      if (sit.yardLine >= 96) {
        // TOUCHDOWN!
        const scoringTeam = sit.possessionTeamId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
        scoringTeam.score += 7;
        sit.lastPlayText = `TOUCHDOWN! ${scoringTeam.displayName} pass for 4 yards into the endzone!`;
        sit.yardLine = 25; // Touchback
        sit.down = 1;
        sit.distance = 10;
        sit.isRedZone = false;

        // Switch possession
        sit.possessionTeamId = sit.possessionTeamId === game.homeTeam.id ? game.awayTeam.id : game.homeTeam.id;
        sit.possessingTeam = sit.possessionTeamId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
        sit.defendingTeam = sit.possessingTeam === game.homeTeam ? game.awayTeam : game.homeTeam;
        sit.possessionChanged = true;
        sit.downDistanceText = `1st & 10 at ${sit.possessingTeam.abbr} 25`;
        sit.possessionText = `${sit.possessingTeam.abbr} 25`;

        scoreChanged = {
          team: scoringTeam,
          diff: 7,
          type: 'TD'
        };
      } else {
        sit.possessionChanged = false;
        // Normal gain
        const gain = Math.floor(Math.random() * 8) + 1;
        sit.yardLine = Math.min(98, sit.yardLine + gain);
        sit.distance = Math.max(1, sit.distance - gain);
        const targetTeam = sit.yardLine <= 50 ? sit.possessingTeam : sit.defendingTeam;
        const targetYard = sit.yardLine <= 50 ? sit.yardLine : 100 - sit.yardLine;
        const targetYdStr = `${targetTeam?.abbr || 'OPP'} ${targetYard}`;
        sit.possessionText = targetYdStr;

        if (sit.distance <= 0) {
          sit.down = 1;
          sit.distance = 10;
          sit.lastPlayText = `Gain of ${gain} yards to ${targetYdStr}. 1st Down!`;
        } else {
          sit.down = Math.min(4, sit.down + 1);
          sit.lastPlayText = `Gain of ${gain} yards to ${targetYdStr}.`;
        }
        const suffix = sit.down === 1 ? '1st' : (sit.down === 2 ? '2nd' : (sit.down === 3 ? '3rd' : '4th'));
        sit.downDistanceText = `${suffix} & ${sit.distance === 0 ? 'Goal' : sit.distance} at ${targetYdStr}`;
        sit.isRedZone = sit.yardLine >= 80;
      }

      // Nudge win probability
      if (sit.winProbability) {
        const delta = Math.round(Math.random() * 4 - 2);
        sit.winProbability.homeWinPct = Math.max(5, Math.min(95, sit.winProbability.homeWinPct + delta));
        sit.winProbability.awayWinPct = 100 - sit.winProbability.homeWinPct;
      }

      game.scoreChanged = scoreChanged;
    }

    if (this.onTickCallback) {
      this.onTickCallback({
        seasonYear: 2026,
        seasonType: 2,
        weekNumber: 8,
        teamsOnBye: [
          { abbr: 'SF', displayName: 'San Francisco 49ers', name: 'San Francisco 49ers' },
          { abbr: 'HOU', displayName: 'Houston Texans', name: 'Houston Texans' }
        ],
        events: this.simulatedGames
      });
    }
  }
}

/**
 * Synthesize a realistic game summary for simulated/demo games.
 */
export function getSimulatedSummary(eventId, simGames = []) {
  const game = simGames.find(g => g.id === eventId);
  if (!game) return null;

  const away = game.awayTeam;
  const home = game.homeTeam;
  const isPre = game.state === 'pre';

  const stats = isPre ? [
    { label: 'Points Per Game', away: '28.4', home: '27.1' },
    { label: 'Total Yards / Game', away: '382.4', home: '365.8' },
    { label: 'Passing Yards / Game', away: '264.2', home: '241.5' },
    { label: 'Rushing Yards / Game', away: '118.2', home: '124.3' },
    { label: 'Points Allowed / Game', away: '18.5', home: '21.0' },
    { label: 'Yards Allowed / Game', away: '310.2', home: '335.4' },
    { label: 'Pass Yards Allowed', away: '198.0', home: '220.5' },
    { label: 'Rush Yards Allowed', away: '112.2', home: '114.9' }
  ] : [
    { label: '1st Downs', away: '21', home: '23' },
    { label: 'Total Yards', away: '348', home: '372' },
    { label: 'Passing Yards', away: '254', home: '265' },
    { label: 'Rushing Yards', away: '94', home: '107' },
    { label: 'Turnovers', away: '1', home: '0' },
    { label: 'Possession', away: '28:15', home: '31:45' },
    { label: '3rd down efficiency', away: '5-12', home: '7-13' },
    { label: '4th down efficiency', away: '1-1', home: '0-1' },
    { label: 'Sacks', away: '2-14', home: '3-21' }
  ];

  return {
    boxscore: {
      teams: [
        {
          team: { id: away.id, displayName: away.displayName, abbreviation: away.abbr, logo: away.logo, color: away.color },
          statistics: stats.map(s => ({ label: s.label, name: s.label.toLowerCase().replace(/[^a-z]/g, ''), displayValue: s.away }))
        },
        {
          team: { id: home.id, displayName: home.displayName, abbreviation: home.abbr, logo: home.logo, color: home.color },
          statistics: stats.map(s => ({ label: s.label, name: s.label.toLowerCase().replace(/[^a-z]/g, ''), displayValue: s.home }))
        }
      ]
    },
    scoringPlays: isPre ? [] : [
      {
        period: { number: 1 },
        clock: { displayValue: '9:42' },
        text: `${away.shortDisplayName || away.abbr} 24 yd field goal.`,
        awayScore: 3,
        homeScore: 0,
        scoringType: { displayName: 'Field Goal' }
      },
      {
        period: { number: 1 },
        clock: { displayValue: '2:15' },
        text: `${home.shortDisplayName || home.abbr} 18 yd pass from QB to WR for TOUCHDOWN (Kick good).`,
        awayScore: 3,
        homeScore: 7,
        scoringType: { displayName: 'Touchdown' }
      },
      {
        period: { number: 2 },
        clock: { displayValue: '8:30' },
        text: `${away.shortDisplayName || away.abbr} 4 yd rush for TOUCHDOWN (Kick good).`,
        awayScore: 10,
        homeScore: 7,
        scoringType: { displayName: 'Touchdown' }
      },
      {
        period: { number: 3 },
        clock: { displayValue: '4:11' },
        text: `${home.shortDisplayName || home.abbr} 38 yd field goal.`,
        awayScore: 10,
        homeScore: 10,
        scoringType: { displayName: 'Field Goal' }
      }
    ],
    leaders: [
      {
        team: { id: away.id, abbreviation: away.abbr, displayName: away.displayName, logo: away.logo, color: away.color },
        leaders: [
          {
            displayName: 'Passing Leader',
            leaders: [{ athlete: { displayName: `${away.abbr} Starting QB`, headshot: { href: 'https://a.espncdn.com/i/headshots/nfl/players/full/default.png' } }, displayValue: '22/31, 254 YDS, 1 TD' }]
          },
          {
            displayName: 'Rushing Leader',
            leaders: [{ athlete: { displayName: `${away.abbr} Lead RB`, headshot: { href: 'https://a.espncdn.com/i/headshots/nfl/players/full/default.png' } }, displayValue: '18 CAR, 82 YDS, 1 TD' }]
          },
          {
            displayName: 'Receiving Leader',
            leaders: [{ athlete: { displayName: `${away.abbr} WR1`, headshot: { href: 'https://a.espncdn.com/i/headshots/nfl/players/full/default.png' } }, displayValue: '7 REC, 98 YDS' }]
          }
        ]
      },
      {
        team: { id: home.id, abbreviation: home.abbr, displayName: home.displayName, logo: home.logo, color: home.color },
        leaders: [
          {
            displayName: 'Passing Leader',
            leaders: [{ athlete: { displayName: `${home.abbr} Starting QB`, headshot: { href: 'https://a.espncdn.com/i/headshots/nfl/players/full/default.png' } }, displayValue: '25/36, 265 YDS, 1 TD' }]
          },
          {
            displayName: 'Rushing Leader',
            leaders: [{ athlete: { displayName: `${home.abbr} Lead RB`, headshot: { href: 'https://a.espncdn.com/i/headshots/nfl/players/full/default.png' } }, displayValue: '19 CAR, 94 YDS' }]
          },
          {
            displayName: 'Receiving Leader',
            leaders: [{ athlete: { displayName: `${home.abbr} WR1`, headshot: { href: 'https://a.espncdn.com/i/headshots/nfl/players/full/default.png' } }, displayValue: '8 REC, 112 YDS, 1 TD' }]
          }
        ]
      }
    ],
    winprobability: isPre ? [] : [
      { homeWinPercentage: 0.52, playId: '1' },
      { homeWinPercentage: 0.46, playId: '2' },
      { homeWinPercentage: 0.62, playId: '3' },
      { homeWinPercentage: 0.48, playId: '4' },
      { homeWinPercentage: 0.55, playId: '5' },
      { homeWinPercentage: (game.situation?.winProbability?.homeWinPct ?? 50) / 100, playId: '6' }
    ],
    drives: {
      previous: isPre ? [] : [
        {
          team: { abbreviation: away.abbr, displayName: away.displayName },
          description: '10 plays, 68 yards, 4:18',
          result: 'Field Goal',
          plays: 10,
          yards: 68
        },
        {
          team: { abbreviation: home.abbr, displayName: home.displayName },
          description: '6 plays, 75 yards, 2:45',
          result: 'Touchdown',
          plays: 6,
          yards: 75
        },
        {
          team: { abbreviation: away.abbr, displayName: away.displayName },
          description: '8 plays, 72 yards, 3:52',
          result: 'Touchdown',
          plays: 8,
          yards: 72
        }
      ]
    }
  };
}
