# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Polymarket + Stock ARB detector emulator. Detects arbitrage spreads by combining Polymarket prediction market probabilities with Yahoo Finance stock scores into a single `combinedScore`.

Live repo: https://github.com/tommykho/stockEmulator

## Architecture

The app is a single-file HTML tool (`index.html`) with a zero-dependency Node.js CORS proxy (`proxy.js`). There is no build step.

### Data flow

```
.env (TICKERS, TICKER_SECTORS, ...)
        │
        ▼
    proxy.js  GET /config ──────────────────────────────────────────┐
        │                                                            │
        ├── /markets* → gamma-api.polymarket.com                     │
        └── /yahoo/*  → query1.finance.yahoo.com                     ▼
                                                              index.html
                                                         loadConfig() on startup
                                                         rebuilds MOCK_MARKETS,
                                                         TICKER_KEYWORDS,
                                                         YAHOO_SYMBOLS, CRYPTO_TICKERS
```

### Key integration points

- **Polymarket Gamma API**: `https://gamma-api.polymarket.com/markets` — no auth, proxied via `proxy.js`
- **Yahoo Finance v8 chart**: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}` — real-time LAST/CHG, proxied
- **Scoring**: `combinedScore = (stockScore * 0.70) + (polyProb * 100 * 0.30)`
- **Config endpoint**: `GET http://localhost:8012/config` — proxy serves parsed `.env` as JSON

### Config system

All ticker symbols, sectors, and keyword mappings live in `.env`. The proxy reads them at startup and exposes them via `GET /config`. `index.html` fetches this on load and rebuilds its internal maps. If the proxy is unreachable, hardcoded defaults in `index.html` are used (mock mode still works).

| `.env` variable | Consumed by | Purpose |
|---|---|---|
| `TICKERS` | proxy → index.html | Ticker list |
| `TICKER_SECTORS` | proxy → index.html | Sector per ticker |
| `POLYMARKET_KEYWORDS` | proxy → index.html | Gamma API search term per ticker |
| `YAHOO_SYMBOLS` | proxy → index.html | Yahoo Finance symbol overrides (crypto) |
| `CRYPTO_TICKERS` | proxy → index.html | MarketWatch URL pattern + Yahoo `-USD` suffix |
| `PROXY_PORT` | proxy.js | Local server port (default 8012) |

## File structure

```
stockEmulator/
├── index.html          ← main UI (single-file, vanilla JS, no build tools)
├── proxy.js            ← CORS proxy + /config endpoint (zero dependencies)
├── .env                ← local config including all ticker/sector/keyword maps (gitignored)
├── .env.example        ← committed template with all variables documented
├── package.json        ← npm scripts only (no dependencies)
├── AGENTS.md
└── CLAUDE.md
```

Planned `src/` modules (not yet created):
- `src/polymarket.js` — extract inline fetch logic
- `src/stockChecker.js` — real Yahoo Finance 8-dimension scoring
- `src/eliminator.js` — extract scoring/elimination logic

## Coding standards

- `index.html`: vanilla JS only, no build tools, no external CSS frameworks
- `src/`: ES modules when created
- Font: IBM Plex Mono (already loaded in index.html)
- All colors via CSS variables — dark mode compatible
- API endpoints in `CONFIG` object at top of script, never hardcoded inline
- Ticker symbols, sectors, keywords: always in `.env` / `.env.example`, never hardcoded
- Leading-comma style for any SQL added later

## Commands

```bash
node proxy.js        # start CORS proxy (required for live data + config)
npx serve .          # serve index.html at localhost:3000
```

**Stop the proxy:** Ctrl+C in the proxy terminal, or in PowerShell: `Stop-Process -Name node -Force`

**Do NOT use Git Bash to kill node processes** — `/PID` gets interpreted as a file path. Use PowerShell or cmd.exe.

Install the stock-analysis skill (for future `src/stockChecker.js`):

```bash
npx playbooks add skill gracefullight/stock-checker --skill stock-analysis
```
