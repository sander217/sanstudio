#!/usr/bin/env node

// Design Agent Studio — Bridge Server
// Receives JSON from Claude Code (POST /push)
// Serves JSON to Figma Plugin (GET /pull)
// Zero dependencies — Node.js built-in http only

const http = require('http');

const PORT = 3333;
const HOST = 'localhost';

// In-memory queue — latest push wins
let pendingJson = null;
let pushCount = 0;

const server = http.createServer((req, res) => {
  // CORS — Figma Plugin runs in a sandbox that needs these headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /push — Claude Code sends JSON here
  if (req.method === 'POST' && req.url === '/push') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        // Validate it's parseable JSON
        const data = JSON.parse(body);

        // Basic schema check
        if (!data.schema_version || !data.screens) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid schema: missing schema_version or screens' }));
          return;
        }

        pendingJson = body;
        pushCount++;

        const screenCount = data.screens.length;
        const nodeCount = data.screens.reduce((sum, s) => sum + (s.nodes ? s.nodes.length : 0), 0);

        console.log(`[push #${pushCount}] Received "${data.flow_name}": ${screenCount} screen(s), ${nodeCount} node(s)`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          push_id: pushCount,
          screens: screenCount,
          nodes: nodeCount
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON: ' + err.message }));
      }
    });
    return;
  }

  // GET /pull — Figma Plugin polls this endpoint
  if (req.method === 'GET' && req.url === '/pull') {
    if (pendingJson) {
      const json = pendingJson;
      pendingJson = null; // Consume — one-shot delivery
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(json);
      console.log(`[pull] Delivered push #${pushCount} to Figma Plugin`);
    } else {
      res.writeHead(204); // No content — nothing pending
      res.end();
    }
    return;
  }

  // GET /status — health check
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'running',
      pending: pendingJson !== null,
      total_pushes: pushCount
    }));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found. Endpoints: POST /push, GET /pull, GET /status' }));
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Design Agent Studio — Bridge Server`);
  console.log(`  Listening on http://${HOST}:${PORT}`);
  console.log(`\n  POST /push  — send JSON from Claude Code`);
  console.log(`  GET  /pull  — Figma Plugin fetches pending JSON`);
  console.log(`  GET  /status — health check\n`);
});
