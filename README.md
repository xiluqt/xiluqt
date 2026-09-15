# Xiluqt Silicon Intelligence

Xiluqt is a production-oriented, installable web application for semiconductor dependency, lifecycle, sourcing and product-impact intelligence.

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
- Analyst interface grounded in the structured workspace.
- Responsive desktop/mobile interface with mobile bottom navigation.
- **Installable PWA** with standalone display and offline shell caching.
- Xiluqt brand mark used throughout the product.

## Add Xiluqt to a phone

Open the deployed GitHub Pages site in a supported browser.

- **iPhone/iPad:** Safari → Share → **Add to Home Screen**.
- **Android:** use the browser's **Install app / Add to Home screen** option when offered.

The app is designed to open in a standalone window after installation. BOM data remains in the device/browser workspace by default.

## Data boundary

The core application does **not** require a commercial semiconductor data licence. It can analyse structured information supplied by a customer. It does not claim live market intelligence unless a live evidence provider is connected. Commercial lifecycle, availability, supplier, pricing and geopolitical feeds can later be added behind a secure backend.

## Architecture

`BOM → Normalization → Risk Engine → Dependency Graph → Product Impact → Analyst`

Long-term infrastructure graph:

`Chip → Component → Supplier → Manufacturer → Product → Factory → Customer → Revenue`

## Engineering principle

Demo/workspace data is explicitly distinguishable from authoritative external evidence. Risk scores are prioritisation signals, not guaranteed forecasts of loss or supply interruption.

The full product requirements and non-negotiable instructions are maintained in [`XILUQT_PRODUCT_SPEC.md`](./XILUQT_PRODUCT_SPEC.md).

**Built from Nigeria. Designed for the world.**
