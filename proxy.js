// proxy.js — local-only relay so your Anthropic API key never enters the browser.
//
// The key is read from your environment (ANTHROPIC_LEARN_AI_EVAL_TUTOR) and
// injected server-side. The browser talks only to http://127.0.0.1:8791 and
// never sees the key. Bound to localhost ONLY — not reachable from the network.
//
//   Run:   node proxy.js
//   Open:  http://127.0.0.1:8791
//
// Requires Node 18+ (uses global fetch). You have v24.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.EVAL_PORT || 8791;
const HOST = '127.0.0.1';                 // localhost ONLY — never 0.0.0.0
const KEY = process.env.ANTHROPIC_LEARN_AI_EVAL_TUTOR; // dedicated app key; never written to disk, never sent to the browser
const INDEX = path.join(__dirname, 'index.html');
const MAX_BODY = 1_000_000;               // 1MB cap
const HISTORY_DIR = path.join(__dirname, 'history');
const EVENTS = path.join(HISTORY_DIR, 'events.jsonl');
const TRANSCRIPTS = path.join(HISTORY_DIR, 'transcripts');
const ensureHistory = () => fs.mkdirSync(TRANSCRIPTS, { recursive: true });
const safeName = s => String(s || 'session').replace(/[^a-z0-9_-]/gi, '_').slice(0, 64);

if (!KEY) {
  console.error('\n  ANTHROPIC_LEARN_AI_EVAL_TUTOR is not set.');
  console.error('  Set it to your dedicated, spend-capped Anthropic key, then open a FRESH terminal:');
  console.error("    [Environment]::SetEnvironmentVariable('ANTHROPIC_LEARN_AI_EVAL_TUTOR','sk-ant-...','User')");
  console.error('  (Use a key scoped to a low monthly spend limit — see RUN.md. Never your main key.)\n');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // Defense in depth: only accept requests whose Host is localhost.
  const host = (req.headers.host || '').split(':')[0];
  if (host !== '127.0.0.1' && host !== 'localhost') {
    res.writeHead(403); res.end('forbidden'); return;
  }

  // Serve the app (same-origin -> no CORS, no dangerous browser header needed).
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    fs.readFile(INDEX, (err, buf) => {
      if (err) { res.writeHead(500); res.end('index.html not found next to proxy.js'); return; }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(buf);
    });
    return;
  }

  // The ONLY API route. Not a generic relay: it whitelists fields and always
  // calls Anthropic itself, so it can never be coerced into hitting another URL.
  if (req.method === 'POST' && req.url === '/api/messages') {
    let body = '';
    let aborted = false;
    req.on('data', c => {
      body += c;
      if (body.length > MAX_BODY) { aborted = true; res.writeHead(413); res.end('{"error":{"message":"body too large"}}'); req.destroy(); }
    });
    req.on('end', async () => {
      if (aborted) return;
      let p;
      try { p = JSON.parse(body); } catch { res.writeHead(400); res.end('{"error":{"message":"bad json"}}'); return; }
      const safe = {
        model: String(p.model || 'claude-sonnet-4-6'),
        max_tokens: Math.min(Number(p.max_tokens) || 2000, 4096),
        system: p.system,
        messages: Array.isArray(p.messages) ? p.messages : [],
      };
      try {
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(safe),
        });
        const text = await upstream.text();
        res.writeHead(upstream.status, { 'content-type': 'application/json' });
        res.end(text);
      } catch (e) {
        res.writeHead(502, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'proxy upstream error: ' + e.message } }));
      }
    });
    return;
  }

  // Append-only audit trail + readable transcript. Local disk only — never sent anywhere.
  if (req.method === 'POST' && req.url === '/api/log') {
    let body = ''; let aborted = false;
    req.on('data', c => { body += c; if (body.length > MAX_BODY) { aborted = true; res.writeHead(413); res.end(); req.destroy(); } });
    req.on('end', () => {
      if (aborted) return;
      let ev;
      try { ev = JSON.parse(body); } catch { res.writeHead(400); res.end('{"error":{"message":"bad json"}}'); return; }
      try {
        ensureHistory();
        const rec = Object.assign({ ts: new Date().toISOString() }, ev);
        fs.appendFileSync(EVENTS, JSON.stringify(rec) + '\n');
        if (ev.type === 'session_start') {
          fs.appendFileSync(path.join(TRANSCRIPTS, safeName(ev.session) + '.md'),
            `\n\n# ${ev.title || ev.session} — ${rec.ts}\n_${ev.mode || ''} · ${ev.model || ''}_\n\n`);
        } else if (ev.type === 'message') {
          fs.appendFileSync(path.join(TRANSCRIPTS, safeName(ev.session) + '.md'),
            `**${ev.role === 'user' ? 'You' : 'Tutor'}:** ${ev.content}\n\n`);
        }
        res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}');
      } catch (e) { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: { message: e.message } })); }
    });
    return;
  }
  if (req.method === 'GET' && req.url === '/api/history') {
    try {
      ensureHistory();
      const data = fs.existsSync(EVENTS) ? fs.readFileSync(EVENTS, 'utf8') : '';
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ events: data.split('\n').filter(Boolean) }));
    } catch (e) { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: { message: e.message } })); }
    return;
  }

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, HOST, () => {
  console.log(`\n  The Eval Codex tutor is running.`);
  console.log(`  Open  ->  http://${HOST}:${PORT}`);
  console.log(`  Key loaded from your environment, never sent to the browser.`);
  console.log(`  Ctrl+C to stop.\n`);
});
