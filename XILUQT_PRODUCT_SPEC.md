# Xiluqt Product Specification

## Purpose
Xiluqt is the actual Silicon Intelligence software foundation: a clean, client-presentable repository and installable web app for semiconductor dependency, lifecycle, supply-risk and product-impact analysis.

## Non-negotiable product rules

1. **Treat Xiluqt as the real software foundation, not a fake prototype.** Build working computation and usable interfaces rather than invented production claims.
2. **No fake live semiconductor intelligence.** External commercial semiconductor intelligence, market feeds, supplier databases and live telemetry are not connected unless a real integration is implemented and clearly identified.
3. **Distinguish computation from external data.** Local calculations are real and should be labelled as modeled/computed. External data that is not connected must never be presented as live.
4. **Keep evidence visible.** Risk should be explainable from structured inputs such as lifecycle, lead time, supplier concentration, geography, quantity, single-source status and alternatives.
5. **BOM-first workflow.** Users can load a CSV BOM locally. `part_number` is required; manufacturer, product, quantity, lifecycle, lead time, supplier count, geographic exposure, single-source status and alternatives are supported fields.
6. **Core intelligence layers:** BOM normalization → risk intelligence → dependency graph → product impact propagation → analyst interface.
7. **Product-impact reasoning must be downstream.** Component exposure should propagate into mapped products rather than existing only as a part-level score.
8. **AI Analyst must stay grounded in the current structured workspace.** It may answer from the local BOM and computed signals; it must not pretend to have connected external intelligence.
9. **Use the supplied Xiluqt mark.** Preserve the exact Xiluqt logo asset in the repository and do not replace it with an invented logo.
10. **Clean repository architecture suitable for showing an actual client.** Keep the app understandable, static-hostable and free of unnecessary demo clutter.
11. **GitHub Pages is a supported production-style static deployment target.** The repository should remain deployable without a backend for the local-first workflow.
12. **The website must also behave like a lightweight app.** It is an installable PWA, mobile-first, responsive, supports standalone display, has a mobile bottom navigation, and can work offline after the shell has been cached.
13. **Customer BOM data stays local by default.** Do not upload BOM files to a server in this static build.
14. **No old logistics dashboard regression.** Earlier Xiluqt logistics/movement dashboard concepts are visual history only; the current product is the Silicon Intelligence interface unless a future requirement explicitly changes the product domain.
15. **Production pass means functional verification.** Check navigation, CSV import, persistence, risk calculations, dependency mapping, analyst answers, mobile layout, PWA registration and offline shell before calling a release ready.

## Current app modules

- Overview
- Component Intelligence
- BOM Workspace
- Product Impact
- AI Analyst
- Installable PWA shell
- Offline service worker
- LocalStorage workspace persistence

## Current risk model

The present browser engine is intentionally deterministic and evidence-aware. It models risk from lifecycle posture, lead time, source concentration, geographic exposure and quantity, then maps scores into low, medium, high and critical bands. This is a decision-support model, not a forecast guarantee.

## Future integration boundary

Real semiconductor intelligence can be connected later through authenticated APIs or data connectors. When that happens, every external signal must identify its source, freshness and provenance. Until then, Xiluqt must remain honest about what is locally computed versus externally sourced.
