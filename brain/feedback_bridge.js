(function(){
'use strict';
const KEY='xiluqt-real-outcomes-v1';
const PKEY='xiluqt-prediction-ledger-v1';
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const getNum=id=>{const e=document.getElementById(id);return e?+e.value:0};
function currentFeatures(){return{weather:getNum('w'),congestion:getNum('c'),inventory:getNum('i'),confidence:getNum('f')}}
function recordPrediction(source){
 const e=currentFeatures();
 let r=null;try{r=window.XiluqtBrain&&window.XiluqtBrain.infer(e.weather,e.congestion,e.inventory,e.confidence)}catch(_){ }
 const row={id:'pred_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),timestamp:Date.now()/1000,source,weather:e.weather,congestion:e.congestion,inventory:e.inventory,confidence:e.confidence,prediction:r?{on_time:+r.o.toFixed(6),delay:+r.d.toFixed(6),disruption:+r.u.toFixed(6)}:null};
 const rows=load(PKEY,[]);rows.unshift(row);save(PKEY,rows.slice(0,500));return row;
}
function addOutcome(y){
 const p=load(PKEY,[])[0];
 const row={timestamp:Date.now()/1000,outcome:y,weather:getNum('lwIn'),congestion:getNum('lcIn'),inventory:getNum('liIn'),confidence:getNum('lfIn'),source:'web-validated',prediction_id:p?p.id:null,prediction:p?p.prediction:null};
 const rows=load(KEY,[]);rows.unshift(row);save(KEY,rows.slice(0,500));
 const b=document.getElementById('brainStatus');if(b)b.textContent='🧠 FEEDBACK CAPTURED';
 toast('Outcome captured for Xiluqt learning');
}
function exportJSONL(){
 const rows=load(KEY,[]);if(!rows.length){toast('No validated outcomes yet');return}
 const text=rows.slice().reverse().map(x=>JSON.stringify(x)).join('\n')+'\n';
 const blob=new Blob([text],{type:'application/x-ndjson'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='xiluqt-outcomes.jsonl';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(rows.length+' validated outcomes exported');
}
function addExportButton(){
 const card=document.querySelector('#learn .card.section');if(!card||document.getElementById('exportOutcomes'))return;
 const b=document.createElement('button');b.id='exportOutcomes';b.className='btn secondary';b.style.marginTop='10px';b.textContent='⇩ Export training data (.jsonl)';b.onclick=exportJSONL;card.appendChild(b);
}
function toast(msg){if(typeof window.toast==='function'){window.toast(msg);return}let x=document.querySelector('.toast');if(!x){x=document.createElement('div');x.className='toast';x.style='position:fixed;right:16px;bottom:88px;z-index:200;background:#061a2c;border:1px solid #1c5d83;border-radius:11px;padding:11px 14px;box-shadow:0 12px 40px #0008';document.body.appendChild(x)}x.textContent=msg;x.style.opacity=1;clearTimeout(x.t);x.t=setTimeout(()=>x.style.opacity=0,2200)}
function wire(){
 const infer=document.getElementById('infer');if(infer&&!infer.dataset.feedbackWired){infer.dataset.feedbackWired='1';infer.addEventListener('click',()=>recordPrediction('scenario-inference'))}
 const api=document.getElementById('apiRun');if(api&&!api.dataset.feedbackWired){api.dataset.feedbackWired='1';api.addEventListener('click',runApiPrediction)}
 const on=document.getElementById('onTime');if(on&&!on.dataset.feedbackWired){on.dataset.feedbackWired='1';on.addEventListener('click',()=>addOutcome(1))}
 const off=document.getElementById('delayed');if(off&&!off.dataset.feedbackWired){off.dataset.feedbackWired='1';off.addEventListener('click',()=>addOutcome(0))}
 const gpsStart=document.getElementById('gpsStart');if(gpsStart&&!gpsStart.dataset.gpsWired){gpsStart.dataset.gpsWired='1';gpsStart.addEventListener('click',startGPS)}
 const gpsStop=document.getElementById('gpsStop');if(gpsStop&&!gpsStop.dataset.gpsWired){gpsStop.dataset.gpsWired='1';gpsStop.addEventListener('click',stopGPS)}
 addExportButton();
}
function runApiPrediction(){
 const w=getNum('w'),c=getNum('c'),i=getNum('i'),f=getNum('f');
 let r=null;try{r=window.XiluqtBrain&&window.XiluqtBrain.infer(w,c,i,f)}catch(_){ }
 if(!r){const stress=.42*w+.42*c+.16*i;const risk=Math.max(0,Math.min(.92,(stress*(1.02-(f-40)/120))/100));const d=Math.min(.8,risk*.72),u=Math.min(.3,risk*.28),o=Math.max(.02,1-d-u),s=o+d+u;r={o:o/s,d:d/s,u:u/s}}
 const out=document.getElementById('apiResponse');
 if(out)out.textContent=JSON.stringify({on_time_probability:+r.o.toFixed(3),delay_probability:+r.d.toFixed(3),disruption_probability:+r.u.toFixed(3),confidence:+(f/100).toFixed(2),model_version:(window.XiluqtBrain&&window.XiluqtBrain.model&&window.XiluqtBrain.model.version)||'XQ-Risk-DigitalTwin-v0.2',offline:true},null,2);
 recordPrediction('api-preview');toast('API response regenerated ✓');
}
let gpsId=null;
function startGPS(){
 const status=document.getElementById('gpsStatus'),signal=document.getElementById('gpsSignal');
 if(!navigator.geolocation){if(status)status.textContent='Geolocation is not supported on this device.';return}
 if(!window.isSecureContext){if(status)status.textContent='GPS requires HTTPS. Open the Xiluqt GitHub Pages URL.';return}
 if(status)status.textContent='Requesting live GPS permission…';
 gpsId=navigator.geolocation.watchPosition(p=>{const c=p.coords;
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  set('lat',Number(c.latitude).toFixed(5));set('lon',Number(c.longitude).toFixed(5));set('speed',c.speed==null?'—':(c.speed*3.6).toFixed(1)+' km/h');set('acc',Math.round(c.accuracy)+' m');
  if(status)status.textContent='Live device position received.';if(signal){signal.textContent='LIVE';signal.className='status'}
  const ev=document.getElementById('events');if(ev)ev.textContent=String((+ev.textContent||0)+1);
 },e=>{if(status)status.textContent=e.code===1?'GPS permission denied. Allow Location for Xiluqt in iPhone Settings.':'GPS unavailable: '+e.message;if(signal){signal.textContent='STANDBY';signal.className='status warn'}},{enableHighAccuracy:true,maximumAge:3000,timeout:15000});
 toast('Live GPS started');
}
function stopGPS(){if(gpsId!==null&&navigator.geolocation)navigator.geolocation.clearWatch(gpsId);gpsId=null;const status=document.getElementById('gpsStatus'),signal=document.getElementById('gpsSignal');if(status)status.textContent='GPS paused.';if(signal){signal.textContent='STANDBY';signal.className='status warn'}toast('Live GPS stopped')}
window.XiluqtFeedback={recordPrediction,addOutcome,exportJSONL,runApiPrediction,startGPS,stopGPS};
window.addEventListener('DOMContentLoaded',()=>{setTimeout(wire,100);setInterval(wire,1500)});
})();
