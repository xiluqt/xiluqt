#!/usr/bin/env python3
"""Train XQ-Risk from validated real outcomes.
Input: brain/data/outcomes.jsonl with fields weather, congestion, inventory,
confidence, outcome (1 on-time, 0 delayed/disrupted).
"""
import json,math,pathlib
ROOT=pathlib.Path(__file__).resolve().parent
DATA=ROOT/'data'/'outcomes.jsonl';DATA.parent.mkdir(exist_ok=True)
OUT=ROOT/'real_model.json'
def sig(z):return 1/(1+math.exp(-max(-30,min(30,z))))
rows=[json.loads(x) for x in DATA.read_text().splitlines() if x.strip()] if DATA.exists() else []
w=[0.0]*4;b=0.0
for epoch in range(800):
    gw=[0.0]*4;gb=0.0
    for e in rows:
        x=[e['weather']/100,e['congestion']/100,e['inventory']/100,(100-e['confidence'])/60];y=float(e['outcome']);p=sig(b+sum(a*q for a,q in zip(w,x)));err=p-y
        for j in range(4):gw[j]+=err*x[j]
        gb+=err
    n=max(1,len(rows));lr=.08/(1+epoch/400)
    for j in range(4):w[j]-=lr*gw[j]/n
    b-=lr*gb/n
pred=[]
for e in rows:
    x=[e['weather']/100,e['congestion']/100,e['inventory']/100,(100-e['confidence'])/60];pred.append((sig(b+sum(a*q for a,q in zip(w,x)))>=.5)==bool(e['outcome']))
report={'model':'XQ-Risk-Real-v1','samples':len(rows),'accuracy':sum(pred)/len(pred) if pred else None,'weights':w,'bias':b}
OUT.write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
