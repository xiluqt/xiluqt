# Xiluqt validated outcomes

`outcomes.jsonl` is the supervised-learning ledger. Each line represents a real, verified operational outcome.

Minimum fields:

```json
{"timestamp":1760000000,"weather":65,"congestion":70,"inventory":40,"confidence":82,"outcome":0}
```

- `weather`: normalized stress score 0-100
- `congestion`: 0-100
- `inventory`: 0-100
- `confidence`: signal confidence 0-100
- `outcome`: `1` = on-time / successful movement, `0` = delayed / disrupted
- `timestamp`: Unix timestamp for chronological evaluation

Do **not** manufacture labels. A row should only be written after the corresponding movement outcome is verified.

`../autolearn.py` uses the oldest 80% of validated outcomes for training and the newest 20% as a holdout. A candidate model is promoted only when its holdout accuracy beats the currently deployed model.
