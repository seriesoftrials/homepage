import * as THREE from 'three';
import {createFormation,sampleFormation} from './formation.js';
import {sampleRibbonMotion} from './rotation-approved.js';

export const FORMATION_START=.1;
export const FORMATION_END=.8;
export const LOOSE_HOLD_DURATION=.5;
export const FORMATION_TRANSITION_DURATION=1.4;
export const ROTATION_SOURCE_START=.115;
export const ROTATION_SOURCE_END=.885;
export const FORMATION_COMPLETE=LOOSE_HOLD_DURATION+FORMATION_TRANSITION_DURATION;
export const SETTLE_DURATION=1.5;
export const ROTATION_START=FORMATION_COMPLETE+SETTLE_DURATION;
export const ROTATION_DURATION=3;
export const FIRST_ROTATION_DURATION=ROTATION_DURATION;
export const REPEAT_HOLD_DURATION=3;
export const ROTATION_CYCLE_DURATION=REPEAT_HOLD_DURATION+ROTATION_DURATION;
export const ROTATION_END=ROTATION_START+FIRST_ROTATION_DURATION;
export const SEQUENCE_DURATION=ROTATION_END;
export const KEYFRAMES=Object.freeze({loose:0,twist:(LOOSE_HOLD_DURATION+FORMATION_TRANSITION_DURATION*(.54-FORMATION_START)/(FORMATION_END-FORMATION_START))/SEQUENCE_DURATION,s:FORMATION_COMPLETE/SEQUENCE_DURATION,rotate:(ROTATION_START+FIRST_ROTATION_DURATION*.41)/SEQUENCE_DURATION,rest:1});

// Give the loose oval time to register, then compress only its deformation.
// The geometry's quintic acceleration and deceleration stay continuous.
function formationAt(elapsed){
  if(elapsed>=FORMATION_COMPLETE)return 1;
  if(elapsed<LOOSE_HOLD_DURATION)return elapsed/LOOSE_HOLD_DURATION*FORMATION_START;
  return FORMATION_START+(elapsed-LOOSE_HOLD_DURATION)/FORMATION_TRANSITION_DURATION*(FORMATION_END-FORMATION_START);
}

export function nextRotationStop(progress){
  const elapsed=Math.max(0,progress)*SEQUENCE_DURATION;
  if(elapsed<ROTATION_END)return 1;
  const cycle=Math.floor((elapsed-ROTATION_END)/ROTATION_CYCLE_DURATION+1e-9)+1;
  return (ROTATION_END+cycle*ROTATION_CYCLE_DURATION)/SEQUENCE_DURATION;
}

export function sampleSequence(progress){
  const p=Math.max(0,progress),elapsed=p*SEQUENCE_DURATION;
  if(elapsed<ROTATION_START){
    const formationProgress=formationAt(elapsed),formation=sampleFormation(formationProgress);
    const settled=elapsed>=FORMATION_COMPLETE;
    return {progress:p,timelineProgress:p,elapsed,phase:settled?'SETTLED':'FORMING',formationProgress,stage:settled?'S / SETTLE':formation.stage,heading:Math.PI/6*(1-formation.amount),rotation:null};
  }
  let loop,turn=0;
  if(elapsed<ROTATION_END)loop=(elapsed-ROTATION_START)/FIRST_ROTATION_DURATION;
  else{
    const repeated=(elapsed-ROTATION_END)/ROTATION_CYCLE_DURATION;
    const cycle=Math.floor(repeated),time=(repeated-cycle)*ROTATION_CYCLE_DURATION;
    turn=cycle+1;
    if(time<REPEAT_HOLD_DURATION)return {progress:p,timelineProgress:1,elapsed,phase:'WAITING',formationProgress:1,stage:'S / HOLD',heading:0,rotation:null,turn};
    loop=(time-REPEAT_HOLD_DURATION)/ROTATION_DURATION;
  }
  const rotation=sampleRibbonMotion(ROTATION_SOURCE_START+loop*(ROTATION_SOURCE_END-ROTATION_SOURCE_START));
  const timelineProgress=p<=1?p:(ROTATION_START+loop*FIRST_ROTATION_DURATION)/SEQUENCE_DURATION;
  return {progress:p,timelineProgress,elapsed,phase:'ROTATING',formationProgress:1,stage:rotation.stage,heading:0,rotation,turn};
}

export function createSequence({material}={}){
  const model=createFormation({material});
  const position=model.geometry.attributes.position,normal=model.geometry.attributes.normal;
  const p=position.array,n=normal.array,formationP=p.slice(),formationN=n.slice();
  const axis=new THREE.Vector3(.5,.8660254037844386,0).normalize();
  const zAxis=new THREE.Vector3(0,0,1),spin=new THREE.Quaternion();
  // Apply the approved invertible deformation to the current forming mesh.
  // Its unmodified buffers are retained, so scrubbing never compounds the twist.
  function deform({twist,bend,depth}){
    if(twist===0&&bend===0&&depth===1)return;
    const A=.5,B=.8660254037844386;
    for(let i=0;i<p.length;i+=3){
      const x=p[i],y=p[i+1],z=p[i+2],u=B*x-A*y,v=A*x+B*y,w=z*depth;
      const angle=twist*v,c=Math.cos(angle),s=Math.sin(angle),nextU=c*u-s*w,nextZ=s*u+c*w;
      p[i]=B*nextU+A*v;p[i+1]=-A*nextU+B*v;p[i+2]=nextZ+bend*v*v;
      const nu=B*n[i]-A*n[i+1],nv=A*n[i]+B*n[i+1],nz=n[i+2]/depth;
      const outU=c*nu-s*nz,outZ=s*nu+c*nz,outV=nv+twist*(nextZ*outU-nextU*outZ)-2*bend*v*outZ;
      const nx=B*outU+A*outV,ny=-A*outU+B*outV,length=Math.hypot(nx,ny,outZ);
      n[i]=nx/length;n[i+1]=ny/length;n[i+2]=outZ/length;
    }
  }
  function update(progress){
    const sample=sampleSequence(progress);
    p.set(formationP);n.set(formationN);model.update(sample.formationProgress);
    formationP.set(p);formationN.set(n);
    if(sample.rotation)deform(sample.rotation);
    model.group.quaternion.setFromAxisAngle(zAxis,sample.heading);
    if(sample.rotation)model.group.quaternion.multiply(spin.setFromAxisAngle(axis,sample.rotation.spin));
    position.needsUpdate=true;normal.needsUpdate=true;
    return sample;
  }
  update(0);
  return {...model,update,formationPositions:formationP,formationNormals:formationN};
}
