import * as THREE from 'three';
import {createSerialLogo} from './geometry-approved.js';

export const DURATION = 3.2;
export const RETURN_DURATION = 1.7;
export const RINGS = 448;
export const RADIAL = 32;
const TAU = Math.PI * 2, U = [.8660254037844386, -.5], V = [.5, .8660254037844386];
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => {const t = clamp(x); return t * t * t * (t * (t * 6 - 15) + 10);};
const distance = (a, b) => Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);

export function sampleFormation(progress) {
  const p = clamp(progress), amount = ease((p - .10) / .70);
  return {progress:p, amount, stage:p<.10?'LOOSE LOOP':p<.58?'CROSS / TWIST':p<.80?'GATHER / S':'S / HOLD'};
}

// Keep the selected original immutable. This new mesh samples its exact vertices:
// half the longitudinal rings, one third the cross-section samples.
export function createFormation({material: suppliedMaterial} = {}) {
  const approved = createSerialLogo(THREE);
  const source = approved.group.children[0].geometry;
  const baseP = new Float32Array(RINGS * RADIAL * 3), baseN = new Float32Array(baseP.length);
  for (let i=0;i<RINGS;i++) for(let j=0;j<RADIAL;j++) for(let k=0;k<3;k++) {
    const at=(i*RADIAL+j)*3+k, from=(i*2*96+j*3)*3+k;
    baseP[at]=source.attributes.position.array[from]; baseN[at]=source.attributes.normal.array[from];
  }
  const centers=[], arc=[0];
  for(let i=0;i<RINGS;i++) {
    const c=[0,0,0];
    for(let j=0;j<RADIAL;j++) for(let k=0;k<3;k++) c[k]+=baseP[(i*RADIAL+j)*3+k]/RADIAL;
    centers.push(c);
    if(i)arc.push(arc[i-1]+distance(centers[i-1],c));
  }
  const length=arc[RINGS-1]+distance(centers[RINGS-1],centers[0]);
  const fractions=arc.map(value=>value/length);
  const indices=[];
  for(let i=0;i<RINGS;i++) for(let j=0;j<RADIAL;j++) {
    const next=(j+1)%RADIAL,a=i*RADIAL+j,b=i*RADIAL+next;
    const c=i===RINGS-1?(j+RADIAL/2)%RADIAL:(i+1)*RADIAL+j;
    const d=i===RINGS-1?(next+RADIAL/2)%RADIAL:(i+1)*RADIAL+next;
    indices.push(a,b,c,b,d,c);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(baseP.slice(),3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('normal',new THREE.BufferAttribute(baseN.slice(),3).setUsage(THREE.DynamicDrawUsage));
  geometry.setIndex(indices);
  geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),2.5);
  const material=suppliedMaterial??approved.group.children[0].material.clone();
  approved.dispose();
  const mesh=new THREE.Mesh(geometry,material),group=new THREE.Group();group.add(mesh);
  mesh.name='SERIAL loose closed ribbon → approved S';
  const positions=geometry.attributes.position.array,normals=geometry.attributes.normal.array;
  const crossSection=[];
  // Copy the stadium coordinates directly from the approved top section.
  const top=centers[0];
  const wide=new THREE.Vector3(baseP[0]-top[0],baseP[1]-top[1],baseP[2]-top[2]).normalize();
  const thin=new THREE.Vector3(baseP[24]-top[0],baseP[25]-top[1],baseP[26]-top[2]).normalize();
  for(let j=0;j<RADIAL;j++){
    const d=new THREE.Vector3(baseP[j*3]-top[0],baseP[j*3+1]-top[1],baseP[j*3+2]-top[2]);
    crossSection.push([d.dot(wide),d.dot(thin)]);
  }
  const denseCount=RINGS*4;
  const dense=new Float64Array((denseCount+1)*3),denseArc=new Float64Array(denseCount+1);
  const control=Array.from({length:RINGS},()=>[0,0,0]);
  const path=Array.from({length:RINGS},()=>[0,0,0]);
  const tangents=Array.from({length:RINGS},()=>new THREE.Vector3());
  const frameN=Array.from({length:RINGS},()=>new THREE.Vector3());
  const frameB=Array.from({length:RINGS},()=>new THREE.Vector3());
  const q=new THREE.Quaternion(),closure=new THREE.Vector3(),temp=new THREE.Vector3();
  const outW=new THREE.Vector3(),outH=new THREE.Vector3(),normalW=new THREE.Vector3(),normalB=new THREE.Vector3();
  // Parallel transport follows the actual 3D path, including the moment the
  // lower lobe points directly at the camera. A 2D normal would flip there.
  function buildFrames(points,reference=0){
    for(let i=0;i<RINGS;i++){
      const prev=points[(i+RINGS-1)%RINGS],next=points[(i+1)%RINGS];
      tangents[i].set(next[0]-prev[0],next[1]-prev[1],next[2]-prev[2]).normalize();
    }
    frameN[0].set(0,0,1).addScaledVector(tangents[0],-tangents[0].z).normalize();
    for(let i=1;i<RINGS;i++){
      q.setFromUnitVectors(tangents[i-1],tangents[i]);
      frameN[i].copy(frameN[i-1]).applyQuaternion(q);
    }
    q.setFromUnitVectors(tangents[RINGS-1],tangents[0]);
    closure.copy(frameN[RINGS-1]).applyQuaternion(q);
    const wrapped=Math.atan2(temp.crossVectors(closure,frameN[0]).dot(tangents[0]),closure.dot(frameN[0]));
    const correction=wrapped+TAU*Math.round((reference-wrapped)/TAU);
    for(let i=0;i<RINGS;i++){
      frameN[i].applyAxisAngle(tangents[i],correction*fractions[i]);
      frameB[i].crossVectors(tangents[i],frameN[i]).normalize();
    }
    return correction;
  }
  // Lift the frame angle continuously over the entire deformation. atan2 alone
  // jumps from -pi to +pi near progress .586, abruptly rotating the sections.
  // This deterministic lift also makes backward playback and direct seeks agree.
  const CORRECTION_SAMPLES=128,corrections=new Float64Array(CORRECTION_SAMPLES+1);
  for(let i=0;i<=CORRECTION_SAMPLES;i++){
    buildPath(i/CORRECTION_SAMPLES);
    corrections[i]=buildFrames(path,i?corrections[i-1]:0);
  }
  buildFrames(centers,corrections[CORRECTION_SAMPLES]);
  const finalAngles=[],sectionTilt=[];
  for(let i=0;i<RINGS;i++){
    const at=i*RADIAL*3,c=centers[i],t=tangents[i];
    outW.set(baseP[at]-c[0],baseP[at+1]-c[1],baseP[at+2]-c[2]).normalize();
    outH.set(baseP[at+24]-c[0],baseP[at+25]-c[1],baseP[at+26]-c[2]).normalize();
    const along=outW.dot(t);normalW.copy(outW).addScaledVector(t,-along).normalize();
    normalB.crossVectors(t,normalW).normalize();
    let angle=Math.atan2(normalW.dot(frameB[i]),normalW.dot(frameN[i]));
    if(i){while(angle-finalAngles[i-1]>Math.PI)angle-=TAU;while(angle-finalAngles[i-1]<-Math.PI)angle+=TAU;}
    finalAngles.push(angle);
    sectionTilt.push([along,Math.sqrt(1-along*along),outH.dot(normalW),outH.dot(normalB),outH.dot(t)]);
  }
  const winding=Math.round((finalAngles[RINGS-1]-finalAngles[0])/Math.PI)*Math.PI;
  let lastAmount=-1,lastStats;

  function update(progress) {
    const sample=sampleFormation(progress),a=sample.amount;
    if(a===lastAmount)return {...sample,...lastStats};
    lastAmount=a;
    if(a===1){positions.set(baseP);normals.set(baseN);lastStats={length,scale:1};}
    else {
      const rollMix=ease((a-.10)/.82),scale=buildPath(a);
      const at=a*CORRECTION_SAMPLES,lo=Math.min(CORRECTION_SAMPLES-1,Math.floor(at)),t=at-lo;
      buildFrames(path,corrections[lo]*(1-t)+corrections[lo+1]*t);
      for(let i=0;i<RINGS;i++){
        const looseRoll=finalAngles[0]+winding*fractions[i];
        const roll=looseRoll*(1-rollMix)+finalAngles[i]*rollMix,c=Math.cos(roll),s=Math.sin(roll);
        normalW.copy(frameN[i]).multiplyScalar(c).addScaledVector(frameB[i],s);
        normalB.crossVectors(tangents[i],normalW).normalize();
        const [along,normal,hw,hb,ht]=sectionTilt[i];
        outW.copy(normalW).multiplyScalar(1-a+a*normal).addScaledVector(tangents[i],a*along).normalize();
        outH.copy(normalW).multiplyScalar(a*hw).addScaledVector(normalB,1-a+a*hb).addScaledVector(tangents[i],a*ht);
        outH.addScaledVector(outW,-outH.dot(outW)).normalize();
        for(let j=0;j<RADIAL;j++){
          const [w,h]=crossSection[j],at=(i*RADIAL+j)*3;
          positions[at]=path[i][0]+outW.x*w+outH.x*h;positions[at+1]=path[i][1]+outW.y*w+outH.y*h;positions[at+2]=path[i][2]+outW.z*w+outH.z*h;
        }
      }
      updateNormals();
      let sampledLength=0;for(let i=0;i<RINGS;i++)sampledLength+=distance(path[i],path[(i+1)%RINGS]);
      lastStats={length:sampledLength,scale};
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;
    return {...sample,...lastStats};
  }
  function buildPath(a){
    const clearance=.36*Math.sin(Math.PI*a);
    for(let i=0;i<RINGS;i++) {
      const theta=TAU*fractions[i],u=-.78*Math.sin(theta),v=1.14*Math.cos(theta);
      const loose=[U[0]*u+V[0]*v,U[1]*u+V[1]*v,.08*Math.sin(theta)];
      for(let k=0;k<3;k++)control[i][k]=loose[k]*(1-a)+centers[i][k]*a;
      control[i][2]+=clearance*Math.sin(theta);
    }
    // Dense periodic Catmull-Rom followed by material-arclength sampling.
    denseArc[0]=0;
    for(let n=0;n<=denseCount;n++){
      const fi=n/4,i=Math.floor(fi)%RINGS,t=fi-Math.floor(fi),t2=t*t,t3=t2*t;
      const c0=control[(i+RINGS-1)%RINGS],c1=control[i],c2=control[(i+1)%RINGS],c3=control[(i+2)%RINGS];
      for(let k=0;k<3;k++)dense[n*3+k]=.5*((2*c1[k])+(-c0[k]+c2[k])*t+(2*c0[k]-5*c1[k]+4*c2[k]-c3[k])*t2+(-c0[k]+3*c1[k]-3*c2[k]+c3[k])*t3);
      if(n)denseArc[n]=denseArc[n-1]+Math.hypot(dense[n*3]-dense[(n-1)*3],dense[n*3+1]-dense[(n-1)*3+1],dense[n*3+2]-dense[(n-1)*3+2]);
    }
    const rawLength=denseArc[denseCount],scale=length/rawLength;
    let cursor=0;
    for(let i=0;i<RINGS;i++){
      const at=fractions[i]*rawLength;
      while(cursor<denseCount-1&&denseArc[cursor+1]<at)cursor++;
      const t=(at-denseArc[cursor])/(denseArc[cursor+1]-denseArc[cursor]);
      for(let k=0;k<3;k++)path[i][k]=(dense[cursor*3+k]*(1-t)+dense[(cursor+1)*3+k]*t)*scale;
    }
    return scale;
  }
  function updateNormals(){
    for(let i=0;i<RINGS;i++)for(let j=0;j<RADIAL;j++){
      const prev=i===0?(RINGS-1)*RADIAL+(j+RADIAL/2)%RADIAL:(i-1)*RADIAL+j;
      const next=i===RINGS-1?(j+RADIAL/2)%RADIAL:(i+1)*RADIAL+j;
      const jp=(i*RADIAL+(j+RADIAL-1)%RADIAL)*3,jn=(i*RADIAL+(j+1)%RADIAL)*3;
      const ax=positions[next*3]-positions[prev*3],ay=positions[next*3+1]-positions[prev*3+1],az=positions[next*3+2]-positions[prev*3+2];
      const rx=positions[jn]-positions[jp],ry=positions[jn+1]-positions[jp+1],rz=positions[jn+2]-positions[jp+2];
      const nx=ry*az-rz*ay,ny=rz*ax-rx*az,nz=rx*ay-ry*ax,inv=1/Math.hypot(nx,ny,nz),at=(i*RADIAL+j)*3;
      normals[at]=nx*inv;normals[at+1]=ny*inv;normals[at+2]=nz*inv;
    }
  }
  update(0);
  return {group,geometry,material,update,approvedPositions:baseP,approvedNormals:baseN,length,
    dispose(){geometry.dispose();material.dispose();}};
}
