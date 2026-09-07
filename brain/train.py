import json,math,random,time
from pathlib import Path

def sig(x): return 1/(1+math.exp(-max(-30,min(30,x))))
def main():
    random.seed(42); n=12000; w=[2.9,3.8,2.1]; b=-2.5; lr=.04
    data=[]
    for _ in range(n):
        x=[random.random(),random.random(),random.random()]
        y=1 if sig(-3+3.2*x[0]+4.2*x[1]+2.4*x[2])>.5 else 0
        data.append((x,y))
    for _ in range(80):
        g=[0.,0.,0.]; gb=0.
        for x,y in data:
            p=sig(b+sum(w[j]*x[j] for j in range(3))); e=p-y
            for j in range(3): g[j]+=e*x[j]
            gb+=e
        for j in range(3): w[j]-=lr*g[j]/n
        b-=lr*gb/n
    correct=0
    for x,y in data[-2000:]: correct += int((sig(b+sum(w[j]*x[j] for j in range(3)))>.5)==bool(y))
    out={'model':'XQ-Risk-Local-v0.3','version':time.strftime('%Y%m%d%H%M'),'weights':w,'bias':b,'validation_accuracy':round(correct/2000,4),'training_examples':n,'note':'Synthetic training only; not production performance.'}
    Path('brain/model.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps(out,indent=2))
if __name__=='__main__': main()
