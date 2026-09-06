(function(){
  'use strict';
  const MODEL={version:'XQ-Risk-DigitalTwin-v0.2',bias:-5.226421069164394,weights:[3.403082245556661,4.020611855209905,2.1319227485804304,1.7415474832554723,2.0870978492201617,2.5846513515661176,1.1888712712554723]};
  const SOURCES=[
    {id:'open-meteo',name:'Open-Meteo',kind:'weather',url:'https://open-meteo.com/en/docs',cadence:'hours'},
    {id:'nasa-gibs',name:'NASA GIBS / Earthdata',kind:'earth-observation',url:'https://nasa-gibs.github.io/gibs-api-docs/',cadence:'daily'},
    {id:'opensky',name:'OpenSky Network',kind:'aviation',url:'https://opensky-network.org/apidoc/',cadence:'minutes'},
    {id:'openstreetmap',name:'OpenStreetMap',kind:'roads',url:'https://www.openstreetmap.org/',cadence:'rolling'},
    {id:'osrm',name:'OSRM',kind:'routing',url:'https://project-osrm.org/docs/v5.24.0/api/',cadence:'rolling'},
    {id:'worldbank',name:'World Bank Data',kind:'macro',url:'https://data.worldbank.org/',cadence:'daily'},
    {id:'nitda',name:'NITDA',kind:'nigeria-regulation',url:'https://nitda.gov.ng/',cadence:'daily'},
    {id:'ndpc',name:'NDPC',kind:'data-protection',url:'https://www.ndpc.gov.ng/',cadence:'daily'},
    {id:'cac',name:'Corporate Affairs Commission',kind:'company-registry',url:'https://www.cac.gov.ng/',cadence:'daily'}
  ];
  const KEY='xiluqt-offline-brain-v1';
  const state=JSON.parse(localStorage.getItem(KEY)||'{"examples":[],"lastSync":null,"sourceVersions":{},"events":0}');
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const sigmoid=z=>1/(1+Math.exp(-clamp(z,-30,30)));
  function risk(w,c,i,f){const x=[w/100,c/100,i/100,(100-f)/60];const z=MODEL.bias+MODEL.weights[0]*x[0]+MODEL.weights[1]*x[1]+MODEL.weights[2]*x[2]+MODEL.weights[3]*x[3];return clamp(sigmoid(z),0.01,0.97);}
  function infer(w,c,i,f){const r=risk(w,c,i,f),d=clamp(r*.72,0,.8),u=clamp(r*.28,0,.3),o=clamp(1-d-u,.02,.98),s=o+d+u;return{o:o/s,d:d/s,u:u/s,confidence:f/100,model:MODEL.version};}
  function persist(){localStorage.setItem(KEY,JSON.stringify(state));}
  function stamp(){state.lastSync=new Date().toISOString();state.events++;persist();}
  function installStatus(){const top=document.querySelector('.top .pill');if(top){const b=document.createElement('span');b.id='brainStatus';b.className='pill';b.style.marginLeft='8px';b.textContent='🧠 OFFLINE BRAIN · READY';top.parentElement.appendChild(b);}const hero=document.querySelector('#home .hero .mini');if(hero){const d=document.createElement('div');d.innerHTML='<small class="muted">Brain</small><b id="brainMode">LOCAL</b>';hero.appendChild(d);}}
  function render(){const wEl=document.getElementById('w'),cEl=document.getElementById('c'),iEl=document.getElementById('i'),fEl=document.getElementById('f');if(!wEl||!cEl||!iEl||!fEl)return;const w=+wEl.value,c=+cEl.value,i=+iEl.value,f=+fEl.value;const r=infer(w,c,i,f),o=Math.round(r.o*100),d=Math.round(r.d*100),u=100-o-d;const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};set('predOn',o+'%');set('predOn2',o+'%');set('predDelay',d+'%');set('predDisrupt',u+'%');set('homeOn',o+'%');set('homeDelay',d+'%');set('homeDisrupt',u+'%');set('homeConf',f+'%');set('homeRing',o+'%');const ring=document.getElementById('homeRing');if(ring&&ring.parentElement)ring.parentElement.style.background=`conic-gradient(var(--green) 0 ${o}%,var(--orange) ${o}% ${o+d}%,var(--red) ${o+d}% 100%)`;const pr=document.getElementById('predRing');if(pr)pr.style.background=`conic-gradient(var(--green) 0 ${o}%,var(--orange) ${o}% ${o+d}%,var(--red) ${o+d}% 100%)`;const decision=o>=75?'✓ Keep route; monitor congestion.':d>=20?'⚠ Prepare alternate route and capacity.':'⚠ Escalate for operational review.';set('predDecision',decision);set('homeDecision',decision);set('intervention',o>=75?'Monitor signals; intervene if congestion rises.':d>=20?'Pre-position capacity and evaluate alternate routing.':'Escalate to operations and request fresh telemetry.');const api=document.getElementById('apiResponse');if(api)api.textContent=JSON.stringify({on_time_probability:+r.o.toFixed(3),delay_probability:+r.d.toFixed(3),disruption_probability:+r.u.toFixed(3),confidence:+r.confidence.toFixed(2),model_version:r.model,offline:true},null,2);}
  function wireNavigation(){
    const allowed=new Set(['home','predict','live','api']);
    const go=(page)=>{if(!allowed.has(page))return;const target=document.getElementById(page);if(!target)return;document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===page));document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.getAttribute('data-page')===page));window.scrollTo({top:0,behavior:'smooth'});if(window.XiluqtBrain&&typeof window.XiluqtBrain.render==='function')setTimeout(window.XiluqtBrain.render,0);};
    document.querySelectorAll('[data-page]').forEach(btn=>{if(btn.dataset.xqNavFixed==='1')return;btn.dataset.xqNavFixed='1';btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();go(this.getAttribute('data-page'));},true);});
    document.addEventListener('click',function(ev){const btn=ev.target.closest&&ev.target.closest('[data-page]');if(btn){ev.preventDefault();go(btn.getAttribute('data-page'));}},true);
    window.XiluqtNavigate=go;
  }
  async function syncSources(){if(!navigator.onLine)return{ok:false,reason:'offline'};let ok=0;for(const s of SOURCES){try{const r=await fetch(s.url,{method:'GET',mode:'cors',cache:'no-store'});if(r.ok){state.sourceVersions[s.id]=new Date().toISOString();ok++;}}catch(_){}}stamp();return{ok:true,updated:ok};}
  function schedule(){const day=86400000,last=state.lastSync?Date.parse(state.lastSync):0,delay=Math.max(1000,day-(Date.now()-last));setTimeout(async()=>{await syncSources();schedule();},delay);}
  window.XiluqtBrain={model:MODEL,sources:SOURCES,infer,render,syncSources,state};
  window.addEventListener('online',()=>setTimeout(syncSources,1500));
  window.addEventListener('DOMContentLoaded',()=>{installStatus();wireNavigation();['w','c','i','f'].forEach(id=>{const e=document.getElementById(id);if(e)e.addEventListener('input',()=>setTimeout(render,0));});const api=document.getElementById('apiRun');if(api)api.addEventListener('click',()=>setTimeout(render,0));setTimeout(render,0);syncSources();schedule();});
  if(document.readyState!=='loading')setTimeout(wireNavigation,0);
})();
