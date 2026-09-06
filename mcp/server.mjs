import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod';

const MODEL = {
  version: 'XQ-Risk-DigitalTwin-v0.2',
  bias: -5.226421069164394,
  weights: [3.403082245556661, 4.020611855209905, 2.1319227485804304, 1.7415474832554723]
};

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function sigmoid(z) { return 1 / (1 + Math.exp(-clamp(z, -30, 30))); }
function predict(weather, congestion, inventory, signalConfidence) {
  const x = [weather / 100, congestion / 100, inventory / 100, (100 - signalConfidence) / 60];
  const risk = clamp(sigmoid(MODEL.bias + MODEL.weights.reduce((s, w, i) => s + w * x[i], 0)), 0.01, 0.97);
  const delay = clamp(risk * 0.72, 0, 0.8);
  const disruption = clamp(risk * 0.28, 0, 0.3);
  const onTime = clamp(1 - delay - disruption, 0.02, 0.98);
  const sum = onTime + delay + disruption;
  return {
    on_time_probability: +(onTime / sum).toFixed(4),
    delay_probability: +(delay / sum).toFixed(4),
    disruption_probability: +(disruption / sum).toFixed(4),
    confidence: +(signalConfidence / 100).toFixed(4),
    model_version: MODEL.version,
    offline: true
  };
}

async function ollamaChat(model, prompt) {
  const base = process.env.OLLAMA_URL || 'http://localhost:11434';
  const response = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, stream: false, messages: [{ role: 'user', content: prompt }] })
  });
  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const data = await response.json();
  return data.message?.content || '';
}

const server = new McpServer({ name: 'xiluqt', version: '0.1.0' });

server.registerTool('xiluqt_predict_movement', {
  title: 'Xiluqt Predict Movement',
  description: 'Predict logistics movement risk using the local Xiluqt risk model. No cloud model is required.',
  inputSchema: z.object({
    weather_stress: z.number().min(0).max(100),
    congestion: z.number().min(0).max(100),
    inventory_pressure: z.number().min(0).max(100),
    signal_confidence: z.number().min(0).max(100)
  }),
  annotations: { readOnlyHint: true }
}, async ({ weather_stress, congestion, inventory_pressure, signal_confidence }) => {
  const result = predict(weather_stress, congestion, inventory_pressure, signal_confidence);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result };
});

server.registerTool('xiluqt_brain_status', {
  title: 'Xiluqt Brain Status',
  description: 'Return the local Xiluqt brain configuration and offline capabilities.',
  annotations: { readOnlyHint: true }
}, async () => {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  let ollama = false;
  try { const r = await fetch(`${ollamaUrl}/api/tags`); ollama = r.ok; } catch {}
  const result = { model_version: MODEL.version, local_risk_model: true, ollama_available: ollama, offline_capable: true };
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result };
});

server.registerTool('xiluqt_local_reason', {
  title: 'Xiluqt Local Reasoning',
  description: 'Ask a locally running Ollama model to reason over a logistics question. Data stays on the local machine when Ollama is local.',
  inputSchema: z.object({
    prompt: z.string().min(1),
    model: z.string().default('gemma3')
  }),
  annotations: { readOnlyHint: true }
}, async ({ prompt, model }) => {
  try {
    const answer = await ollamaChat(model, `You are Xiluqt, a logistics intelligence system. Be precise, distinguish evidence from inference, and never invent live data.\n\n${prompt}`);
    return { content: [{ type: 'text', text: answer }], structuredContent: { model, local: true, answer } };
  } catch (error) {
    return { content: [{ type: 'text', text: `Local reasoning unavailable: ${error.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
