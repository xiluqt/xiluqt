#!/usr/bin/env python3
"""Xiluqt offline-first knowledge updater.

Run this once per day using the operating system scheduler. If there is no network,
no error is fatal: the previous local snapshot remains authoritative for offline use.
This module intentionally does not train on arbitrary web pages; each connector must
be added and licensed explicitly.
"""
from __future__ import annotations
import hashlib,json,pathlib,time,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent
REGISTRY=json.loads((ROOT/'sources.json').read_text())
CACHE=ROOT/'cache';CACHE.mkdir(exist_ok=True)
STATE=ROOT/'sync_state.json'
def fetch(url:str)->bytes:
    req=urllib.request.Request(url,headers={'User-Agent':'Xiluqt-OfflineBrain/1.0'})
    with urllib.request.urlopen(req,timeout=20) as r:return r.read(2_000_000)
def main():
    state=json.loads(STATE.read_text()) if STATE.exists() else {'sources':{}}
    updated=0
    for src in REGISTRY['sources']:
        try:
            data=fetch(src['url']);digest=hashlib.sha256(data).hexdigest()
            (CACHE/f"{src['id']}.snapshot").write_bytes(data)
            state['sources'][src['id']]={'checked_at':time.time(),'sha256':digest,'ok':True};updated+=1
        except Exception as exc:
            state['sources'][src['id']]={'checked_at':time.time(),'ok':False,'error':type(exc).__name__}
    state['last_run']=time.time();state['updated']=updated;STATE.write_text(json.dumps(state,indent=2))
    print(json.dumps({'updated':updated,'sources':len(REGISTRY['sources'])}))
if __name__=='__main__':main()
