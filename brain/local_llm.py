#!/usr/bin/env python3
"""Optional local LLM bridge using Ollama on the same machine.
No cloud inference is required by this adapter."""
from __future__ import annotations
import json,urllib.request
OLLAMA='http://127.0.0.1:11434/api/generate'
DEFAULT_MODEL='qwen3.8'
def generate(prompt,model=DEFAULT_MODEL):
    body=json.dumps({'model':model,'prompt':prompt,'stream':False}).encode()
    req=urllib.request.Request(OLLAMA,data=body,headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=120) as r:return json.loads(r.read())
if __name__=='__main__':print(generate('Give one concise logistics-risk insight from an offline Xiluqt model.')['response'])
