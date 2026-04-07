```
███████╗████████╗ ██████╗  ██████╗██╗  ██╗    ███████╗███╗   ███╗██╗   ██╗
██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██║ ██╔╝    ██╔════╝████╗ ████║██║   ██║
███████╗   ██║   ██║   ██║██║     █████╔╝     █████╗  ██╔████╔██║██║   ██║
╚════██║   ██║   ██║   ██║██║     ██╔═██╗     ██╔══╝  ██║╚██╔╝██║██║   ██║
███████║   ██║   ╚██████╔╝╚██████╗██║  ██╗    ███████╗██║ ╚═╝ ██║╚██████╔╝
╚══════╝   ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝    ╚══════╝╚═╝     ╚═╝ ╚═════╝
ARB DETECTOR  ·  Polymarket × Yahoo Finance  ·  v0.1.0
```

> Real-time arbitrage signal detector combining Polymarket prediction probabilities with 8-dimension Yahoo Finance stock scoring.

---

## What it does

stockEmulator scans Polymarket prediction markets and computes a **combined score** per ticker:

```
combinedScore = (stockScore × 0.70) + (polyProb × 100 × 0.30)
```

Tickers below your elimination threshold are dropped. Survivors with a spread above your ARB threshold are flagged as trade signals — **BUY** or **SELL** — and logged to the trade history panel.

---

## Quick start

**1. Start the CORS proxy** (required for live Polymarket data):

```bash
node proxy.js
```

```
CORS proxy  http://localhost:8012
  GET /config   → ticker config from .env
  /markets*     → https://gamma-api.polymarket.com
  /yahoo/*      → https://query1.finance.yahoo.com
```

**2. Open the app:**

```bash
npx serve .
# → http://localhost:3000
```

Or just open `index.html` directly in your browser.

**3. Switch to live data:**

In the UI, set **Data Source → Live (Polymarket API)**, then press **▶ START SCAN**.

---

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

Restart `node proxy.js` after any change. `.env` is gitignored — never commit it.

### Ticker config

All symbols and sectors are configured in `.env`. The proxy reads them at startup and serves them to `index.html` via `GET /config`. If the proxy is not running, `index.html` falls back to built-in defaults.

| Variable | Format | Purpose |
|---|---|---|
| `TICKERS` | `NVDA,TSLA,BTC` | Tickers to scan (comma-separated) |
| `TICKER_SECTORS` | `NVDA:tech,BTC:crypto` | Sector per ticker — drives the sector filter |
| `POLYMARKET_KEYWORDS` | `NVDA:nvidia,BTC:bitcoin` | Keyword mapped to each ticker for Gamma API search |
| `YAHOO_SYMBOLS` | `BTC:BTC-USD,ETH:ETH-USD` | Yahoo Finance symbol overrides (crypto needs `-USD` suffix) |
| `CRYPTO_TICKERS` | `BTC,ETH,SOL` | Tickers treated as crypto (MarketWatch URL + Yahoo suffix) |
| `PROXY_PORT` | `8012` | Local proxy port |

**Available sectors:** `tech` · `crypto` · `macro` · `energy`

**Adding a new ticker** — add it to all five variables, then restart the proxy:

```env
TICKERS=NVDA,...,AMZN
TICKER_SECTORS=...,AMZN:tech
POLYMARKET_KEYWORDS=...,AMZN:amazon
# YAHOO_SYMBOLS — no entry needed for standard stocks
# CRYPTO_TICKERS — no entry needed for stocks
```

---

## Controls

| Control | Description |
|---|---|
| **ARB threshold** | Minimum spread (¢) to flag as an opportunity |
| **Scan interval** | How often to re-fetch market data (1–10s) |
| **Elim. threshold** | Drop tickers with `combinedScore` below this |
| **Sector filter** | Narrow to Tech / Crypto / Macro / Energy |
| **Mode** | Normal · High volatility · Quiet market |
| **Data source** | Mock emulator or live Polymarket API |

---

## Signals

| Signal | Condition |
|---|---|
| `STRONG ARB` | `spread ≥ threshold × 1.8` and not eliminated |
| `ARB` | `spread ≥ threshold` and not eliminated |
| `ELIMINATED` | `combinedScore < elimThreshold` |
| `—` | No signal |

---

## Architecture

```
Polymarket Gamma API                     Yahoo Finance
        │                                      │
        ▼                                      ▼
  src/polymarket.js                  src/stockChecker.js
  { ticker, polyPrice,               { ticker, stockScore,
    marketTitle, volume }              signal, dimensions }
        │                                      │
        └──────────────┬───────────────────────┘
                       ▼
               src/eliminator.js
        combinedScore = (stockScore × 0.70)
                      + (polyProb × 100 × 0.30)
        eliminate if combined < threshold (default: 45)
               { survivors[], eliminated[] }
                       │
                       ▼
                  index.html
        ┌──────────────────────────────┐
        │  metrics · table · log       │
        │  trade history · export      │
        └──────────────────────────────┘
```

### Agents

| Agent | File | Responsibility |
|---|---|---|
| **UIRenderer** | `index.html` | All rendering — no fetch logic |
| **DataFetcher** | `src/polymarket.js` | Gamma API fetch per ticker keyword |
| **StockAnalyzer** | `src/stockChecker.js` | Yahoo Finance 8-dimension scoring |
| **Eliminator** | `src/eliminator.js` | Merge scores, apply threshold, rank |

---

---

## Export

| Button | Output |
|---|---|
| **↓ Export trades CSV** | `arb-trades.csv` — timestamp, ticker, direction, prices, spread |
| **↓ Export JSON** | `arb-snapshot.json` — full market snapshot + trade history |

---

## Roadmap

- [x] Mock data engine with volatility modes
- [x] Live Polymarket Gamma API feed
- [x] Combined scoring + elimination layer
- [x] Trade log with CSV/JSON export
- [x] CORS proxy (zero dependencies)
- [ ] `src/stockChecker.js` — real Yahoo Finance 8-dimension scores via `gracefullight/stock-checker`
- [ ] `src/polymarket.js` — extract fetch logic to ES module
- [ ] `src/eliminator.js` — extract scoring/elimination to ES module
- [ ] Persistent portfolio tracking

---

## Tech

- **Vanilla JS** — no build tools, no frameworks
- **IBM Plex Mono / Sans** — typography
- **CSS variables** — full dark mode, all colors configurable
- **Node.js** `http` / `https` — zero-dependency CORS proxy
- **Polymarket Gamma API** — `https://gamma-api.polymarket.com/markets` (public, no auth)
- **Yahoo Finance** — via `gracefullight/stock-checker@stock-analysis` skill (planned)

---

## Disclaimer

Simulation only. Not financial advice. Mock data is randomly generated for educational purposes. Live mode fetches public Polymarket data. Stock scores are illustrative.

## License

This project is licensed under the [GNU General Public License v3.0 (GPL-3.0)](https://github.com/tommykho/edgetts/blob/main/LICENSE).

## Support

If you find this useful, consider buying me a coffee!

[![Donate via PayPal](https://img.shields.io/badge/Donate-PayPal-blue?logo=paypal)](https://paypal.me/tommykho)
