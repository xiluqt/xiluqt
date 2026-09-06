# Xiluqt Offline Brain

Xiluqt's offline-first intelligence layer.

## What it does
- Keeps a local risk model available without network access.
- Stores model state and source freshness locally.
- Uses an explicit source registry instead of silently scraping the web.
- Adds a daily sync job that updates cached source snapshots when connectivity exists.
- Preserves the last known good state when a source is unavailable.
- Separates knowledge retrieval from model training: new documents are not treated as ground-truth labels automatically.

## Important limitation
A machine cannot receive new real-world information while it has zero network connectivity. The correct architecture is **offline-first + opportunistic synchronization**: the updater runs automatically when connectivity exists, then inference continues offline.

This also cannot honestly guarantee an AI that is "100% smarter than ChatGPT." Xiluqt can be made stronger for logistics/movement intelligence through specialized data, evaluation and models, while general conversational capability is a separate benchmark.

## Desktop daily scheduler
Linux/macOS: run `python3 daily_sync.py` once every 24 hours using cron/launchd.
Windows: use Task Scheduler to run `python daily_sync.py` daily.

For an air-gapped deployment, move approved source snapshots into `cache/` through a controlled data-transfer process.
