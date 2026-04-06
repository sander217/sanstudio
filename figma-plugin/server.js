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

function analyzeFlow(data) {
  const screens = Array.isArray(data.screens) ? data.screens : [];
  const nodes = screens.reduce((acc, screen) => {
    if (Array.isArray(screen.nodes)) acc.push(...screen.nodes);
    return acc;
  }, []);
  const textNodes = nodes.filter(node => node && node.type === 'TEXT');
  const frameNodes = nodes.filter(node => node && (node.type === 'FRAME' || node.type === 'IMAGE'));
  const primitiveNodes = nodes.filter(node => node && node.type !== 'FRAME' && node.type !== 'IMAGE');

  const screenIssues = [];
  screens.forEach((screen, index) => {
    const screenNodes = Array.isArray(screen.nodes) ? screen.nodes : [];
    const screenTextNodes = screenNodes.filter(node => node && node.type === 'TEXT');
    const screenFrameNodes = screenNodes.filter(node => node && (node.type === 'FRAME' || node.type === 'IMAGE'));

    if (screenNodes.length >= 8 && screenTextNodes.length === 0) {
      screenIssues.push(`Screen ${index + 1} "${screen.name || 'unnamed'}" has ${screenNodes.length} nodes but no TEXT nodes.`);
    }

    if (screenNodes.length >= 12 && screenTextNodes.length > 0 && screenTextNodes.length / screenNodes.length < 0.08) {
      screenIssues.push(`Screen ${index + 1} "${screen.name || 'unnamed'}" looks frame-heavy (${screenTextNodes.length}/${screenNodes.length} TEXT nodes).`);
    }

    if (screenNodes.length >= 10 && screenFrameNodes.length / screenNodes.length > 0.9 && screenTextNodes.length <= 1) {
      screenIssues.push(`Screen ${index + 1} "${screen.name || 'unnamed'}" is mostly container nodes.`);
    }
  });

  return {
    totalNodes: nodes.length,
    textNodes: textNodes.length,
    frameNodes: frameNodes.length,
    primitiveNodes: primitiveNodes.length,
    screenIssues
  };
}

function validateFlow(data) {
  const errors = [];

  if (!data.schema_version) errors.push('Missing schema_version');
  if (!Array.isArray(data.screens) || data.screens.length === 0) {
    errors.push('Missing or empty screens array');
    return { errors, stats: null };
  }

  data.screens.forEach((screen, screenIndex) => {
    if (!screen.name) errors.push(`Screen ${screenIndex + 1}: missing name`);
    if (!Array.isArray(screen.nodes)) {
      errors.push(`Screen ${screenIndex + 1}: missing nodes array`);
      return;
    }

    const ids = new Set();
    screen.nodes.forEach((node, nodeIndex) => {
      if (!node.id) errors.push(`Screen ${screenIndex + 1}, node ${nodeIndex + 1}: missing id`);
      if (!node.type) errors.push(`Screen ${screenIndex + 1}, node ${nodeIndex + 1}: missing type`);
      if (node.id && ids.has(node.id)) errors.push(`Screen ${screenIndex + 1}: duplicate node id "${node.id}"`);
      if (node.id) ids.add(node.id);
      if (node.parentId !== null && !screen.nodes.some(candidate => candidate.id === node.parentId)) {
        errors.push(`Screen ${screenIndex + 1}, node "${node.id}": parentId "${node.parentId}" not found`);
      }
    });
  });

  if (errors.length > 0) {
    return { errors, stats: null };
  }

  const stats = analyzeFlow(data);
  if (stats.screenIssues.length > 0) {
    errors.push(
      'Export looks incomplete. The Figma bridge expects a full content tree, not container-only skeleton frames.',
      ...stats.screenIssues
    );
  }

  return { errors, stats };
}

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
        const data = JSON.parse(body);
        const validation = validateFlow(data);

        if (validation.errors.length > 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Invalid design export',
            details: validation.errors
          }));
          return;
        }

        pendingJson = body;
        pushCount++;

        const screenCount = data.screens.length;
        const nodeCount = validation.stats.totalNodes;

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
