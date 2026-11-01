# NFL Command Board

A high-density, full-screen NFL dashboard engineered specifically to display
on a second monitor or TV. Built as a zero-dependency, pure client-side web
application that pulls live data directly from open sports APIs.

---

## Features

- **Live Drive & Mini-Field Tracker**:
  - Accurate 100-yard SVG football field visualization on each active card.
  - Line of scrimmage marker (electric blue) and first down line (yellow).
  - Red zone territory shading (opponent 20 to goal line).
  - Animated football beacon with directional drive indicator arrow.
  - Down and distance pill with 4th down urgency alerts.

- **Information-Dense Game Cards**:
  - High-resolution team logos with official brand colors.
  - Quarter-by-quarter line scores (Q1, Q2, Q3, Q4, OT, Total).
  - Live possession beacon indicating which team has the ball.
  - Three visual timeout bars per team tracking remaining timeouts.
  - Real-time spread and over/under odds.
  - TV broadcast badges (CBS, FOX, NBC, ESPN, Prime, Peacock) and stadium venue.
  - Split win probability progress gauge.

- **Multiple View Modes for Any Display**:
  - **Grid Mode (All Games)**: Dynamic responsive grid scaling to any monitor.
  - **Theater / Focus Mode**: Enlarged main stage for a featured game with a
    side rail of all other games across the league.
  - **Compact Ticker Mode**: Ultra-dense tabular strip for low-profile
    monitoring.
  - **Monitor Zoom Slider**: Adjust layout scale from 65% to 140% to fit any
    1080p, 1440p, 4K, or ultrawide screen with zero scroll.

- **Deep Dive Modal**:
  - Head-to-head team boxscore stats comparison bars (total yards, passing,
    rushing, 1st downs, turnovers, penalties, time of possession).
  - Scoring summary timeline with quarter, clock, and play description.
  - Top performers (passing, rushing, receiving leaders with photos).
  - Full drive progression charts.
  - Win probability SVG timeline curve.

- **Audio Alerts & Score Animations**:
  - Instant score-change detection across polling ticks.
  - Golden flash pulse animation when touchdowns or field goals are scored.
  - Built-in Web Audio API synthesizer for stadium brass touchdown fanfares
    and field goal chimes (no external audio files required, toggleable with
    mute).

- **Offline / Tuesday Demo Mode**:
  - Built-in live game simulator to test-drive all drive movements, field
    animations, score changes, and audio alerts anytime.

---

## Quick Start

Launch the local server using either script:

```bash
# Using the helper launcher script:
./serve.sh

# Or via npm:
npm start

# Or directly with Python:
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `F` | Toggle Fullscreen mode |
| `R` | Force immediate score refresh |
| `M` | Mute or unmute score audio alerts |
| `Space` | Pause or resume live polling |
| `1` | Switch to Responsive Grid view |
| `2` | Switch to Theater / Focus view |
| `3` | Switch to Compact Ticker view |
| `?` | Display shortcuts reference |

---

## Multi-Monitor & TV Recommendation

1. Drag the browser window to your second monitor or TV.
2. Press `F` to enter full-screen mode.
3. Use the `+` or `−` scale controls in the top right to adjust card sizes
   so that all current games fit perfectly within your display viewport
   without vertical scroll bars.
4. Press `M` to enable audio chimes if you want touchdown sound alerts
   while working on your primary display.

---

## Data Sources

Data is fetched directly from the client without intermediary servers:
- Scoreboard: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
- Game Summary: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary`
