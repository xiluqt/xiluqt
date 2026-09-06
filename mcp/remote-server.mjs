import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { buildServer } from './server-factory.mjs';

const handler = createMcpHandler(buildServer);
const nodeHandler = toNodeHandler(handler);
const app = createMcpExpressApp({ host: '0.0.0.0', allowedHosts: process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(',').map(s => s.trim()).filter(Boolean) : undefined });

app.get('/health', (_req, res) => res.json({ service: 'xiluqt-mcp', status: 'ok', version: '0.2.0' }));
app.all('/mcp', (req, res) => void nodeHandler(req, res, req.body));

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, '0.0.0.0', () => console.log(`Xiluqt MCP listening on :${port}/mcp`));

const shutdown = async () => {
  server.close();
  await handler.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
