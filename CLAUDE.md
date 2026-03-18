# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Polymarket + Stock ARB detector emulator. Detects arbitrage spreads by combining Polymarket prediction market probabilities with Yahoo Finance stock scores into a single `combinedScore`.

Live repo: https://github.com/tommykho/stockEmulator

## Architecture

The app is a single-file HTML tool (`index.html`) with modular JS in `src/`. There is no build step — `index.html` runs directly in the browser.

### Data flow

```
Polymarket Gamma API → src/polymarket.js → raw market probabilities (polyProb)
Yahoo Finance        → src/stockChecker.js → 8-dimension stock score (stockScore)
                                    ↓
                          src/eliminator.js
                  combinedScore = (stockScore * 0.70) + (polyProb * 0.30)
                  drop tickers below threshold → filtered candidates
                                    ↓
                              index.html UI
                  event log, metrics dashboard, CSV export
```

### Key integration points

- **Polymarket Gamma API**: `https://gamma-api.polymarket.com/markets` — no auth required
- **Stock checker**: `gracefullight/stock-checker` skill via `npx playbooks add skill gracefullight/stock-checker --skill stock-analysis` — wraps Yahoo Finance with 8-dimension scoring
- **Scoring**: `combinedScore = (stockScore * 0.70) + (polyProb * 0.30)`

## File structure

```
stockEmulator/
├── index.html          ← main UI (single-file, vanilla JS, no build tools)
├── src/
│   ├── polymarket.js   ← Gamma API fetcher (ES module)
│   ├── stockChecker.js ← stock-analysis skill wrapper (ES module)
│   └── eliminator.js   ← scoring + elimination logic (ES module)
├── package.json
├── AGENTS.md
└── CLAUDE.md
```

## Coding standards

- `index.html`: vanilla JS only, no build tools, no external CSS frameworks
- `src/`: ES modules
- Font: IBM Plex Mono (already loaded in index.html)
- All colors via CSS variables — dark mode compatible
- API endpoints in a `CONFIG` object at top of file, never hardcoded inline
- Leading-comma style for any SQL added later

## Commands

No build step. Open `index.html` directly in a browser, or serve locally:

```bash
npx serve .          # static file server
python -m http.server 8080
```

Install the stock-analysis skill:

```bash
npx playbooks add skill gracefullight/stock-checker --skill stock-analysis
```
