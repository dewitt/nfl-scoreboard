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
    return [
      {
        id: 'sim_1',
        name: 'Kansas City Chiefs at Buffalo Bills',
        state: 'in',
        period: 4,
        displayClock: '2:15',
        statusDetail: '2:15 - 4th Quarter',
        statusDescription: 'In Progress',
        broadcast: 'CBS',
        odds: { details: 'BUF -2.5', overUnder: 'O/U 48.5' },
        venue: 'Highmark Stadium, Orchard Park, NY',
        awayTeam: {
          id: '12',
          abbr: 'KC',
          displayName: 'Kansas City Chiefs',
          shortDisplayName: 'Chiefs',
          logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
          color: '#e31837',
          score: 24,
          record: '7-1',
          linescores: [{ value: 7 }, { value: 3 }, { value: 7 }, { value: 7 }]
        },
        homeTeam: {
          id: '2',
          abbr: 'BUF',
          displayName: 'Buffalo Bills',
          shortDisplayName: 'Bills',
          logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
          color: '#00338d',
          score: 27,
          record: '6-2',
          linescores: [{ value: 10 }, { value: 7 }, { value: 3 }, { value: 7 }]
        },
        situation: {
          possessionTeamId: '12',
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
        name: 'Baltimore Ravens at Pittsburgh Steelers',
        state: 'in',
        period: 3,
        displayClock: '8:42',
        statusDetail: '8:42 - 3rd Quarter',
        statusDescription: 'In Progress',
        broadcast: 'FOX',
        odds: { details: 'BAL -3.5', overUnder: 'O/U 41.0' },
        venue: 'Acrisure Stadium, Pittsburgh, PA',
        awayTeam: {
          id: '33',
          abbr: 'BAL',
          displayName: 'Baltimore Ravens',
          shortDisplayName: 'Ravens',
          logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
          color: '#29126f',
          score: 17,
          record: '5-3',
          linescores: [{ value: 7 }, { value: 7 }, { value: 3 }]
        },
        homeTeam: {
          id: '23',
          abbr: 'PIT',
          displayName: 'Pittsburgh Steelers',
          shortDisplayName: 'Steelers',
          logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
          color: '#ffb612',
          score: 14,
          record: '5-2',
          linescores: [{ value: 0 }, { value: 7 }, { value: 7 }]
        },
        situation: {
          possessionTeamId: '33',
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

    // Pick a live game to advance
    const liveGames = this.simulatedGames.filter(g => g.state === 'in');
    if (liveGames.length === 0) return;

    const game = liveGames[Math.floor(Math.random() * liveGames.length)];
    const sit = game.situation;
    if (!sit) return;

    let scoreChanged = null;

    // Advance drive
    if (sit.yardLine >= 96) {
      // TOUCHDOWN!
      const scoringTeam = sit.possessionId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
      scoringTeam.score += 7;
      sit.lastPlayText = `TOUCHDOWN! ${scoringTeam.displayName} pass for 4 yards into the endzone!`;
      sit.yardLine = 25; // Touchback
      sit.down = 1;
      sit.distance = 10;
      sit.isRedZone = false;

      // Switch possession
      sit.possessionId = sit.possessionId === game.homeTeam.id ? game.awayTeam.id : game.homeTeam.id;
      sit.possessionChanged = true;

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
      if (sit.distance <= 0) {
        sit.down = 1;
        sit.distance = 10;
        sit.lastPlayText = `Gain of ${gain} yards. 1st Down!`;
      } else {
        sit.down = Math.min(4, sit.down + 1);
        sit.lastPlayText = `Gain of ${gain} yards on ${sit.down - 1} down.`;
      }
      sit.isRedZone = sit.yardLine >= 80;
    }

    game.scoreChanged = scoreChanged;

    if (this.onTickCallback) {
      this.onTickCallback({
        seasonYear: 2026,
        seasonType: 2,
        weekNumber: 8,
        teamsOnBye: [
          { abbr: 'SF', displayName: 'San Francisco 49ers' },
          { abbr: 'HOU', displayName: 'Houston Texans' }
        ],
        events: this.simulatedGames
      });
    }
  }
}
