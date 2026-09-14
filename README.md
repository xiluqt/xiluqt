# Xiluqt Silicon Intelligence

Production-oriented web application for semiconductor dependency, lifecycle, sourcing and product-impact intelligence.

## What it does

- Ingests customer BOM CSVs in the browser.
- Normalizes component identifiers and procurement fields.
- Calculates a transparent dependency-risk score from lifecycle, lead time, source concentration and geopolitical exposure.
- Propagates component risk into product exposure.
- Surfaces candidate alternative counts when supplied by the BOM.
- Provides a local AI-style analyst for operational questions and recommendations.
- Persists the current workspace locally in the browser.
- Uses the supplied Xiluqt brand mark throughout the application.

## Data boundary

The core workflow does not require a commercial semiconductor data licence: a customer's own BOM can be analysed locally. The application does not claim live market data unless a live source is connected. Demo data is labelled. Licensed lifecycle, availability, supplier and pricing feeds can later be connected through a secure backend.

## Architecture

`BOM → Normalization → Risk Engine → Dependency Graph → Product Impact → Analyst`

Long-term graph:

`Chip → Component → Supplier → Manufacturer → Product → Factory → Customer → Revenue`

Built from Nigeria. Designed for the world.
