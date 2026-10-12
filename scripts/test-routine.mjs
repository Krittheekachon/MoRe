import path from "node:path";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createJiti} from "jiti";
import dotenv from "dotenv";
dotenv.config({quiet:true});
const j=createJiti(import.meta.url,{alias:{"@":path.resolve("src"),"server-only":path.resolve("node_modules/next/dist/compiled/server-only/empty.js")}});
const {prisma}=await j.import(path.resolve("src/lib/prisma.ts"));
const {routineProgress}=await j.import(path.resolve("src/lib/routine-progress.ts"));
const {trainingDay}=await j.import(path.resolve("src/lib/training-calendar.ts"));
const {readDailyTraining,readRoutineHistory}=await j.import(path.resolve("src/lib/training-service.ts"));
const {readPatientProgress}=await j.import(path.resolve("src/lib/patient-progress.ts"));
const {createRecordingService}=await j.import(path.resolve("src/lib/recording-service.ts"));
const {RepetitionCycle}=await j.import(path.resolve("src/lib/pose/cycle.ts"));
const security=await j.import(path.resolve("src/lib/account-security.ts"));
const accounts=[];
let checks=0;const check=(v,label)=>{assert.ok(v,label);checks++;};
const users=[];let exercise;
try {
 check(["localhost","127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname),"local DB only");
 check(trainingDay(new Date("2026-10-12T16:59:59Z")).date==="2026-10-12","before Bangkok midnight");
 check(trainingDay(new Date("2026-10-12T17:00:00Z")).date==="2026-10-13","after Bangkok midnight");
 const partial=routineProgress(1,5,"left",[{count:2,side:"left"}]);check(partial.percent===40&&!partial.completed,"partial 40 percent");
 check(!routineProgress(1,5,"both",[{count:8,side:"left"}]).completed,"both requires right");
 check(routineProgress(1,5,"both",[{count:8,side:"left"},{count:5,side:"right"}]).completed,"both complete");
 const tag=randomUUID().slice(0,8),before=new Date("2026-10-12T16:59:00Z"),after=new Date("2026-10-12T17:01:00Z");
 const catalog=await prisma.exercise.findFirstOrThrow({select:{module_id:true}});
 exercise=await prisma.exercise.create({data:{module_id:catalog.module_id,code:`routine-test-${tag}`,name_th:"MoRe Routine Test",supports_side_selection:true,sort_order:99}});
 const metric=await prisma.exerciseAngleMetric.create({data:{exercise_id:exercise.id,metric_code:"routine-fixture",label_th:"Software fixture",landmark_a:"LEFT_HIP",landmark_b:"LEFT_KNEE",landmark_c:"LEFT_ANKLE",is_primary:true}});
 const ids={};for(const phase of ["start","peak","return"]){const c=await prisma.exerciseCheckpoint.create({data:{exercise_id:exercise.id,metric_id:metric.id,code:phase,phase,min_value:phase==="peak"?160:75,max_value:phase==="peak"?170:105}});ids[phase==="return"?"returned":phase]=c.id;}
 const criteria={exerciseCode:exercise.code,metricId:metric.id,definitionVersion:1,criteriaVersion:1,landmarks:[23,25,27],coordinates:"image-2d",start:{min:75,max:105},departureMin:125,correctPeak:{min:160,max:170},stableMs:100,maxGapMs:1000,minVisibility:.6,checkpointIds:ids};
 const service=createRecordingService((code)=>code===exercise.code?criteria:undefined);
 for(let i=0;i<2;i++){
  const nationalId=`0${String(BigInt(`0x${randomUUID().replaceAll("-","").slice(0,12)}`)%1000000000000n).padStart(12,"0")}`,password=randomUUID();
  const user=await prisma.user.create({data:{role:"patient",display_name:`MoRe Routine Test ${tag}`,password_hash:await security.hashPassword(password),created_at:before,updated_at:before,patientProfile:{create:{hn:`RT-${tag}-${i}`,full_name:"MoRe Routine Test",national_id_lookup:security.nationalIdLookup(nationalId),national_id_encrypted:security.encryptNationalId(nationalId),updated_at:before}}}});users.push(user.id);accounts.push({nationalId,password});
  await prisma.rehabilitationPlan.create({data:{patient_id:user.id,created_by:user.id,plan_code:`routine-${tag}-${i}`,created_at:before,updated_at:before,exercises:{create:{exercise_id:exercise.id,selected_side:"left",target_sets:1,target_reps_per_set:5,effective_from:new Date(before.getTime()-86400000),configured_by:user.id,version_number:1}}}});
 }
 const day=await readDailyTraining(users[0],before),daily=day.items[0];check(day.percent===0,"new day zero");
 check((await readDailyTraining(users[1],before)).percent===0,"second patient zero");
 const reps=(count,start)=>{const cycle=new RepetitionCycle(criteria);let at=start.getTime()+100;for(let n=0;n<count;n++)for(const angle of [90,90,125,165,90,90]){cycle.sample(angle,at);at+=100;}return cycle.repetitions;};
 const payload=(count,start)=>({side:"left",metricId:metric.id,definitionVersion:1,criteriaVersion:1,elapsedSeconds:10,repetitions:reps(count,start)});
 const slot=await service.start(users[0],daily.id,{side:"left"},before);
 const input=payload(2,before);input.repetitions[0].peakAngle=150;
 const saved=await service.save(users[0],slot.setId,input,new Date(before.getTime()+20000));
 check(saved.reps===2&&saved.completedSets===0,"partial actual count retained");
 const retries=await Promise.all(Array.from({length:4},()=>service.save(users[0],slot.setId,input,new Date(before.getTime()+21000))));check(retries.every(retry=>retry.savedSets===1),"concurrent duplicate idempotent");
 check(await prisma.repetition.count({where:{set_id:slot.setId}})===2,"no duplicate reps");
 const partialDay=await readDailyTraining(users[0],before);check(partialDay.percent===40&&partialDay.status==="in_progress","partial daily progress");
 const progressPartial=(await readPatientProgress(users[0],daily.id)).selected;
 check(progressPartial.count===2&&progressPartial.correct===1&&progressPartial.completedSets===0&&progressPartial.visits===1,"progress partial actual totals separate visits");
 check(progressPartial.angles[0].average===157.5,"progress average uses each recorded peak");
 const slot2=await service.start(users[0],daily.id,{side:"left"},new Date(before.getTime()+30000));
 check(slot2.setId===slot.setId&&slot2.baseReps===2&&slot2.repetitions.length===2&&slot2.setNumber===1,"resume same saved partial set");
 const confirmedIds=(await prisma.repetition.findMany({where:{set_id:slot.setId},orderBy:{rep_number:"asc"},select:{id:true}})).map(rep=>rep.id);
 const continued={...payload(3,new Date(before.getTime()+30000)),baseReps:2,elapsedSeconds:20,repetitions:[...input.repetitions,...reps(3,new Date(before.getTime()+30000))]};
 let staleDenied=false;try{await service.save(users[0],slot2.setId,{...continued,baseReps:0},after);}catch(e){staleDenied=e.status===409;}check(staleDenied,"stale append rejected");
 const appended=await Promise.all(Array.from({length:3},()=>service.save(users[0],slot2.setId,continued,after)));
 const saved2=appended[0];
 check(appended.every(item=>item.reps===5&&item.savedSets===1),"concurrent append retries append once");
 check(saved2.setNumber===1&&saved2.targetSets===1&&saved2.dayCompleted&&saved2.setCompleted&&saved2.correctReps===4,"server summary proves day completion and actual ordinal");
 check(await prisma.exerciseSet.count({where:{status:"saved",session:{daily_exercise_id:daily.id}}})===1,"partial continuation creates no extra saved set");
 check(saved2.reps===5&&saved2.completedSets===1,"cross midnight and surplus retained");
 check((await prisma.repetition.findMany({where:{set_id:slot.setId},orderBy:{rep_number:"asc"},select:{id:true}})).slice(0,2).every((rep,index)=>rep.id===confirmedIds[index]),"confirmed prefix IDs never rewritten");
 const next=await readDailyTraining(users[0],after);check(next.date!==day.date&&next.percent===0,"next day resets only summary");
 const history=await readRoutineHistory(users[0]);check(history.find(d=>d.date===day.date)?.completedRoutines===1,"one completed routine on original day");
 check(history.find(d=>d.date===day.date)?.percent===100,"history complete");
 check((await readDailyTraining(users[1],before)).percent===0,"isolation");
 let denied=false;try{await service.save(users[1],slot.setId,input,after);}catch(e){denied=e.status===404;}check(denied,"other patient cannot save");
 const snapshot=await prisma.dailyExercise.findUniqueOrThrow({where:{id:daily.id}});
 await prisma.planExercise.update({where:{id:snapshot.plan_exercise_id},data:{target_reps_per_set:10}});
 check((await readRoutineHistory(users[0])).find(d=>d.date===day.date)?.percent===100,"plan edit preserves historic goals");
 check((await readDailyTraining(users[0],after)).items[0].targetReps===5,"existing next-day snapshot immutable");
 const third=await readDailyTraining(users[0],new Date(after.getTime()+86400000));check(third.items[0].targetReps===10,"future day new goal");
 check(saved2.maxAngle===165&&saved2.averageAngle===162,"peak metrics actual");
 const progressFull=(await readPatientProgress(users[0],daily.id)).selected;
 check(progressFull.count===5&&progressFull.sets.length===1&&progressFull.angles[0].average===162&&progressFull.visits===1,"progress continuation is accumulated once and weighted per round");
 let progressDenied=false;try{await readPatientProgress(users[1],daily.id);}catch(e){progressDenied=e.status===404;}check(progressDenied,"progress detail ownership");
 const surplus=await service.start(users[0],next.items[0].id,{side:"left"},after);
 await service.save(users[0],surplus.setId,payload(6,after),new Date(after.getTime()+20000));
 let extraDenied=false;try{await service.start(users[0],next.items[0].id,{side:"left"},new Date(after.getTime()+30000));}catch(e){extraDenied=e.status===409;}check(extraDenied,"no new set beyond plan target");
 check((await readRoutineHistory(users[0])).find(d=>d.date===next.date)?.completedRoutines===1,"surplus reps never add second routine");
 check(await prisma.exerciseSet.count({where:{status:"saved",session:{daily_exercise_id:next.items[0].id}}})===1,"surplus reps remain in completed set history");
 const emptySlot=await service.start(users[0],third.items[0].id,{side:"left"},new Date(after.getTime()+86400000));
 const zeroPayload=payload(0,new Date(after.getTime()+86400000));
 const zero=await service.save(users[0],emptySlot.setId,zeroPayload,new Date(after.getTime()+86430000));
 check(zero.reps===0&&zero.correctReps===0&&!zero.setCompleted&&zero.maxAngle===null&&zero.averageAngle===null,"zero rounds saved honestly without completion or fake metrics");
 const progressZero=(await readPatientProgress(users[0],third.items[0].id)).selected;check(progressZero.count===0&&progressZero.angles.length===0&&!progressZero.completed,"progress zero and missing angles honest");
 await service.save(users[0],emptySlot.setId,zeroPayload,new Date(after.getTime()+86430000));
 check(await prisma.exerciseSet.count({where:{id:emptySlot.setId,status:"saved"}})===1,"zero save retry creates no extra set");
 const resumedZero=await service.start(users[0],third.items[0].id,{side:"left"},new Date(after.getTime()+86431000));
 check(resumedZero.setId===emptySlot.setId&&resumedZero.baseReps===0,"zero saved set resumes same logical set");
 await service.save(users[0],emptySlot.setId,{...zeroPayload,baseReps:0,elapsedSeconds:11},new Date(after.getTime()+86432000));
 check((await prisma.exerciseSet.findUnique({where:{id:emptySlot.setId}})).elapsed_seconds===11,"no-new-round save preserves actual elapsed time");
 await prisma.dailyExercise.update({where:{id:third.items[0].id},data:{target_sets:2}});
 const firstFull=await service.save(users[0],emptySlot.setId,{...payload(10,new Date(after.getTime()+86400000)),elapsedSeconds:12},new Date(after.getTime()+86440000));
 check(firstFull.setNumber===1&&firstFull.setCompleted&&!firstFull.exerciseCompleted&&!firstFull.dayCompleted,"complete set with remaining target");
 const nextSet=await service.start(users[0],third.items[0].id,{side:"left"},new Date(after.getTime()+86440000));
 check(nextSet.setId!==emptySlot.setId&&nextSet.setNumber===2,"next logical set allocated only after completion");
 const other=await readDailyTraining(users[1],before);
 await prisma.dailyExercise.update({where:{id:other.items[0].id},data:{selected_side:"both"}});
 const left=await service.start(users[1],other.items[0].id,{side:"left"},before);
 await service.save(users[1],left.setId,payload(5,before),new Date(before.getTime()+20000));
 check((await readDailyTraining(users[1],before)).percent===50,"one side is half of bilateral routine");
 const right=await service.start(users[1],other.items[0].id,{side:"right"},new Date(before.getTime()+30000));
 await service.save(users[1],right.setId,{...payload(5,new Date(before.getTime()+30000)),side:"right"},after);
 check((await readDailyTraining(users[1],before)).status==="completed","bilateral routine needs both sides");
 if(process.env.MORE_PROGRESS_BROWSER==="1") {
  const {verifyProgressBrowser}=await import("./test-patient-progress.mjs");
  console.log(JSON.stringify({progressBrowser:await verifyProgressBrowser(accounts,daily.id,other.items[0].id)}));
 }
 if(process.env.MORE_TEST_TOOLS_CHECK==="1" || process.env.MORE_ROUTINE_BROWSER==="1") {
  const {verifyPatientTestTools}=await import("./test-patient-test-tools.mjs");
  console.log(JSON.stringify({testTools:await verifyPatientTestTools(prisma,users,accounts,service,slot,input,before,after)}));
 }
} finally {
 // Delete only the exact synthetic rows created in this invocation, in FK order.
 if(users.length){const where={set:{session:{dailyExercise:{day:{patient_id:{in:users}}}}}};await prisma.repetitionCheckpointResult.deleteMany({where:{repetition:where}});await prisma.repetitionMetric.deleteMany({where:{repetition:where}});await prisma.repetition.deleteMany({where});await prisma.exerciseSet.deleteMany({where:{session:{dailyExercise:{day:{patient_id:{in:users}}}}}});await prisma.cameraCheck.deleteMany({where:{session:{dailyExercise:{day:{patient_id:{in:users}}}}}});await prisma.exerciseSession.deleteMany({where:{dailyExercise:{day:{patient_id:{in:users}}}}});await prisma.dailyExercise.deleteMany({where:{day:{patient_id:{in:users}}}});await prisma.rehabilitationDay.deleteMany({where:{patient_id:{in:users}}});await prisma.planExerciseWeekday.deleteMany({where:{planExercise:{plan:{patient_id:{in:users}}}}});await prisma.planExercise.deleteMany({where:{plan:{patient_id:{in:users}}}});await prisma.rehabilitationPlan.deleteMany({where:{patient_id:{in:users}}});await prisma.patientProfile.deleteMany({where:{patient_id:{in:users}}});await prisma.user.deleteMany({where:{id:{in:users}}});}
 if(exercise){await prisma.exerciseCheckpoint.deleteMany({where:{exercise_id:exercise.id}});await prisma.exerciseAngleMetric.deleteMany({where:{exercise_id:exercise.id}});await prisma.exercise.delete({where:{id:exercise.id}});}await prisma.$disconnect();
}
console.log(JSON.stringify({checks,realPostgres:true,fixturesRemoved:true}));
