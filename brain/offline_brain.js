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

/* XQ-MARITIME-VISUALS-V1: illustrative ship movement + live route mathematics + maritime livestream */
(function(){
  'use strict';
  function installMaritimeVisuals(){
    const live=document.getElementById('live');
    if(!live || document.getElementById('xqMaritimePanel')) return;
    const style=document.createElement('style');
    style.textContent=`
      #xqMaritimePanel{margin-top:14px}.xq-ship-map{height:300px;border-radius:14px;position:relative;overflow:hidden;border:1px solid #145184;background:linear-gradient(160deg,#071b31 0%,#06324b 45%,#031321 100%);box-shadow:inset 0 0 70px #00101f}
      .xq-gridlines{position:absolute;inset:0;background-image:linear-gradient(#4cc9ff18 1px,transparent 1px),linear-gradient(90deg,#4cc9ff18 1px,transparent 1px);background-size:38px 38px;transform:perspective(450px) rotateX(48deg) scale(1.5);transform-origin:center bottom;opacity:.65}
      .xq-route{position:absolute;left:9%;right:9%;top:55%;height:3px;background:linear-gradient(90deg,#21e8e0,#278cff,#20e6a1);box-shadow:0 0 14px #21e8e0;transform:rotate(-12deg);transform-origin:left center}
      .xq-ship{position:absolute;left:12%;top:48%;font-size:27px;filter:drop-shadow(0 0 9px #21e8e0);animation:xqShipMove 9s linear infinite}
      .xq-ship:after{content:'';position:absolute;width:75px;height:2px;left:-68px;top:17px;background:linear-gradient(90deg,transparent,#21e8e0);box-shadow:0 0 8px #21e8e0}
      @keyframes xqShipMove{0%{transform:translate(0,0) rotate(-12deg)}50%{transform:translate(58vw,-70px) rotate(-12deg)}100%{transform:translate(0,0) rotate(-12deg)}}
      .xq-port{position:absolute;padding:6px 8px;border:1px solid #1a5d88;background:#020b15dd;border-radius:9px;font-size:10px;color:#dff6ff}.xq-port.a{left:8%;bottom:17%}.xq-port.b{right:7%;top:18%}
      .xq-math{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.xq-math-card{padding:11px;border:1px solid #164b76;border-radius:11px;background:#04101e}.xq-math-card small{color:#83a6c7}.xq-math-card b{display:block;margin-top:5px;font-size:16px;color:#eaf6ff}.xq-formula{margin-top:10px;padding:12px;border:1px solid #145184;border-radius:11px;background:#020b16;font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace;color:#bfe6ff}.xq-live-video{margin-top:12px;border:1px solid #145184;border-radius:14px;overflow:hidden;background:#020a15}.xq-live-video iframe{display:block;width:100%;aspect-ratio:16/9;border:0}.xq-live-note{padding:9px 12px;font-size:10px;color:#83a6c7}.xq-live-badge{display:inline-block;margin-left:7px;color:#20e6a1;border:1px solid #14614d;border-radius:99px;padding:3px 6px}
      @media(max-width:800px){.xq-ship-map{height:235px}.xq-math{grid-template-columns:1fr 1fr}.xq-ship{animation-name:xqShipMoveMobile}@keyframes xqShipMoveMobile{0%{transform:translate(0,0) rotate(-12deg)}50%{transform:translate(58vw,-45px) rotate(-12deg)}100%{transform:translate(0,0) rotate(-12deg)}}}
    `;
    document.head.appendChild(style);
    const panel=document.createElement('section');panel.id='xqMaritimePanel';panel.className='card';
    panel.innerHTML=`
      <div class="eyebrow">MARITIME MOVEMENT VISUAL</div>
      <h3 style="margin:7px 0">Illustrative vessel route + live mathematics</h3>
      <p class="muted tiny" style="margin:0 0 10px">A visual demonstration of how Xiluqt can combine route geometry, vessel speed and ETA. The moving ship below is an illustration, not a live AIS vessel position.</p>
      <div class="xq-ship-map"><div class="xq-gridlines"></div><div class="xq-route"></div><div class="xq-port a">Lagos · Origin</div><div class="xq-port b">Singapore · Destination</div><div class="xq-ship" aria-label="illustrative moving cargo ship">🚢</div></div>
      <div class="xq-math">
        <div class="xq-math-card"><small>Route distance</small><b id="xqShipDistance">8,420 km</b></div>
        <div class="xq-math-card"><small>Vessel speed</small><b id="xqShipSpeed">18 kn</b></div>
        <div class="xq-math-card"><small>ETA</small><b id="xqShipEta">10.1 days</b></div>
        <div class="xq-math-card"><small>Progress</small><b id="xqShipProgress">0.0%</b></div>
      </div>
      <div class="xq-formula" id="xqShipFormula">ETA = distance ÷ speed → 8,420 km ÷ (18 kn × 1.852 km/h) = 252.7 h ≈ 10.53 days</div>
      <div class="xq-live-video"><div style="padding:10px 12px;border-bottom:1px solid #12365b"><span class="eyebrow">MARITIME LIVE VIDEO</span><span class="xq-live-badge">LIVE SOURCE</span></div><iframe src="https://www.youtube.com/embed/Gb1wejZyTCU" title="Port of Singapore live shipping webcam" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen></iframe><div class="xq-live-note">Port of Singapore livestream. Availability depends on the broadcaster; this video is external live context, not Xiluqt-owned telemetry.</div></div>`;
    const footer=live.querySelector('.footer');
    live.appendChild(panel);
    let progress=0;
    function updateMath(){
      const distance=8420,speedKn=18,speedKmh=speedKn*1.852;
      progress=(progress+0.12)%100;
      const remaining=distance*(1-progress/100),hours=remaining/speedKmh,days=hours/24;
      const d=document.getElementById('xqShipDistance'),s=document.getElementById('xqShipSpeed'),e=document.getElementById('xqShipEta'),p=document.getElementById('xqShipProgress'),f=document.getElementById('xqShipFormula');
      if(d)d.textContent=distance.toLocaleString()+' km';if(s)s.textContent=speedKn+' kn';if(p)p.textContent=progress.toFixed(1)+'%';if(e)e.textContent=days.toFixed(2)+' days';if(f)f.textContent=`ETA = remaining distance ÷ speed → ${Math.round(remaining).toLocaleString()} km ÷ (${speedKn} kn × 1.852 km/h) = ${hours.toFixed(1)} h ≈ ${days.toFixed(2)} days`;
    }
    updateMath();setInterval(updateMath,3000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMaritimeVisuals);else installMaritimeVisuals();
})();
