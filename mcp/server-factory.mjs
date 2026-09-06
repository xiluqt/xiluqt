import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

const MODEL = {
  version: 'XQ-Risk-DigitalTwin-v0.2',
  bias: -5.226421069164394,
  weights: [3.403082245556661, 4.020611855209905, 2.1319227485804304, 1.7415474832554723]
};

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function sigmoid(z) { return 1 / (1 + Math.exp(-clamp(z, -30, 30))); }
function predict(weather, congestion, inventory, signalConfidence) {
  const x = [weather / 100, congestion / 100, inventory / 100, (100 - signalConfidence) / 60];
  const logit = MODEL.bias + MODEL.weights.reduce((s, w, i) => s + w * x[i], 0);
  const risk = clamp(sigmoid(logit), 0.01, 0.97);
  const delay = clamp(risk * 0.72, 0, 0.8);
  const disruption = clamp(risk * 0.28, 0, 0.3);
  const onTime = clamp(1 - delay - disruption, 0.02, 0.98);
  const sum = onTime + delay + disruption;
  return {
    risk_score: +risk.toFixed(4),
    logit: +logit.toFixed(4),
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

export function buildServer() {
  const server = new McpServer({ name: 'xiluqt', version: '0.3.0' });
  const four = z.object({
    weather_stress: z.number().min(0).max(100),
    congestion: z.number().min(0).max(100),
    inventory_pressure: z.number().min(0).max(100),
    signal_confidence: z.number().min(0).max(100)
  });

  server.registerTool('xiluqt_predict_movement', {
    title: 'Xiluqt Predict Movement',
    description: 'Predict logistics movement risk with the Xiluqt local risk model. Returns probabilities, risk score, model version, and confidence; this is not a claim of production accuracy.',
    inputSchema: four,
    annotations: { readOnlyHint: true }
  }, async (input) => ({ content: [{ type: 'text', text: JSON.stringify(predict(input.weather_stress, input.congestion, input.inventory_pressure, input.signal_confidence), null, 2) }] }));

  server.registerTool('xiluqt_brain_status', {
    title: 'Xiluqt Brain Status',
    description: 'Return Xiluqt brain configuration, model version, local LLM availability, and offline capabilities.',
    annotations: { readOnlyHint: true }
  }, async () => {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    let ollama = false;
    try { const r = await fetch(`${ollamaUrl}/api/tags`); ollama = r.ok; } catch {}
    return { content: [{ type: 'text', text: JSON.stringify({ model_version: MODEL.version, local_risk_model: true, ollama_available: ollama, offline_capable: true, protocol: 'MCP v2' }, null, 2) }] };
  });

  server.registerTool('xiluqt_local_reason', {
    title: 'Xiluqt Local Reasoning',
    description: 'Ask a local Ollama model to reason over a logistics question. No cloud LLM is required when Ollama is local.',
    inputSchema: z.object({ prompt: z.string().min(1).max(12000), model: z.string().min(1).max(120).default('gemma3') }),
    annotations: { readOnlyHint: true }
  }, async ({ prompt, model }) => {
    try {
      const answer = await ollamaChat(model, `You are Xiluqt, a logistics intelligence system. Be precise, distinguish evidence from inference, and never invent live data.\n\n${prompt}`);
      return { content: [{ type: 'text', text: answer }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Local reasoning unavailable: ${error.message}` }], isError: true };
    }
  });

  server.registerTool('xiluqt_risk_explanation', {
    title: 'Xiluqt Risk Explanation',
    description: 'Decompose the movement-risk model into factor contributions so the prediction is auditable.',
    inputSchema: four,
    annotations: { readOnlyHint: true }
  }, async (input) => {
    const factors = [
      ['weather_stress', input.weather_stress, MODEL.weights[0]],
      ['congestion', input.congestion, MODEL.weights[1]],
      ['inventory_pressure', input.inventory_pressure, MODEL.weights[2]],
      ['signal_degradation', 100 - input.signal_confidence, MODEL.weights[3]]
    ].map(([name, value, weight]) => ({ name, value, weight, contribution: +(value * weight / 100).toFixed(3) }))
      .sort((a, b) => b.contribution - a.contribution);
    return { content: [{ type: 'text', text: JSON.stringify({ model_version: MODEL.version, bias: MODEL.bias, factors }, null, 2) }] };
  });

  return server;
}
