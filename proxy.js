/**
 * Zero-dependency CORS proxy.
 * Routes:
 *   GET /config   → returns parsed .env ticker config as JSON
 *   /markets*     → gamma-api.polymarket.com
 *   /yahoo/*      → query1.finance.yahoo.com  (strip /yahoo prefix)
 *
 * Run: node proxy.js
 * Stop: Ctrl+C  (or: Stop-Process -Name node in PowerShell)
 *
 * Config via .env — see .env.example for all options.
 */
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── .env loader ────────────────────────────────────────────────
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const eq = line.indexOf('=');
    if (eq > 0 && !line.startsWith('#')) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k && !process.env[k]) process.env[k] = v;
    }
  });
}

// ── .env parsers ───────────────────────────────────────────────
function parseCSV(str)  { return str ? str.split(',').map(s => s.trim()).filter(Boolean) : []; }
function parseKV(str) {
  // "NVDA:nvidia,BTC:bitcoin" → { NVDA: 'nvidia', BTC: 'bitcoin' }
  if (!str) return {};
  return Object.fromEntries(
    str.split(',').map(pair => {
      const idx = pair.indexOf(':');
      return idx > 0 ? [pair.slice(0, idx).trim(), pair.slice(idx + 1).trim()] : null;
    }).filter(Boolean)
  );
}

// ── Ticker config (served via GET /config) ─────────────────────
const appConfig = {
  tickers:            parseCSV(process.env.TICKERS),
  sectors:            parseKV(process.env.TICKER_SECTORS),
  polymarketKeywords: parseKV(process.env.POLYMARKET_KEYWORDS),
  yahooSymbols:       parseKV(process.env.YAHOO_SYMBOLS),
  cryptoTickers:      parseCSV(process.env.CRYPTO_TICKERS),
};

const PORT = parseInt(process.env.PROXY_PORT || '8012', 10);

// ── Route resolver ─────────────────────────────────────────────
function resolveRoute(url) {
  if (url.startsWith('/yahoo')) {
    return { hostname: 'query1.finance.yahoo.com', targetPath: url.slice('/yahoo'.length) || '/' };
  }
  return { hostname: 'gamma-api.polymarket.com', targetPath: url };
}

// ── Server ─────────────────────────────────────────────────────
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve ticker config from .env
  if (req.url === '/config') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify(appConfig));
    return;
  }

  const { hostname, targetPath } = resolveRoute(req.url);

  const options = {
    hostname,
    path:    targetPath,
    method:  'GET',
    headers: {
      host:         hostname,
      accept:       'application/json',
      'user-agent': 'Mozilla/5.0 (compatible; stockEmulator/0.1)',
    },
  };

  const proxy = https.request(options, (upstream) => {
    res.writeHead(upstream.statusCode, {
      'content-type':                upstream.headers['content-type'] || 'application/json',
      'access-control-allow-origin': '*',
    });
    upstream.pipe(res);
  });

  proxy.on('error', (err) => {
    console.error(`[${hostname}] ${err.message}`);
    res.writeHead(502);
    res.end(JSON.stringify({ error: err.message }));
  });

  proxy.end();

}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use.`);
    console.error(`Run in PowerShell or cmd.exe (NOT Git Bash):`);
    console.error(`  netstat -ano | findstr :${PORT}`);
    console.error(`  taskkill /PID <pid> /F`);
    console.error(`\nOr change PROXY_PORT in .env\n`);
  } else {
    console.error(err);
  }
  process.exit(1);

}).listen(PORT, () => {
  console.log(`\nCORS proxy  http://localhost:${PORT}`);
  console.log(`  GET /config   → ticker config from .env`);
  console.log(`  /markets*     → https://gamma-api.polymarket.com`);
  console.log(`  /yahoo/*      → https://query1.finance.yahoo.com`);
  console.log(`\nTracking: ${appConfig.tickers.length ? appConfig.tickers.join(', ') : '(defaults from index.html)'}`);
  console.log(`\nPress Ctrl+C to stop.\n`);
});
