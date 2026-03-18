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
CORS proxy → https://gamma-api.polymarket.com
Listening  on http://localhost:8011
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

```env
# Proxy port (default: 8011)
PROXY_PORT=8011

# Optional: paid stock data API key (not required for Yahoo Finance / mock mode)
# STOCK_API_KEY=your_key_here

# Optional: Polymarket CLOB API key (only needed for private/authenticated markets)
# POLYMARKET_API_KEY=your_key_here
```

> `.env` is gitignored. Never commit real keys.

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

## Ticker → Polymarket keyword map

The Gamma API searches by question text, not ticker symbols. The following mappings are used:

```
NVDA → nvidia     TSLA → tesla      AAPL → apple
MSFT → microsoft  GOOGL → google    BTC  → bitcoin
ETH  → ethereum   SOL  → solana     SPY  → fed rate
GLD  → gold       XOM  → oil        CVX  → chevron
```

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
