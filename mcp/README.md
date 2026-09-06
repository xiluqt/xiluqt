# Xiluqt MCP / Plugin API

Xiluqt exposes its local intelligence through Model Context Protocol (MCP).

## Tools

- `xiluqt_predict_movement` — local movement-risk prediction.
- `xiluqt_brain_status` — local model/runtime health.
- `xiluqt_local_reason` — optional local LLM reasoning through Ollama.

## Run locally

```bash
cd mcp
npm install
node server.mjs
```

Install Ollama separately if you want the local reasoning tool. Ollama serves its local API at `http://localhost:11434/api` by default.

This MCP server is intentionally local-first. It does not claim to provide live global data while completely offline; fresh external data must first be synchronized and cached by Xiluqt's updater.

## ChatGPT / Codex

Current ChatGPT plugin architecture uses plugins as a package around skills and apps, with MCP as the supported protocol for custom tool integrations. A local MCP server can be tested from supported developer/plugin tooling; a public hosted MCP endpoint is required for remote users. Publication/availability is subject to OpenAI's current plugin/app review and workspace rules.
