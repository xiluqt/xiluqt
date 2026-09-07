(()=>{
const KEY='xiluqt-model-v4';let gpsWatch=null;
let model={version:'0.4',weights:[2.9,3.8,2.1],bias:-2.5};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.weights)model=s}catch(e){}
fetch('./brain/model.json?'+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(m=>{if(m&&m.weights){model={version:m.version||'0.4',weights:m.weights,bias:m.bias};localStorage.setItem(KEY,JSON.stringify(model));}}).catch(()=>{});
const sigmoid=x=>1/(1+Math.exp(-Math.max(-30,Math.min(30,x))));
function predict(x){
 const w=+x.w/100,c=+x.c/100,i=+x.i/100,f=+x.f/100;
 const risk=sigmoid(model.bias+model.weights[0]*w+model.weights[1]*c+model.weights[2]*i-1.6*f);
 const disruption=Math.min(.92,risk*.42),delay=Math.min(.95,risk*.78),onTime=Math.max(.02,1-delay-disruption*.45);
 const confidence=Math.max(.35,Math.min(.98,.55+.4*f-.12*(w+c)/2));
 let action='✓ Keep route; monitor conditions.';
 if(risk>.68)action='⚠ Escalate: consider alternate route and inventory buffer.';
 else if(risk>.42)action='△ Monitor: tighten ETA and intervention threshold.';
 const arr=[['weather',w],['congestion',c],['inventory pressure',i]].sort((a,b)=>b[1]-a[1]);
 return{model:'XQ-Risk-Local-'+model.version,onTime,delay,disruption,confidence,action,reason:arr[0][0]+' is currently the strongest modeled stressor.',risk};
}
async function train(n=2000,progress=()=>{}){
 let w=[2.9,3.8,2.1],b=-2.5,lr=.035,correct=0;
 for(let e=0;e<55;e++){
  let g=[0,0,0],gb=0;
  for(let k=0;k<n;k++){
   const x=[Math.random(),Math.random(),Math.random()];
   const truth=sigmoid(-3+3.2*x[0]+4.2*x[1]+2.4*x[2])>.5?1:0;
   const p=sigmoid(b+w[0]*x[0]+w[1]*x[1]+w[2]*x[2]),err=p-truth;
   g[0]+=err*x[0];g[1]+=err*x[1];g[2]+=err*x[2];gb+=err;
  }
  for(let j=0;j<3;j++)w[j]-=lr*g[j]/n;b-=lr*gb/n;
  if(e%2===0){progress(e/55);await new Promise(r=>setTimeout(r,0));}
 }
 model={version:'0.4.'+Date.now().toString().slice(-4),weights:w,bias:b};localStorage.setItem(KEY,JSON.stringify(model));
 for(let k=0;k<300;k++){const x=[Math.random(),Math.random(),Math.random()],y=sigmoid(-3+3.2*x[0]+4.2*x[1]+2.4*x[2])>.5?1:0,p=sigmoid(b+w[0]*x[0]+w[1]*x[1]+w[2]*x[2]);correct+=((p>.5)?1:0)===y?1:0;}
 return{accuracy:(correct/300).toFixed(3),steps:55,version:model.version};
}
async function weather(){
 const pts={lagos:[6.52,3.38],singapore:[1.35,103.82],dubai:[25.20,55.27]},out={};
 for(const [name,p] of Object.entries(pts)){
  const u='https://api.open-meteo.com/v1/forecast?latitude='+p[0]+'&longitude='+p[1]+'&current=temperature_2m,precipitation,wind_speed_10m';
  const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error('weather');const j=await r.json();
  out[name]=Math.round(j.current.temperature_2m)+'°C · '+Math.round(j.current.wind_speed_10m)+' km/h wind';
 }
 return out;
}
function startGPS(cb){if(!navigator.geolocation)return false;stopGPS();gpsWatch=navigator.geolocation.watchPosition(cb,()=>{}, {enableHighAccuracy:true,maximumAge:3000,timeout:10000});return true}
function stopGPS(){if(gpsWatch!=null)navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null}
window.XiluqtCore={predict,train,weather,startGPS,stopGPS,getModel:()=>model};
})();