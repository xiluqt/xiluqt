import crypto from 'node:crypto';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { buildServer } from './server-factory.mjs';

const PORT = Number(process.env.PORT || 3000);
const TOKEN = process.env.XILUQT_MCP_TOKEN || '';
const RATE_WINDOW_MS = Number(process.env.RATE_WINDOW_MS || 60_000);
const RATE_LIMIT = Number(process.env.RATE_LIMIT || 60);
const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));
const buckets = new Map();

const handler = createMcpHandler(buildServer);
const nodeHandler = toNodeHandler(handler);
const app = createMcpExpressApp({
  host: '0.0.0.0',
  allowedHosts: process.env.ALLOWED_HOSTS
    ? process.env.ALLOWED_HOSTS.split(',').map(s => s.trim()).filter(Boolean)
    : undefined
});

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('cache-control', 'no-store');
  const origin = req.get('origin');
  if (origin && (ALLOWED_ORIGINS.size === 0 || ALLOWED_ORIGINS.has(origin))) {
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('vary', 'Origin');
    res.setHeader('access-control-allow-headers', 'content-type, authorization, mcp-session-id, mcp-protocol-version, x-request-id');
    res.setHeader('access-control-allow-methods', 'GET,POST,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/mcp', (req, res, next) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now - current.started >= RATE_WINDOW_MS) {
    buckets.set(key, { started: now, count: 1 });
  } else if (++current.count > RATE_LIMIT) {
    res.setHeader('retry-after', Math.ceil((RATE_WINDOW_MS - (now - current.started)) / 1000));
    return res.status(429).json({ error: 'rate_limit_exceeded', request_id: res.getHeader('x-request-id') });
  }
  if (TOKEN) {
    const supplied = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const a = Buffer.from(supplied);
    const b = Buffer.from(TOKEN);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'unauthorized', request_id: res.getHeader('x-request-id') });
    }
  }
  next();
});

app.get('/health', (_req, res) => res.json({
  service: 'xiluqt-mcp',
  status: 'ok',
  version: '0.3.0',
  protocol: 'MCP v2',
  auth: Boolean(TOKEN),
  uptime_seconds: Math.floor(process.uptime())
}));

app.all('/mcp', (req, res) => void nodeHandler(req, res, req.body));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Xiluqt MCP listening on :${PORT}/mcp`);
});

const shutdown = async (signal) => {
  console.log(`Received ${signal}; shutting down cleanly.`);
  server.close();
  await handler.close();
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
