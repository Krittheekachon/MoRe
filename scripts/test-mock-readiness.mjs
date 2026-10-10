import path from "node:path";
import assert from "node:assert/strict";
import {createJiti} from "jiti";
const jiti=createJiti(import.meta.url);
const {cameraTestCriteria,refreshMockCameraPolicy,cameraCriteriaSignature}=await jiti.import(path.resolve("src/lib/pose/camera-test-adapter.ts"));
const {KneePreparation}=await jiti.import(path.resolve("src/lib/pose/exercises/knee-preparation.ts"));
const {RepetitionCycle}=await jiti.import(path.resolve("src/lib/pose/cycle.ts"));
const {StableWindow}=await jiti.import(path.resolve("src/lib/pose/stable-window.ts"));
const {PoseTrackingQuality,PoseLandmarkSmoother}=await jiti.import(path.resolve("src/lib/pose/tracking-quality.ts"));
let checks=0;const check=(v,e)=>{assert.deepEqual(v,e);checks++;};
const criteria=(side,version=4)=>cameraTestCriteria("demo-knee-extension",side,1,{start:1,peak:2,returned:3},version);
function points(c,angle=95) {
  const p=c.preparation,sign=p.facingSign,hip=sign===1?.3:.7,knee=hip+sign*.25;
  const list=Array.from({length:33},()=>({x:.5,y:.5,z:.15,visibility:1}));
  list[c.landmarks[0]]={x:hip,y:.4,z:-.15,visibility:1};list[p.shoulder]={x:hip,y:.15,z:-.15,visibility:1};
  list[c.landmarks[1]]={x:knee,y:.4,z:-.15,visibility:1};
  const x=knee-sign*.15*Math.cos(angle*Math.PI/180),y=.4+.2*Math.sin(angle*Math.PI/180);
  list[c.landmarks[2]]={x,y,z:-.15,visibility:1};list[p.heel]={x,y,z:-.15,visibility:1};list[p.foot]={x:x+sign*.08,y,z:-.15,visibility:1};
  list[p.oppositeHip]={x:hip+.02,y:.4,z:.15,visibility:1};list[p.oppositeKnee]={x:knee+.02,y:.4,z:.15,visibility:1};return list;
}
for(const side of ["left","right"]) {
  const c=criteria(side);
  const oneSide=new KneePreparation(),occluded=points(c,95);
  for(const i of [c.preparation.oppositeHip,c.preparation.oppositeKnee,c.preparation.heel,c.preparation.foot]) occluded[i].visibility=0;
  let singleReady;
  for(const at of [100,200,300,400,500]) singleReady=oneSide.update(occluded,c,800,600,at,true,{phase:"preparing",completedReps:0});
  check(singleReady.ready,true);check(oneSide.debug.locked,true);
  check(oneSide.debug.depth,"ไม่สามารถยืนยัน");
  const tracked=new RepetitionCycle(c), trackedGate=new KneePreparation(),quality=new PoseTrackingQuality(),smoother=new PoseLandmarkSmoother();let trackedAt=0,lastTracked;
  function trackedStep(angle,hideSelected=false) {
    trackedAt+=100;const raw=points(c,angle);
    raw[c.preparation.oppositeHip].visibility=0;raw[c.preparation.oppositeKnee].visibility=0;
    if(hideSelected) {raw[c.landmarks[2]].visibility=0;raw[c.preparation.oppositeHip].visibility=1;raw[c.preparation.oppositeKnee].visibility=1;}
    const trusted=quality.update(raw,c,trackedAt);if(!trusted)smoother.reset();
    const filtered=trusted?smoother.update(raw,trackedAt,c.minVisibility):[];
    lastTracked=trackedGate.update(filtered,c,800,600,trackedAt,trusted,tracked.movement);
    if(lastTracked.allowed)tracked.sample(lastTracked.knee,trackedAt,1);else if(lastTracked.interrupt)tracked.interrupt();else tracked.suspend(trackedAt);
  }
  for(let i=0;i<15;i++)trackedStep(95);
  check(tracked.movement.phase,"ready");check(tracked.repetitions.length,0);
  for(const a of [130,150,165,165,165,165,140,100,100,100,100])trackedStep(a);
  check(tracked.repetitions.length,1);check(lastTracked.message.includes("สองข้าง"),false);
  trackedStep(95,true);check(lastTracked.allowed,false);check(lastTracked.message,"ให้กล้องเห็นสะโพก เข่า และข้อเท้าข้างที่ฝึก");check(tracked.repetitions.length,1);
  const nearOther=points(c);nearOther[c.preparation.oppositeHip].z=-.4;nearOther[c.preparation.oppositeKnee].z=-.4;
  const nearGate=new KneePreparation();let nearResult;
  for(const at of [100,200,300,400,500])nearResult=nearGate.update(nearOther,c,800,600,at,true,{phase:"preparing",completedReps:0});
  check(nearResult.ready,true);check(nearGate.debug.depth,"ข้อมูลเฟรมนี้ชี้ว่าอีกข้างใกล้กว่า");check(nearGate.debug.locked,true);
  const oldSnapshot=structuredClone(c); delete oldSnapshot.preparation.singleSideOrientation;
  const snapshotGate=new KneePreparation();let resumed;
  for(const at of [100,200,300,400,500]) resumed=snapshotGate.update(occluded,oldSnapshot,800,600,at,true,{phase:"preparing",completedReps:0});
  check(resumed.ready,true);check(oldSnapshot.preparation.singleSideOrientation,undefined);
  check(refreshMockCameraPolicy(oldSnapshot),c);
  check(cameraCriteriaSignature(oldSnapshot),cameraCriteriaSignature(c));
  check(cameraCriteriaSignature({...c,start:{min:70,max:105}})===cameraCriteriaSignature(c),false);
  const photographedAngles=points(c,91);
  photographedAngles[c.preparation.shoulder].x-=c.preparation.facingSign*.25*(600/800)*Math.tan(14*Math.PI/180);
  photographedAngles[c.preparation.oppositeHip].visibility=0;photographedAngles[c.preparation.oppositeKnee].visibility=0;
  const photoGate=new KneePreparation();let photoResult;
  for(const at of [100,200,300,400,500])photoResult=photoGate.update(photographedAngles,oldSnapshot,800,600,at,true,{phase:"preparing",completedReps:0});
  check(Math.abs(photoResult.knee-91)<.001,true);check(Math.abs(photoResult.torso-104)<.001,true);check(photoResult.ready,true);
  const wrongDirection=points(c,95);wrongDirection[c.landmarks[1]].x=wrongDirection[c.landmarks[0]].x;
  check(new KneePreparation().update(wrongDirection,c,800,600,100,true,{phase:"preparing",completedReps:0}).allowed,false);
  for(const angle of [90,95,100]) {
    const gate=new KneePreparation();let result;
    for(const at of [100,200,300,400,500]) result=gate.update(points(c,angle),c,800,600,at,true,{phase:"preparing",completedReps:0});
    check(result.ready,true);check(gate.debug.stableMs,400);check(gate.debug.locked,true);
  }
  const old=criteria(side,3),oldGate=new KneePreparation();let rejected;
  for(const at of [100,300,500,700])rejected=oldGate.update(points(old,95),old,800,600,at,true,{phase:"preparing",completedReps:0});
  check(rejected.allowed,false); // Reproduced narrow-range cause, not inferred from iPad.
  const gate=new KneePreparation();
  for(const at of [100,200,300])gate.update(points(c),c,800,600,at,true,{phase:"preparing",completedReps:0});
  check(gate.update(points(c,106),c,800,600,400,true,{phase:"preparing",completedReps:0}).allowed,false);
  check(gate.debug.stableMs,200);
  check(gate.update(points(c),c,800,600,500,true,{phase:"preparing",completedReps:0}).ready,false);
  gate.update(points(c),c,800,600,600,true,{phase:"preparing",completedReps:0});
  check(gate.update(points(c),c,800,600,700,true,{phase:"preparing",completedReps:0}).ready,true);
  const blocked=points(c,165);blocked[c.preparation.oppositeHip].visibility=.1;blocked[c.preparation.foot].visibility=.1;
  check(gate.update(blocked,c,800,600,800,true,{phase:"moving",completedReps:0}).allowed,true);
  const fresh=new KneePreparation();check(fresh.update(blocked,c,800,600,800,true,{phase:"preparing",completedReps:0}).allowed,false);
  blocked[c.landmarks[2]].visibility=.1;
  check(gate.update(blocked,c,800,600,900,true,{phase:"moving",completedReps:0}).allowed,false);
  check(gate.update(blocked,c,800,600,1900,true,{phase:"moving",completedReps:0}).interrupt,true);
  check(gate.debug.locked,false);
  const counter=new RepetitionCycle(c);let at=0;
  const step=angle=>counter.sample(angle,at+=100,1);
  for(let i=0;i<5;i++)step(95);check(counter.movement.phase,"ready");
  for(const a of [104,106,109,110,105,100,100])step(a);check(counter.repetitions.length,0);
  for(const a of [130,165,165,165,165,165])step(a);check(counter.repetitions.length,0);
  step(100);step(100);step(109);step(100);check(counter.repetitions.length,0);
  step(100);check(counter.repetitions.length,1);check(counter.repetitions[0].peakAngle,165);
  for(let i=0;i<5;i++)step(100);check(counter.repetitions.length,1);
  for(const a of [130,140,140,100,100,100])step(a);
  check(counter.repetitions.length,2);check(counter.repetitions[1].peakAngle,140);
  step(130);step(165);counter.interrupt();for(let i=0;i<8;i++)step(100);check(counter.repetitions.length,2);
  step(130);step(165);step(165);counter.sample(null,at+=1100,0);for(let i=0;i<8;i++)step(100);check(counter.repetitions.length,2);
  for(const a of [130,165,165,100,100,100])step(a);check(counter.repetitions.length,3);
}
const clock=new StableWindow();clock.pass(0,250);clock.pass(100,250);clock.fail(200,250);check(clock.pass(300,250),100);check(clock.pass(400,250),200);
clock.fail(500,250);check(clock.pass(900,250),0);
const {AngleReturnFeedback}=await jiti.import(path.resolve("src/lib/pose/engines/angle-return-feedback.ts"));
for(const side of ["left","right"]) {
  const c=criteria(side,5);check(c.start,{min:60,max:115});check(c.correctPeak,{min:160,max:170});
  const bentStanding=points(c,95),hip=bentStanding[c.landmarks[0]],sign=c.preparation.facingSign;
  const theta=40*Math.PI/180;
  for(const index of [c.landmarks[1],c.landmarks[2],c.preparation.heel,c.preparation.foot]) {
    const p=bentStanding[index],x=(p.x-hip.x)*800*sign,y=(p.y-hip.y)*600;
    p.x=hip.x+sign*(x*Math.cos(theta)-y*Math.sin(theta))/800;p.y=hip.y+(x*Math.sin(theta)+y*Math.cos(theta))/600;
  }
  bentStanding[c.preparation.oppositeHip].visibility=0;bentStanding[c.preparation.oppositeKnee].visibility=0;
  const permissive={...c,preparation:{...c.preparation,torsoThigh:{min:50,max:131},seatedMaxThighTilt:90}};
  const oldGate=new KneePreparation(),seatedGate=new KneePreparation();let oldResult,rejected;
  for(const at of [100,200,300,400,500]){oldResult=oldGate.update(bentStanding,permissive,800,600,at,true,{phase:"preparing",completedReps:0});rejected=seatedGate.update(bentStanding,c,800,600,at,true,{phase:"preparing",completedReps:0});}
  check(oldResult.ready,false);check(rejected.ready,false);
  const lockedGate=new KneePreparation();for(const at of [100,200,300,400,500])lockedGate.update(points(c,95),c,800,600,at,true,{phase:"preparing",completedReps:0});
  check(lockedGate.update(bentStanding,c,800,600,600,true,{phase:"moving",completedReps:1}).allowed,false);
  const snapshot=structuredClone(c);delete snapshot.preparation.seatedMaxThighTilt;check(refreshMockCameraPolicy(snapshot).preparation.seatedMaxThighTilt,35);
  for(const initial of [65,110]) {
    const gate=new KneePreparation(),counter=new RepetitionCycle(c),feedback=new AngleReturnFeedback(c);let at=0,color;
    function step(a){at+=100;const view=gate.update(points(c,a),c,800,600,at,true,counter.movement);if(view.allowed)counter.sample(view.knee,at,1);else if(view.interrupt)counter.interrupt();else counter.suspend(at);color=feedback.update(view.allowed?view.knee:null,at,1,counter.movement);}
    for(let i=0;i<12;i++)step(initial);check(counter.movement.phase,"ready");check(counter.repetitions.length,0);
    for(let i=0;i<5;i++)step(165);check(color,"target-reached");check(counter.repetitions.length,0);
    step(140);check(color,"target-reached");for(let i=0;i<4;i++)step(initial);check(counter.repetitions.length,1);check(color,"ready");
  }
}
for(const side of ["left","right"]) for(const version of [4,5]) {
  const c=criteria(side,version);
  function pose(knee,torso) {
    const p=points(c,knee);p[c.preparation.shoulder].x-=c.preparation.facingSign*.25*(600/800)*Math.tan((torso-90)*Math.PI/180);
    p[c.preparation.oppositeHip].visibility=0;p[c.preparation.oppositeKnee].visibility=0;
    return p;
  }
  function ready(p){const gate=new KneePreparation();let result;for(const at of [100,200,300,400,500])result=gate.update(p,c,800,600,at,true,{phase:"preparing",completedReps:0});return {gate,result};}
  const valid=ready(pose(90,105));check(valid.result.ready,true);check(Math.abs(valid.result.knee-90)<1e-8,true);check(Math.abs(valid.result.torso-105)<1e-8,true);check(valid.gate.debug.blockers,[]);
  for(const exact of [
    {...c,start:{min:valid.result.knee,max:valid.result.knee}},
    {...c,preparation:{...c.preparation,torsoThigh:{min:valid.result.torso,max:valid.result.torso}}},
  ]){const gate=new KneePreparation();let result;for(const at of [100,200,300,400,500])result=gate.update(pose(90,105),exact,800,600,at,true,{phase:"preparing",completedReps:0});check(result.ready,true);}
  const tilted=pose(90,105),hip=tilted[c.landmarks[0]],sign=c.preparation.facingSign,theta=40*Math.PI/180;
  for(const index of [c.preparation.shoulder,c.landmarks[1],c.landmarks[2],c.preparation.heel,c.preparation.foot]) {
    const p=tilted[index],x=(p.x-hip.x)*800*sign,y=(p.y-hip.y)*600;
    p.x=hip.x+sign*(x*Math.cos(theta)-y*Math.sin(theta))/800;p.y=hip.y+(x*Math.sin(theta)+y*Math.cos(theta))/600;
  }
  const tiltedResult=ready(tilted);check(tiltedResult.result.ready,true);check(Math.abs(tiltedResult.result.torso-105)<1e-8,true);check(tiltedResult.gate.debug.postureAdvice,true);
  for(const k of [c.start.min+1e-6,c.start.max-1e-6])check(ready(pose(k,90)).result.ready,true);
  for(const k of [c.start.min-1,c.start.max+1])check(ready(pose(k,90)).result.ready,false);
  for(const t of [c.preparation.torsoThigh.min+1e-6,c.preparation.torsoThigh.max-1e-6])check(ready(pose(90,t)).result.ready,true);
  for(const t of [c.preparation.torsoThigh.min-1,c.preparation.torsoThigh.max+1])check(ready(pose(90,t)).result.ready,false);
  const missing=pose(90,105);missing[c.landmarks[2]].visibility=0;check(ready(missing).result.ready,false);
  // Reflect the source image, preserving anatomical landmark indices.
  const reflected=pose(90,105).map(p=>({...p,x:1-p.x}));check(ready(reflected).result.ready,true);
  const footWrong=pose(90,105);footWrong[c.preparation.foot].x=footWrong[c.preparation.heel].x-c.preparation.facingSign*.1;check(ready(footWrong).result.ready,true);
}
for(const side of ["left","right"]) {
  const c=criteria(side,5),gate=new KneePreparation(),counter=new RepetitionCycle(c);let at=0,last;
  function step(knee,torso=95,hideShoulder=false){const p=points(c,knee);p[c.preparation.shoulder].x-=c.preparation.facingSign*.25*(600/800)*Math.tan((torso-90)*Math.PI/180);if(hideShoulder)p[c.preparation.shoulder].visibility=0;
    at+=100;last=gate.update(p,c,800,600,at,true,counter.movement);if(last.allowed)counter.sample(last.knee,at,1);else if(last.interrupt)counter.interrupt();else counter.suspend(at);return last;}
  function hold(k,t=95,n=10){for(let i=0;i<n;i++)step(k,t);}
  hold(90);check(counter.repetitions.length,0);hold(165);hold(90);check(counter.repetitions.length,1);
  hold(165);check(step(165,110).allowed,true);check(counter.movement.phase,"moving");const invalid=step(165,111);check(invalid.interrupt,true);check(invalid.message,"ปรับท่านั่งให้มุมลำตัว–ต้นขาอยู่ที่ 90–110°");check(counter.movement.phase,"preparing");check(counter.repetitions.length,1);
  hold(165);hold(90);check(counter.repetitions.length,1); // Cannot finish cancelled round.
  hold(165);hold(90);check(counter.repetitions.length,2);
  hold(165);step(165,95,true);check(last.torso,null);check(last.interrupt,true);hold(90);check(counter.repetitions.length,2);
  // A stand/sit-like sequence with torso outside range never starts a rep.
  for(const k of [90,130,165,130,90])hold(k,150);check(counter.repetitions.length,2);
  hold(90);hold(165);step(165,89);hold(90);check(counter.repetitions.length,2);
}
console.log(JSON.stringify({readinessChecks:checks,physicalCameraTested:false}));
