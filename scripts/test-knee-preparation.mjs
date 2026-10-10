import path from "node:path";
import assert from "node:assert/strict";
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url);
const { KneePreparation } = await jiti.import(path.resolve("src/lib/pose/exercises/knee-preparation.ts"));
const { cameraTestCriteria } = await jiti.import(path.resolve("src/lib/pose/camera-test-adapter.ts"));
const { RepetitionCycle, jointAngle } = await jiti.import(path.resolve("src/lib/pose/cycle.ts"));
const { drawMeasurementLabels } = await jiti.import(path.resolve("src/lib/pose/landmark-labels.ts"));
const { PoseTrackingQuality } = await jiti.import(path.resolve("src/lib/pose/tracking-quality.ts"));
let checks = 0; const check = (value, expected) => { assert.deepEqual(value, expected); checks++; };
const criteria = side => cameraTestCriteria("demo-knee-extension", side, 1, { start: 1, peak: 2, returned: 3 }, 3);
function fixture(side, angle = 85) {
  const c = criteria(side), p = c.preparation, sign = p.facingSign;
  const points = Array.from({length:33}, () => ({ x: .5, y: .5, z: .15, visibility: 1 }));
  const hipX = side === "right" ? .65 : .35, kneeX = hipX + sign * .25;
  points[c.landmarks[0]] = { x:hipX,y:.4,z:-.15,visibility:1 };
  points[p.shoulder] = { x:hipX,y:.15,z:-.15,visibility:1 };
  points[c.landmarks[1]] = { x:kneeX,y:.4,z:-.15,visibility:1 };
  const ankleX = kneeX - sign * .15 * Math.cos(angle*Math.PI/180), ankleY = .4 + .2 * Math.sin(angle*Math.PI/180);
  points[c.landmarks[2]] = { x:ankleX,y:ankleY,z:-.15,visibility:1 };
  points[p.heel] = { x:ankleX,y:ankleY+.01,z:-.15,visibility:1 };
  points[p.foot] = { x:ankleX+sign*.08,y:ankleY+.01,z:-.15,visibility:1 };
  points[p.oppositeHip] = { x:hipX+.02,y:.4,z:.15,visibility:1 };
  points[p.oppositeKnee] = { x:kneeX+.02,y:.4,z:.15,visibility:1 };
  return points;
}
for (const side of ["left","right"]) {
  const c=criteria(side), gate=new KneePreparation(), counter=new RepetitionCycle(c); let at=0;
  const step=(angle, mutate = p=>p, trusted=true, advance=200) => {
    at+=advance; const points=mutate(fixture(side,angle));
    const result=gate.update(points,c,800,600,at,trusted,counter.movement);
    if (result.allowed) counter.sample(result.knee,at,1); else if (result.interrupt) counter.interrupt(); else counter.suspend();
    return result;
  };
  check(step(85).allowed,false); check(step(85).allowed,false); check(step(85).ready,true); step(85);
  for(const angle of [90,91,89,90,85]) step(angle); check(counter.repetitions.length,0);
  step(120); step(165); check(counter.repetitions.length,0); step(130); step(85); step(85);
  check(counter.repetitions.length,1); check(Math.abs(counter.repetitions[0].peakAngle-165)<.001,true);
  step(120); step(130); step(85); step(85); check(counter.repetitions.length,2);
  check(counter.repetitions[1].peakAngle<160,true);
  const wrong = p=>{p[c.landmarks[0]].z=.3; p[c.landmarks[1]].z=.3; return p;};
  step(85,wrong); step(85,wrong); const far=step(85,wrong); check(far.allowed,true); check(far.message.includes("สองข้าง"),false);
  for(let i=0;i<6;i++) step(85,p=>p,false); check(counter.repetitions.length,2); check(counter.movement.phase,"preparing");
  for(let i=0;i<4;i++) step(85); step(120); step(165); step(165,p=>p,false); step(165,p=>p,false);
  check(counter.repetitions.length,2); // Short loss suspends instead of counting.
  step(85); step(85); check(counter.repetitions.length,3);
  step(120); step(165); step(85,p=>p,true,1500); check(counter.repetitions.length,3); check(counter.movement.phase,"preparing");
  const upright=fixture(side), bad=fixture(side); bad[c.preparation.shoulder].x+=.25;
  const fresh=new KneePreparation(); fresh.update(bad,c,800,600,100,true,{phase:"preparing",completedReps:0});
  check(fresh.update(bad,c,800,600,500,true,{phase:"preparing",completedReps:0}).message,"นั่งหลังตรงและวางต้นขาให้ได้ระดับ");
  check(Math.abs(jointAngle(upright,c,800,600)-85)<.001,true);
  const front=fixture(side); front[c.preparation.oppositeHip].z=front[c.landmarks[0]].z; front[c.preparation.oppositeKnee].z=front[c.landmarks[1]].z;
  const fg=new KneePreparation(); fg.update(front,c,800,600,100,true,{phase:"preparing",completedReps:0});
  fg.update(front,c,800,600,500,true,{phase:"preparing",completedReps:0});check(fg.debug.depth,"ไม่สามารถยืนยัน");
  const hidden=fixture(side); hidden[c.preparation.shoulder].visibility=.1;
  const missing=new KneePreparation().update(hidden,c,800,600,100,true,{phase:"preparing",completedReps:0}); check(Math.abs(missing.knee-85)<.001,true); check(missing.torso,null);
  for (const index of [c.preparation.oppositeHip,c.preparation.heel]) {
    const occluded=fixture(side);occluded[index].visibility=.1;
    const quality=new PoseTrackingQuality();
    check(quality.update(occluded,c,100),false);check(quality.update(occluded,c,500),true);
    const gate=new KneePreparation();gate.update(occluded,c,800,600,100,true,{phase:"preparing",completedReps:0});
    const result=gate.update(occluded,c,800,600,500,true,{phase:"preparing",completedReps:0});
    check(result.allowed,true);check(Math.abs(result.knee-85)<.001,true);check(Math.abs(result.torso-90)<.001,true);
    check(result.message.includes("สองข้าง"),false);
  }
  const text=[], boxes=[];
  const ctx={ save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},translate(){},scale(x,y){check([x,y],[-1,1]);},fillRect(x,y,w,h){boxes.push({w,h});},measureText(t){return {width:t.length*7};},fillText(t){text.push(t);} };
  drawMeasurementLabels(ctx,upright,800,600,c,true,{knee:85,torso:90},false,{top:100,bottom:450});
  check(text.some(t=>t.includes("เข่า 85°")),true); check(text.some(t=>t.includes("ลำตัว 90°")),true);
  check(text.some(t=>t.includes("ส้นเท้า")||t.includes("ปลายเท้า")),false);
}
const old= cameraTestCriteria("demo-knee-extension","left",1,{start:1,peak:2,returned:3},2);
check(old.start,{min:75,max:105}); check(old.preparation,undefined);
const returnedCounter = new RepetitionCycle(criteria("right"));
for (const [at, angle] of [[0,85],[200,85],[400,120],[600,165],[800,91],[1000,91]]) returnedCounter.sample(angle,at,1);
check(returnedCounter.repetitions.length,1);
check(returnedCounter.movement.phase,"preparing");
returnedCounter.sample(120,1200,1); returnedCounter.sample(91,1400,1); returnedCounter.sample(91,1600,1);
check(returnedCounter.repetitions.length,1); // Must re-arm inside the narrower initial range.
const rightCriteria = criteria("right"), driftGate = new KneePreparation();
driftGate.update(fixture("right"),rightCriteria,800,600,100,true,{phase:"preparing",completedReps:0});
const drifted = fixture("right"); for (const point of drifted) point.x += .04;
check(driftGate.update(drifted,rightCriteria,800,600,300,true,{phase:"preparing",completedReps:0}).allowed,false);
const reversedFoot = fixture("right"); reversedFoot[rightCriteria.preparation.foot].x = reversedFoot[rightCriteria.preparation.heel].x + .08;
check(new KneePreparation().update(reversedFoot,rightCriteria,800,600,100,true,{phase:"preparing",completedReps:0}).allowed,false);
console.log(JSON.stringify({preparationChecks:checks,physicalIPadTested:false}));
