(()=>{
  'use strict';
  const PAGES=['home','predict','live','api'];
  function show(page){
    if(!PAGES.includes(page)) return;
    document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===page));
    document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.getAttribute('data-page')===page));
    window.scrollTo({top:0,behavior:'smooth'});
    try{history.replaceState(null,'','#'+page)}catch(e){}
    window.dispatchEvent(new CustomEvent('xiluqt:navigate',{detail:{page}}));
  }
  function bind(){
    document.addEventListener('click',e=>{
      const el=e.target.closest('[data-page]');
      if(!el) return;
      e.preventDefault();
      e.stopPropagation();
      show(el.getAttribute('data-page'));
    },true);
    const initial=(location.hash||'#home').slice(1);
    show(PAGES.includes(initial)?initial:'home');
    window.XiluqtNavigate=show;
    window.XiluqtNavigation={pages:PAGES,go:show};
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true}); else bind();
})();
