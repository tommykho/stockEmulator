/**
 * Zero-dependency CORS proxy for Polymarket Gamma API.
 * Run: node proxy.js
 * Then set DATA SOURCE to "Live" in the UI.
 *
 * Config via .env (optional):
 *   PROXY_PORT=8010
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

const TARGET_HOST = 'gamma-api.polymarket.com';
const PORT        = parseInt(process.env.PROXY_PORT || '8010', 10);

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const options = {
    hostname: TARGET_HOST,
    path:     req.url,
    method:   'GET',
    headers:  { host: TARGET_HOST, accept: 'application/json' },
  };

  const proxy = https.request(options, (upstream) => {
    res.writeHead(upstream.statusCode, {
      'content-type': upstream.headers['content-type'] || 'application/json',
      'access-control-allow-origin': '*',
    });
    upstream.pipe(res);
  });

  proxy.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502);
    res.end(JSON.stringify({ error: err.message }));
  });

  proxy.end();
}).listen(PORT, () => {
  console.log(`CORS proxy → https://${TARGET_HOST}`);
  console.log(`Listening  on http://localhost:${PORT}`);
});
