import assert from "node:assert/strict";
import path from "node:path";
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url);
const { PoseLandmarkSmoother, PoseTrackingQuality } = await jiti.import(path.resolve("src/lib/pose/tracking-quality.ts"));
const { cameraTestCriteria } = await jiti.import(path.resolve("src/lib/pose/camera-test-adapter.ts"));
const { RepetitionCycle, jointAngle } = await jiti.import(path.resolve("src/lib/pose/cycle.ts"));
let checks=0; function check(v,e) { assert.deepEqual(v,e); checks++; }
const point=(x,y,z=0)=>({x,y,z,visibility:1,presence:1});
const ema=new PoseLandmarkSmoother();
ema.update([point(.2,.3),point(.7,.8)],0);
const output=ema.update([point(.3,.3,.1),point(.7,.7)],40);
check(Math.abs(output[0].x-(.2+.1*(1-Math.exp(-1))))<1e-9,true);
check(output[0].y,.3); check(output[1].x,.7); check(output[0].z>0,true);
const bad={...point(.9,.9),presence:.1};
check(ema.update([bad,point(.7,.7)],60)[0].visibility,0);
check(ema.update([point(.1,.1),point(.7,.7)],80)[0].x,.1);
check(ema.update([point(.2,.2)],70)[0].visibility,0);
check(ema.update([point(.9,.9)],800)[0].x,.9);
ema.reset(); check(ema.update([point(.2,.2)],900)[0].x,.2);
const stationary=new PoseLandmarkSmoother(), positions=[];
for(let i=0;i<30;i++) positions.push(stationary.update([point(.5+(i%2?.01:-.01),.5)],i*100)[0].x);
check(Math.max(...positions.slice(10))-Math.min(...positions.slice(10))<.02,true);
const presenceCriteria={...cameraTestCriteria("demo-knee-extension","left",1,{start:1,peak:2,returned:3}),preparation:undefined};
const presencePoints=Array.from({length:33},()=>point(.5,.5));presencePoints[25].presence=.1;
check(new PoseTrackingQuality().update(presencePoints,presenceCriteria,100),false);
function fixture(c,angle) {
  const points=Array.from({length:33},()=>point(.5,.5));
  const [hip,knee,ankle]=c.landmarks;
  points[hip]=point(.4,.4); points[knee]=point(.4,.6);
  points[ankle]=point(.4+.2*Math.sin(angle*Math.PI/180),.6-.2*Math.cos(angle*Math.PI/180));
  return points;
}
for (const side of ["left","right"]) for (const dt of [100,200]) {
  const c={...cameraTestCriteria("demo-knee-extension",side,1,{start:1,peak:2,returned:3}),preparation:undefined};
  const filter=new PoseLandmarkSmoother(), guard=new PoseTrackingQuality(), counter=new RepetitionCycle(c);
  let at=0; const angles=[];
  function step(angle,valid=true) {
    at+=dt; const raw=fixture(c,angle); if(!valid) raw[c.landmarks[2]].visibility=.1;
    const trusted=guard.update(raw,c,at);
    if(!trusted) {filter.reset();counter.sample(null,at,0);return;}
    const points=filter.update(raw,at,c.minVisibility);
    const measured=jointAngle(points,c,640,640); angles.push(measured);
    counter.sample(measured,at,1);
  }
  for(let i=0;i<10;i++)step(85+(i%2?.4:-.4));
  check(counter.repetitions.length,0);
  for(const a of [89,90,91,89,90,91,89,85,85])step(a);
  check(counter.repetitions.length,0);
  for(const a of [120,140,165,165,165,165,140,120,85,85,85,85])step(a);
  check(counter.repetitions.length,1); check(counter.repetitions[0].peakAngle>=160,true);
  check(counter.repetitions[0].peakAngle<=170,true);
  // Pause discards draft; filter/guard reset, no connection across resume.
  step(120); step(140); step(165);
  counter.interrupt();filter.reset();guard.reset();
  for(let i=0;i<8;i++)step(85);
  check(counter.repetitions.length,1);
  step(120);step(140);step(165);
  for(let i=0;i<12;i++)step(165,false);
  for(let i=0;i<8;i++)step(85);
  check(counter.repetitions.length,1);
  for(const a of [120,140,165,165,165,165,140,120,85,85,85,85])step(a);
  check(counter.repetitions.length,2); check(angles.every(Number.isFinite),true);
}
// Same elapsed interval gives the same EMA response regardless of subdivision.
const one=new PoseLandmarkSmoother(), two=new PoseLandmarkSmoother();
one.update([point(.2,.2)],0);two.update([point(.2,.2)],0);
const a=one.update([point(.4,.2)],100)[0].x;
two.update([point(.4,.2)],50);const b=two.update([point(.4,.2)],100)[0].x;
check(Math.abs(a-b)<1e-9,true);
console.log(JSON.stringify({smoothingChecks:checks,physicalCameraTested:false}));
