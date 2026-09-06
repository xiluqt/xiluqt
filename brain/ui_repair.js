(function(){'use strict';
const KEY='xiluqt-ui-repair-v1';
function q(id){return document.getElementById(id)}
function renderTrend(){
  const bars=q('bars'); if(!bars)return;
  const brain=window.XiluqtBrain;
  const w=+(q('w')?.value||30),c=+(q('c')?.value||35),i=+(q('i')?.value||20),f=+(q('f')?.value||85);
  let risk=brain&&typeof brain.infer==='function' ? brain.infer(w,c,i,f) : {d:.13,u:.05};
  const base=Math.round((risk.d+risk.u)*100);
  const now=new Date();
  const vals=[base+9,base+5,base+3,base];
  bars.innerHTML='';
  vals.forEach((v,n)=>{const wrap=document.createElement('div');wrap.style.cssText='flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;min-width:0';const b=document.createElement('div');b.className='bar';b.style.height=Math.max(12,Math.min(100,v*1.55))+'%';b.title='Movement risk '+v+'%';const lab=document.createElement('div');lab.className='barlabel';const t=new Date(now.getTime()-(3-n)*6*3600000);lab.textContent=n===3?'Now':String(t.getHours()).padStart(2,'0')+'h';wrap.append(b,lab);bars.appendChild(wrap)});
}
function bindSliders(){[['w','pw'],['c','pc'],['i','pi'],['f','pf']].forEach(([a,b])=>{const e=q(a),out=q(b);if(e&&out){const sync=()=>{out.textContent=e.value+'%';renderTrend()};e.removeEventListener('input',e._xqSync||(()=>{}));e._xqSync=sync;e.addEventListener('input',sync);sync()}})}
function bindInfer(){const b=q('infer');if(!b||b.dataset.xqRepair==='1')return;b.dataset.xqRepair='1';b.addEventListener('click',()=>{try{window.XiluqtBrain&&window.XiluqtBrain.render&&window.XiluqtBrain.render();renderTrend();}catch(e){console.error('[Xiluqt] inference repair',e)}})}
function bindApi(){const b=q('apiRun');if(!b||b.dataset.xqRepair==='1')return;b.dataset.xqRepair='1';b.addEventListener('click',()=>{setTimeout(()=>{try{window.XiluqtBrain&&window.XiluqtBrain.render&&window.XiluqtBrain.render();renderTrend()}catch(e){console.error('[Xiluqt] api repair',e)}},30)})}
function diagnostics(){const tests=[
 ['DOM home',!!q('home')],['DOM predict',!!q('predict')],['risk trend container',!!q('bars')],['scenario weather',!!q('w')],['scenario congestion',!!q('c')],['scenario inventory',!!q('i')],['scenario confidence',!!q('f')],['inference button',!!q('infer')],['brain API',!!(window.XiluqtBrain&&typeof window.XiluqtBrain.infer==='function')],['navigation API',typeof window.XiluqtNavigate==='function']
];const failed=tests.filter(x=>!x[1]);window.XiluqtDiagnostics={passed:tests.length-failed.length,total:tests.length,failed:failed.map(x=>x[0]),time:new Date().toISOString()};localStorage.setItem(KEY,JSON.stringify(window.XiluqtDiagnostics));if(failed.length)console.warn('[Xiluqt diagnostics] failed',failed);return window.XiluqtDiagnostics}
function boot(){bindSliders();bindInfer();bindApi();renderTrend();setInterval(renderTrend,5000);diagnostics();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
