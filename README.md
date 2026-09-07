# Xiluqt

Xiluqt is a global movement-intelligence prototype: a decision layer for predicting movement, delay and operational risk before intervention windows close.

## Current build

- Clean static PWA on GitHub Pages
- Native hash navigation: Home / Predict / Live / API
- Exact Xiluqt X logo asset
- Browser GPS when the user grants permission
- Public Open-Meteo weather context for Lagos, Singapore and Dubai
- Local lightweight risk model with explainable factors
- In-browser synthetic training lab
- GitHub Actions training job that refreshes `brain/model.json`
- API playground clearly marked **BETA / UNDER DEPLOYMENT**

## AI boundary

GitHub Pages is static hosting. It can run JavaScript inference in the browser and GitHub Actions can train small models, but Pages is not a persistent GPU/LLM backend. A production LLM or customer-facing prediction API needs a separate backend/inference service.

Synthetic training is demonstration infrastructure, not proof of production accuracy. Real customer outcomes and authorized telemetry are required for production model validation.

## Prototype

https://xiluqt.github.io/xiluqt/
