#!/usr/bin/env python3
"""Xiluqt autonomous learning controller.

Design:
  1. Refresh approved data when connectivity exists.
  2. Train only from validated outcomes in data/outcomes.jsonl.
  3. Evaluate a candidate model against a chronological holdout.
  4. Promote the candidate only when it beats the current model.
  5. Never turn raw observations into labels automatically.

Run once (`python3 autolearn.py`) or continuously (`--daemon`).
"""
from __future__ import annotations
import argparse,json,math,pathlib,time
from datetime import datetime,timezone

ROOT=pathlib.Path(__file__).resolve().parent
DATA=ROOT/'data'/'outcomes.jsonl'; MODEL=ROOT/'real_model.json'; STATE=ROOT/'autolearn_state.json'; HISTORY=ROOT/'model_history.jsonl'


def sig(z): return 1/(1+math.exp(-max(-30,min(30,z))))
def features(e): return [e['weather']/100,e['congestion']/100,e['inventory']/100,(100-e['confidence'])/60]
def load_rows():
    if not DATA.exists(): return []
    out=[]
    for line in DATA.read_text().splitlines():
        if line.strip():
            try:
                e=json.loads(line); out.append((float(e['timestamp']) if 'timestamp' in e else 0,e))
            except Exception: pass
    return [e for _,e in sorted(out,key=lambda x:x[0])]

def fit(rows,epochs=800):
    w=[0.0]*4;b=0.0
    for epoch in range(epochs):
        gw=[0.0]*4;gb=0.0
        for e in rows:
            x=features(e); y=float(e['outcome']); p=sig(b+sum(a*q for a,q in zip(w,x))); err=p-y
            for j in range(4): gw[j]+=err*x[j]
            gb+=err
        n=max(1,len(rows)); lr=.08/(1+epoch/400)
        for j in range(4): w[j]-=lr*gw[j]/n
        b-=lr*gb/n
    return {'model':'XQ-Risk-Real-v2','trained_at':datetime.now(timezone.utc).isoformat(),'samples':len(rows),'weights':w,'bias':b}

def accuracy(model,rows):
    if not rows:return None
    correct=0
    for e in rows:
        p=sig(model['bias']+sum(a*q for a,q in zip(model['weights'],features(e))))
        correct += int((p>=.5)==bool(e['outcome']))
    return correct/len(rows)

def run_once():
    # Opportunistic sync; failure is intentionally non-fatal for offline operation.
    try:
        import daily_sync; daily_sync.main()
    except Exception as exc:
        print('sync skipped:',type(exc).__name__)
    rows=load_rows()
    if len(rows)<10:
        result={'status':'waiting_for_validated_outcomes','samples':len(rows),'minimum':10}
        STATE.write_text(json.dumps(result,indent=2));print(json.dumps(result));return result
    split=max(1,int(len(rows)*.8));train,test=rows[:split],rows[split:]
    candidate=fit(train);candidate['validation_accuracy']=accuracy(candidate,test)
    current=None
    if MODEL.exists():
        try: current=json.loads(MODEL.read_text())
        except Exception: current=None
    current_acc=accuracy(current,test) if current and 'weights' in current else None
    promote=current is None or (candidate['validation_accuracy'] is not None and current_acc is not None and candidate['validation_accuracy']>current_acc)
    if promote:
        if current: HISTORY.parent.mkdir(exist_ok=True); HISTORY.open('a').write(json.dumps({'time':time.time(),'old_validation_accuracy':current_acc,'new_validation_accuracy':candidate['validation_accuracy']})+'\n')
        MODEL.write_text(json.dumps(candidate,indent=2))
    result={'status':'promoted' if promote else 'rejected_candidate','samples':len(rows),'train_samples':len(train),'validation_samples':len(test),'candidate_validation_accuracy':candidate['validation_accuracy'],'current_validation_accuracy':current_acc,'model_version':candidate['model'] if promote else (current.get('model') if current else None),'checked_at':time.time()}
    STATE.write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));return result

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--daemon',action='store_true');ap.add_argument('--hours',type=float,default=24);args=ap.parse_args()
    while True:
        run_once()
        if not args.daemon: break
        time.sleep(max(60,args.hours*3600))
if __name__=='__main__':main()
