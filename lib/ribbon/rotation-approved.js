/** Actual mesh deformation and a renderer-independent, repeatable motion score. */
export const CYCLE_SECONDS = 4.8 / 1.24 / 1.10;
export const REST = Object.freeze({twist:0,bend:0,depth:1});
const TAU=2*Math.PI,A=.5,B=.8660254037844386;
const clamp=t=>Math.max(0,Math.min(1,t));

export function sampleRibbonMotion(progress){
  const phase=((progress%1)+1)%1;
  const p=clamp((phase-.115)/.77);
  // Original raised-cosine acceleration and deceleration.
  const envelope=p===0||p===1?0:Math.sin(Math.PI*p)**2;
  const turn=p-Math.sin(TAU*p)/TAU;
  return {phase,spin:TAU*turn,
    twist:envelope===0?0:.64*envelope*Math.sin(TAU*p),
    bend:.14*envelope*Math.sin(Math.PI*p),depth:1+.26*envelope,
    stage:p===0||p===1?'S HOLD':p<.5?'TWIST / TURN':'RETURN / S'};
}

// Coordinates u and v are the short and long axes of the diagonal logo.
// Each operation is invertible: positive depth scale, twist, then a curved Z offset.
// Consequently, a closed input surface stays closed and cannot intersect itself.
export function deformPoint(x,y,z,{twist=0,bend=0,depth=1}=REST){
  const u=B*x-A*y,v=A*x+B*y,scaledZ=z*depth;
  const angle=twist*v,c=Math.cos(angle),s=Math.sin(angle);
  const newU=c*u-s*scaledZ,newZ=s*u+c*scaledZ;
  return [B*newU+A*v,-A*newU+B*v,newZ+bend*v*v];
}

export function createRibbonDeformer(THREE,group){
  const buffers=[];
  group.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const geometry=mesh.geometry,p=geometry.getAttribute('position'),n=geometry.getAttribute('normal');
    p.setUsage(THREE.DynamicDrawUsage);n.setUsage(THREE.DynamicDrawUsage);
    buffers.push({geometry,p,n,baseP:p.array.slice(),baseN:n.array.slice()});
    // Conservative bound for the supported deformation range; no per-frame scan required.
    geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),2.1);
  });
  let last={...REST};
  function update({twist=0,bend=0,depth=1}=REST){
    if(![twist,bend,depth].every(Number.isFinite)||depth<=0)throw new RangeError('Finite deformation values and positive depth are required.');
    if(twist===last.twist&&bend===last.bend&&depth===last.depth)return false;
    for(const {p,n,baseP,baseN} of buffers){
      if(twist===0&&bend===0&&depth===1){p.array.set(baseP);n.array.set(baseN);}
      else for(let i=0;i<baseP.length;i+=3){
        const x=baseP[i],y=baseP[i+1],z=baseP[i+2];
        const u=B*x-A*y,v=A*x+B*y,w=z*depth;
        const angle=twist*v,c=Math.cos(angle),s=Math.sin(angle);
        const nextU=c*u-s*w,nextZ=s*u+c*w;
        p.array[i]=B*nextU+A*v;p.array[i+1]=-A*nextU+B*v;p.array[i+2]=nextZ+bend*v*v;
        // Exact inverse-transpose Jacobian, including the position-dependent twist.
        const nu=B*baseN[i]-A*baseN[i+1],nv=A*baseN[i]+B*baseN[i+1],nz=baseN[i+2]/depth;
        const outU=c*nu-s*nz,outZ=s*nu+c*nz;
        const outV=nv+twist*(nextZ*outU-nextU*outZ)-2*bend*v*outZ;
        const nx=B*outU+A*outV,ny=-A*outU+B*outV,length=Math.hypot(nx,ny,outZ);
        n.array[i]=nx/length;n.array[i+1]=ny/length;n.array[i+2]=outZ/length;
      }
      p.needsUpdate=true;n.needsUpdate=true;
    }
    last={twist,bend,depth};return true;
  }
  return {update,parameters:()=>({...last}),restore:()=>update(REST)};
}
