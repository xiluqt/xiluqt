# Xiluqt — ChatGPT Plugin Directory Submission

## Current architecture

Xiluqt is packaged around the current ChatGPT app model: **Apps SDK + MCP**. The local brain remains available over stdio, while `mcp/remote-server.mjs` provides a hosted Streamable HTTP `/mcp` endpoint for ChatGPT app submission.

OpenAI's current guidance says developers build and test apps with the Apps SDK/MCP and submit them for review before directory publication. Publication is not automatic from GitHub.

## Required hosted deployment

Deploy the Node service in `mcp/` to a public HTTPS host and set:

- `PORT` — supplied by the host
- `ALLOWED_HOSTS` — the public hostname(s), comma-separated
- `OLLAMA_URL` — optional; only use a reachable local/private Ollama service when the deployment environment supports it

The deployment must expose:

- `GET /health`
- `POST/GET /mcp`

The MCP URL submitted to OpenAI should be the final HTTPS `/mcp` URL.

## App capabilities

- Movement risk prediction
- Brain/model status
- Local AI reasoning through Ollama
- Risk-factor explanation

## Learning boundary

The prediction model is not presented as validated production ML. New supervised training data must use verified real-world outcomes as labels. Raw observations are not automatically treated as truth. This prevents the system from training itself on unverified assumptions.

## Publication

After the hosted MCP endpoint is live, submit the app through the OpenAI Developer Platform's app submission flow. OpenAI reviews submissions and decides whether they are published. The repository cannot bypass that review process.

## Security

Never commit API keys, OAuth client secrets, bearer tokens, private URLs, or Ollama credentials. Configure secrets in the deployment environment.
