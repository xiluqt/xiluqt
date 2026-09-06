# Xiluqt MCP Server

Production-oriented MCP v2 gateway for Xiluqt movement intelligence.

## Architecture

- `server.mjs` — local stdio MCP server.
- `server-factory.mjs` — shared tool graph used by local and remote transports.
- `remote-server.mjs` — Streamable HTTP endpoint at `/mcp` plus `/health`.
- `Dockerfile` — minimal Node 22 production image.
- `.env.example` — deployment configuration; never commit real secrets.

The remote gateway is deliberately read-only: prediction, model status, explanation, and optional local-Ollama reasoning. There are no shipment mutations, payments, credential operations, or autonomous external writes.

## Local

```bash
npm install
npm start
```

## Remote

```bash
npm install
XILUQT_MCP_TOKEN='long-random-secret' npm run start:remote
```

Health: `GET /health`
MCP: `POST/GET/DELETE /mcp`

The gateway supports optional bearer authentication, host/origin allowlists, request IDs, security headers, bounded request rate, and graceful shutdown. For a public deployment, set `XILUQT_MCP_TOKEN` and keep the token in the hosting provider's secret store.

## ChatGPT connection

OpenAI's current Apps SDK uses MCP for custom apps. In ChatGPT Developer Mode, create a custom app and point it at the deployed `/mcp` endpoint. ChatGPT currently connects to remote MCP servers; a local server is not directly reachable without a supported secure tunnel.

This repository does not itself publish an app into OpenAI's directory; publication remains an account/workspace submission and review process.
