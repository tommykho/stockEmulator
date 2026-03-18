/**
 * Zero-dependency CORS proxy.
 * Routes:
 *   /markets* → gamma-api.polymarket.com
 *   /yahoo/*  → query1.finance.yahoo.com  (strip /yahoo prefix)
 *
 * Run: node proxy.js
 *
 * Config via .env (optional):
 *   PROXY_PORT=8011
 */
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// Minimal .env loader — no dependencies required
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v && !process.env[k.trim()]) process.env[k.trim()] = v.trim();
  });
}

const PORT = parseInt(process.env.PROXY_PORT || '8011', 10);

const ROUTES = {
  '/yahoo': 'query1.finance.yahoo.com',
  '/':      'gamma-api.polymarket.com',
};

function resolveRoute(url) {
  if (url.startsWith('/yahoo')) {
    return {
      hostname:   'query1.finance.yahoo.com',
      targetPath: url.slice('/yahoo'.length) || '/',
    };
  }
  return {
    hostname:   'gamma-api.polymarket.com',
    targetPath: url,
  };
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const { hostname, targetPath } = resolveRoute(req.url);

  const options = {
    hostname,
    path:    targetPath,
    method:  'GET',
    headers: {
      host:            hostname,
      accept:          'application/json',
      'user-agent':    'Mozilla/5.0 (compatible; stockEmulator/0.1)',
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
    console.error(`\nPort ${PORT} is already in use.\n`);
    console.error(`To find and kill the process (run in cmd.exe or PowerShell, NOT Git Bash):`);
    console.error(`  netstat -ano | findstr :${PORT}`);
    console.error(`  taskkill /PID <pid> /F\n`);
    console.error(`Or change PROXY_PORT in .env and update CONFIG.polymarketAPI / CONFIG.yahooAPI in index.html.\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
}).listen(PORT, () => {
  console.log(`CORS proxy listening on http://localhost:${PORT}`);
  console.log(`  /markets* → https://gamma-api.polymarket.com`);
  console.log(`  /yahoo/*  → https://query1.finance.yahoo.com`);
  console.log(`\nPress Ctrl+C to stop.\n`);
});
