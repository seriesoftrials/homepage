(() => {
  let requested=false;
  const root=document.documentElement;
  const home=location.pathname==='/'||location.pathname==='/index.html';
  if(home&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    root.classList.add('home-intro-pending');
    // Keep navigation available if the animation bundle or GPU is unavailable.
    setTimeout(()=>root.classList.remove('home-intro-pending','home-intro-playing','home-intro-fading'),6000);
  }
  function load(){
    if(requested||!document.querySelector('[data-home-ribbon]'))return;
    requested=true;
    const script=document.createElement('script');script.src='/home-ribbon.js?v=16';
    script.addEventListener('error',()=>{requested=false;root.classList.remove('home-intro-pending','home-intro-playing','home-intro-fading');});document.head.append(script);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
  document.addEventListener('serial:pagechange',load);
})();
