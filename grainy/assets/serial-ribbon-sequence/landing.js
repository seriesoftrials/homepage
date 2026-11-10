import * as THREE from './vendor/three.module.js';
import {createSequence,SEQUENCE_DURATION,ROTATION_DURATION,nextRotationStop} from './sequence.js';
import {createGlassMaterial,createGlassEnvironment} from './glass.js';

// Mount inside a square, sized button containing a canvas and an optional poster.
// The study viewer is deliberately excluded from this landing-page runtime.
export function mountRibbon(holder,{initialElapsed=0,createOutline,onReady}={}){
  const canvas=holder.querySelector('canvas');
  if(!canvas)throw new Error('The ribbon holder needs a canvas.');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}
  catch{return {holder,state:{elapsed:initialElapsed},dispose(){}};}
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.transmissionResolutionScale=.5;
  const scene=new THREE.Scene();
  let environment=createGlassEnvironment(THREE,renderer);
  scene.environment=environment.texture;
  const camera=new THREE.OrthographicCamera(-1.54,1.54,1.54,-1.54,.1,30);
  camera.position.set(0,0,6);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0xb5bac5,.8));
  for(const [intensity,position] of [[1.1,[-3,4,6]],[.45,[4,-2,4]],[.6,[-4,-1,-3]]]){
    const light=new THREE.DirectionalLight(0xffffff,intensity);light.position.set(...position);scene.add(light);
  }
  const model=createSequence({material:createGlassMaterial(THREE)});scene.add(model.group);
  const outline=createOutline?.(THREE,model.group);
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const hoverPreference=matchMedia('(hover: hover) and (pointer: fine)');
  const state={elapsed:preference.matches?SEQUENCE_DURATION:Math.max(0,initialElapsed),
    playing:!preference.matches,userPaused:false,stopAt:Infinity,visible:true,
    hovered:hoverPreference.matches&&holder.matches(':hover'),focused:false,
    lineProgress:0,contextLost:false,disposed:false,ready:false};
  let frame=0,last=performance.now();
  function schedule(){
    if(!frame&&!state.disposed&&!state.contextLost&&!document.hidden&&state.visible)
      frame=requestAnimationFrame(draw);
  }
  function stopFrame(){cancelAnimationFrame(frame);frame=0;}
  function resetClock(){last=performance.now();schedule();}
  function draw(now){
    frame=0;if(state.disposed||state.contextLost||document.hidden||!state.visible)return;
    const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;
    if(state.playing){
      state.elapsed=Math.min(state.stopAt,state.elapsed+dt);
      if(state.elapsed>=state.stopAt)state.playing=false;
    }
    const sample=model.update(state.elapsed/SEQUENCE_DURATION);
    const target=state.hovered||state.focused?1:0;
    state.lineProgress=preference.matches?target:state.lineProgress+(target-state.lineProgress)*(1-Math.exp(-dt*18));
    const unsettled=Boolean(outline)&&Math.abs(state.lineProgress-target)>=.0005;
    if(!unsettled)state.lineProgress=target;
    outline?.setProgress(state.lineProgress);
    renderer.render(scene,camera);holder.classList.add('is-ready');
    if(!state.ready){state.ready=true;onReady?.();}
    holder.dataset.ribbonPhase=sample.phase;
    holder.setAttribute('aria-pressed',String(state.playing));
    const english=holder.ownerDocument?.documentElement.lang==='en';
    holder.setAttribute('aria-label',english
      ?(state.playing?'Pause SERIAL logo animation':'Play SERIAL logo animation')
      :(state.playing?'SERIAL 로고 애니메이션 일시정지':'SERIAL 로고 애니메이션 재생'));
    if(state.playing||unsettled)schedule();
  }
  function resize(){
    const rect=holder.getBoundingClientRect(),width=Math.max(1,rect.width),height=Math.max(1,rect.height);
    // Supersample 1x previews and retain native iPhone density within a 2048px budget.
    renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio||1,2),3,2048/Math.max(width,height)));
    renderer.setSize(width,height,false);outline?.resize(width,height);
    camera.left=-1.54*width/height;camera.right=1.54*width/height;camera.updateProjectionMatrix();resetClock();
  }
  function pause(){state.playing=false;state.userPaused=true;resetClock();}
  function seek(elapsed){state.elapsed=Math.max(0,elapsed);resetClock();}
  function resume(){
    state.userPaused=false;state.playing=true;
    // Reduced-motion visitors can request one turn; automatic motion stays off.
    state.stopAt=preference.matches?nextRotationStop(state.elapsed/SEQUENCE_DURATION)*SEQUENCE_DURATION:Infinity;
    if(preference.matches)state.elapsed=Math.max(state.elapsed,state.stopAt-ROTATION_DURATION);
    resetClock();
  }
  function toggle(event){if(event.button>0)return;state.playing?pause():resume();}
  function visibility(){last=performance.now();if(document.hidden)stopFrame();else schedule();}
  function reduced(event){
    if(event.matches){state.elapsed=SEQUENCE_DURATION;state.playing=false;}
    else if(!state.userPaused){state.playing=true;state.stopAt=Infinity;}
    resetClock();
  }
  function contextLost(event){event.preventDefault();state.contextLost=true;holder.classList.remove('is-ready');stopFrame();}
  function contextRestored(){
    environment.dispose();environment=createGlassEnvironment(THREE,renderer);scene.environment=environment.texture;
    state.contextLost=false;resetClock();
  }
  function pointerEnter(event){if(event.pointerType==='touch'||!hoverPreference.matches)return;state.hovered=true;resetClock();}
  function pointerLeave(){state.hovered=false;resetClock();}
  function pointerDown(){state.focused=false;resetClock();}
  function keyDown(){state.focused=true;resetClock();}
  function focus(){state.focused=holder.matches(':focus-visible');resetClock();}
  function blur(){state.focused=false;resetClock();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(holder);
  const intersection=new IntersectionObserver(([entry])=>{
    state.visible=entry.isIntersecting;last=performance.now();if(state.visible)schedule();else stopFrame();
  });intersection.observe(holder);
  const listeners=[
    [holder,'click',toggle],[canvas,'webglcontextlost',contextLost],[canvas,'webglcontextrestored',contextRestored],
    [holder,'pointerenter',pointerEnter],[holder,'pointerleave',pointerLeave],[holder,'pointercancel',pointerLeave],
    [holder,'focus',focus],[holder,'blur',blur],[holder,'pointerdown',pointerDown],[holder,'keydown',keyDown],
    [document,'visibilitychange',visibility],[preference,'change',reduced],
  ];
  for(const [target,type,listener] of listeners)target.addEventListener(type,listener);
  resize();
  return {holder,state,model,renderer,pause,resume,seek,dispose(){
    if(state.disposed)return;
    state.disposed=true;stopFrame();resizeObserver.disconnect();intersection.disconnect();
    for(const [target,type,listener] of listeners)target.removeEventListener(type,listener);
    outline?.dispose();model.dispose();environment.dispose();renderer.dispose();renderer.forceContextLoss();
    holder.classList.remove('is-ready');delete holder.dataset.ribbonPhase;
  }};
}
