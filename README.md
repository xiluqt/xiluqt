# Xiluqt Silicon Intelligence

Xiluqt is a production-oriented web application for semiconductor dependency, lifecycle, sourcing and product-impact intelligence.

## Product promise

> **Know which chip can break your product — before it does.**

The application turns a customer's bill of materials into a dependency intelligence workspace: components are normalised, risk signals are calculated transparently, component exposure is propagated into products, and an analyst layer converts those signals into procurement and qualification recommendations.

## Current capabilities

- Customer BOM CSV ingestion in the browser.
- Local parsing and workspace persistence.
- Transparent risk scoring using lifecycle, lead time, source concentration, geography and quantity.
- Product-level impact propagation.
- Dependency graph visualisation.
- Search and risk-band filtering.
- AI-style analyst grounded in the structured workspace.
- Responsive desktop/mobile interface with animated interactions.
- Xiluqt brand mark used throughout the product.

## Data boundary

The core application does **not** require a commercial semiconductor data licence. It can analyse structured information supplied by a customer. It does not claim live market intelligence unless a live evidence provider is connected. Commercial lifecycle, availability, supplier, pricing and geopolitical feeds can later be added behind a secure backend.

## Architecture

`BOM → Normalization → Risk Engine → Dependency Graph → Product Impact → Analyst`

Long-term infrastructure graph:

`Chip → Component → Supplier → Manufacturer → Product → Factory → Customer → Revenue`

## Engineering principle

Demo/workspace data is explicitly distinguishable from authoritative external evidence. Risk scores are prioritisation signals, not guaranteed forecasts of loss or supply interruption.

**Built from Nigeria. Designed for the world.**
