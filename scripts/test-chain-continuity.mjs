import assert from "node:assert/strict";
import {createJiti} from "jiti";
const j=createJiti(import.meta.url);
const {PoseChainContinuity}=await j.import("../src/lib/pose/chain-continuity.ts");
const {cameraKneeExtension}=await j.import("../src/lib/pose/exercises/camera-knee-extension.ts");
const {bindExerciseCriteria}=await j.import("../src/lib/pose/exercise-definition.ts");
const {RepetitionCycle,jointAngle}=await j.import("../src/lib/pose/cycle.ts");
let checks=0;const check=(v,l)=>{assert.ok(v,l);checks++};
for(const side of ['left','right'])for(const mirror of [false,true]){
const c=bindExerciseCriteria(cameraKneeExtension,side,{metricId:1,checkpointIds:{start:1,peak:2,returned:3}});
const points=(angle=90)=>{const p=Array.from({length:33},()=>({x:.5,y:.5,z:0,visibility:0}));const [h,k,a]=c.landmarks;const t=(180-angle)*Math.PI/180;p[h]={x:.35,y:.5,z:0,visibility:1};p[k]={x:.55,y:.5,z:0,visibility:1};p[a]={x:.55+.2*Math.cos(t),y:.5+.2*Math.sin(t),z:0,visibility:1};p[c.preparation.shoulder]={x:.35,y:.3,z:0,visibility:1};for(const i of [h,k,a])p[i%2?i+1:i-1]={...p[i],x:p[i].x-.1,y:p[i].y+.03};if(mirror)for(const v of p)v.x=1-v.x;return p};
const g=new PoseChainContinuity();let at=0;
const sample=(p)=>{at+=100;return g.update(p,c,640,640,at)};
for(let i=0;i<6;i++)sample(points());check(g.canConfirm,'stable preview');check(g.confirm(at),'user confirmed');check(!g.confirm(at+1000),'cannot confirm stale');
const cycle=new RepetitionCycle(c);
for(const angle of [90,90,90,125,145,165,165,145,110,90,90,90]){const p=points(angle);check(sample(p),'real planar movement accepted');cycle.sample(jointAngle(p,c,640,640),at,1)}
check(cycle.repetitions.length===1,'one extension/return');
for(const angle of [90,125,165]){const p=points(angle);sample(p);cycle.sample(jointAngle(p,c,640,640),at,1)}
const bad=points(165);bad[c.landmarks[0]].y-=.22;check(!sample(bad),'hip jump rejected');cycle.interrupt();
for(let i=0;i<6;i++){const p=points();if(sample(p))cycle.sample(jointAngle(p,c,640,640),at,1)}check(cycle.repetitions.length===1,'cancel draft preserve previous count');
const swap=points();for(const id of c.landmarks)swap[id]={...swap[id%2?id+1:id-1]};check(!sample(swap),'possible leg substitution rejected');
const lost=points();lost[c.landmarks[2]].visibility=.1;check(!sample(lost),'occlusion');check(!sample(points()),'wait after loss');for(let i=0;i<6;i++)sample(points());check(g.reason==='accepted','reacquired');
const length=points();length[c.landmarks[2]].y+=.3;check(!sample(length),'segment length rejects wrong ankle');for(let i=0;i<6;i++)sample(points());check(g.reason==='accepted','bad position not learned');
check(!g.update(points(),c,640,640,at-1),'stale result rejected');g.reset();check(!g.confirm(at),'reset requires confirmation');
const hidden=points();for(const id of c.landmarks)hidden[id%2?id+1:id-1].visibility=0;for(let i=0;i<6;i++)sample(hidden);check(g.confirm(at),'opposite leg not required');
}

// Different proportions and camera scale, with optional same-side foot evidence.
// These fixtures test invariance, not a population study or angle accuracy.
for(const side of ['left','right'])for(const mirror of [false,true])
for(const [thigh,shin] of [[.12,.22],[.22,.12],[.20,.20]])for(const scale of [.6,1,1.2]){
 const c=bindExerciseCriteria(cameraKneeExtension,side,{metricId:1,checkpointIds:{start:1,peak:2,returned:3}});
 const make=(angle=90)=>{const p=Array.from({length:33},()=>({x:.5,y:.5,z:0,visibility:0}));const [h,k,a]=c.landmarks;const t=(180-angle)*Math.PI/180;
 p[h]={x:.25,y:.4,z:0,visibility:1};p[k]={x:.25+thigh*scale,y:.4,z:0,visibility:1};p[a]={x:p[k].x+shin*scale*Math.cos(t),y:.4+shin*scale*Math.sin(t),z:0,visibility:1};p[c.preparation.shoulder]={x:.25,y:.2,z:0,visibility:1};
 p[c.preparation.heel]={...p[a],x:p[a].x-.15*shin*scale,y:p[a].y+.1*shin*scale};p[c.preparation.foot]={...p[a],x:p[a].x+.3*shin*scale,y:p[a].y+.1*shin*scale};
 if(mirror)for(const v of p)v.x=1-v.x;return p;};
 const g=new PoseChainContinuity();const cycle=new RepetitionCycle(c);let at=0;
 const take=p=>{at+=100;const accepted=g.update(p,c,640,640,at);if(accepted)cycle.sample(jointAngle(p,c,640,640),at,1);else cycle.interrupt();return accepted};
 for(let i=0;i<6;i++){at+=100;g.update(make(),c,640,640,at)}check(g.confirm(at),'individual proportions confirmed');
 for(const angle of [...Array(5).fill(90),110,130,150,...Array(5).fill(165),150,130,110,...Array(5).fill(90)])check(take(make(angle)),'motion accepted across size/ratio/scale');
 check(cycle.repetitions.length===1,'size/ratio/scale counts one round');
 const cuff=make();cuff[c.landmarks[2]].y-=shin*scale*.4;
 check(!take(cuff)&&g.reason==='ankle-geometry','ankle contradicts reliable foot baseline');
 for(let i=0;i<8;i++)check(!take(cuff),'repeated moving cuff cannot count or become baseline');
 for(let i=0;i<8;i++)take(make());check(g.reason==='accepted'&&cycle.repetitions.length===1,'return to start preserves completed round');
 const auxiliaryMissing=make();auxiliaryMissing[c.preparation.heel].visibility=0;auxiliaryMissing[c.preparation.foot].visibility=0;
 check(take(auxiliaryMissing),'unclear heel/toe are optional missing evidence');
 g.reset();for(let i=0;i<5;i++){at+=100;g.update(make(),c,640,640,at)}at+=100;g.update(cuff,c,640,640,at);check(!g.canConfirm,'suspect auxiliary geometry cannot confirm baseline');

 // No late learning of auxiliary baseline after manual confirmation without it.
 g.reset();for(let i=0;i<6;i++){at+=100;g.update(auxiliaryMissing,c,640,640,at)}check(g.confirm(at),'confirm without auxiliary points');
 const later=make();later[c.preparation.foot].x+=.1;check(take(later),'no fabricated or newly learned foot baseline');
}
console.log(JSON.stringify({checks,physicalCameraTested:false}));
