# Agents

## Agent: UIRenderer
- Owns: index.html
- Responsibility: All visual rendering, controls, table, log panel
- Input: normalized market data objects { ticker, polyPrice, estProb, spread, signal }
- Output: DOM updates only — no fetch logic here

## Agent: DataFetcher
- Owns: src/polymarket.js
- Responsibility: Fetch real Polymarket markets by keyword/ticker
- Endpoint: https://gamma-api.polymarket.com/markets?search={keyword}&active=true
- Output: { ticker, polyPrice, marketTitle, volume }

## Agent: StockAnalyzer
- Owns: src/stockChecker.js
- Responsibility: Run gracefullight/stock-checker@stock-analysis per ticker
- Output: { ticker, stockScore, signal, dimensions }

## Agent: Eliminator
- Owns: src/eliminator.js
- Responsibility: Merge polyPrice + stockScore, apply threshold, rank survivors
- Formula: combined = (stockScore * 0.70) + (polyProb * 100 * 0.30)
- Eliminate if combined < threshold (default: 45)
- Output: { survivors[], eliminated[] }
