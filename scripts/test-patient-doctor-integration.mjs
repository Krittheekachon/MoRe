import path from "node:path";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import fs from "node:fs";
import {execFileSync} from "node:child_process";
import {createJiti} from "jiti";
import dotenv from "dotenv";
dotenv.config({quiet:true});
const j=createJiti(import.meta.url,{alias:{"@":path.resolve("src"),"server-only":path.resolve("node_modules/next/dist/compiled/server-only/empty.js")}});
const {prisma}=await j.import(path.resolve("src/lib/prisma.ts"));
const security=await j.import(path.resolve("src/lib/account-security.ts"));
const {readDailyTraining}=await j.import(path.resolve("src/lib/training-service.ts"));
const {createRecordingService}=await j.import(path.resolve("src/lib/recording-service.ts"));
const {RepetitionCycle}=await j.import(path.resolve("src/lib/pose/cycle.ts"));
const origin=process.env.MORE_TEST_ORIGIN||"https://localhost:3000";
const users=[],patients=[];let exercise,checks=0;
const check=(v,label)=>{assert.ok(v,label);checks++;};
const cookie=response=>response.headers.getSetCookie().map(v=>v.split(";")[0]).join("; ");
const request=(url,method="GET",body,session)=>fetch(origin+url,{method,headers:{Origin:origin,...(body?{"Content-Type":"application/json"}:{}),...(session?{Cookie:session}:{})},...(body?{body:JSON.stringify(body)}:{})});
try{
 check(["localhost","127.0.0.1"].includes(new URL(origin).hostname)&&["localhost","127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname),"local fixture only");
 const tag=randomUUID().slice(0,8),now=new Date(),start=new Date(now.getTime()-20000),password=randomUUID();
 const doctor=await prisma.user.create({data:{role:"doctor",login_name:`it-${tag}`,display_name:`MoRe Integration Test ${tag}`,password_hash:await security.hashPassword(password),created_at:now,updated_at:now}});users.push(doctor.id);
 const staffLogin=await request("/api/auth/doctor/login","POST",{loginName:doctor.login_name,password});check(staffLogin.ok,"existing doctor login");const staffCookie=cookie(staffLogin);
 for(let i=0;i<2;i++){
  const nationalId=`0${String(BigInt(`0x${randomUUID().replaceAll("-","").slice(0,12)}`)%1000000000000n).padStart(12,"0")}`;
  const first=await request("/api/auth/register/start","POST",{nationalId,password,useInitial:false});check(first.ok,"registration start");
  const done=await request("/api/auth/register","POST",{full_name:`MoRe Integration Test ${tag} ${i}`,date_of_birth:"1980-01-01",sex:"male",stroke_type:"ischemic",stroke_diagnosed_on:"2020-01-01",other_conditions:""},cookie(first));
  // Locate only this invocation's identity, even if response fails after DB commit.
  const profile=await prisma.patientProfile.findUnique({where:{national_id_lookup:security.nationalIdLookup(nationalId)}});
  if(profile){users.push(profile.patient_id);patients.push(profile.patient_id);}
  check(done.ok&&!!profile,"registration creates central profile");
  const login=await request("/api/auth/login","POST",{nationalId,password});check(login.ok,"patient login");
  patients[i]={id:profile.patient_id,cookie:cookie(login)};
 }
 const list=await request(`/api/doctor/patients?q=${tag}&page=1&pageSize=1`,"GET",undefined,staffCookie);check(list.ok,"doctor list");const result=await list.json();
 check(result.total===2&&result.items.length===1&&result.totalPages===2,"search pagination newly registered patients");
 check(!/password_hash|national_id_|binding|session_secret/i.test(JSON.stringify(result)),"safe list DTO");
 const page2=await(await request(`/api/doctor/patients?q=${tag}&page=2&pageSize=1`,"GET",undefined,staffCookie)).json();check(page2.items[0].patientId!==result.items[0].patientId,"stable distinct pages");
 check((await request("/api/doctor/patients?page=0","GET",undefined,staffCookie)).status===400,"invalid pagination");
 check((await request("/api/doctor/patients")).status===401,"anonymous denied");
 check((await request("/api/doctor/patients","GET",undefined,patients[0].cookie)).status===403,"patient cannot list");
 const empty=await(await request(`/api/doctor/patients/${patients[0].id}/training`,"GET",undefined,staffCookie)).json();check(empty.patientId===patients[0].id&&empty.plan===null&&empty.sessions.length===0&&empty.today.percent===0,"empty training supported");
 check((await request(`/api/doctor/patients/${patients[1].id}/training`,"GET",undefined,patients[0].cookie)).status===403,"patient cannot read another patient through doctor API");
 check((await request("/api/patient/profile","PATCH",{primary_doctor_name:"unauthorized"},patients[0].cookie)).status===400,"patient cannot edit primary doctor");
 const own=await(await request("/api/patient/profile","GET",undefined,patients[0].cookie)).json();check(Number(own.profile.id)===patients[0].id&&!own.profile.primary_doctor_name,"own profile unchanged");
 check(!('primaryDoctor' in own.profile)&&!('primary_doctor_name' in own.profile),"removed doctor data absent from patient DTO");
 check((await request("/api/doctor/primary-doctors","GET",undefined,staffCookie)).status===404,"directory endpoint removed");
 check((await request(`/api/doctor/patients/${patients[0].id}/primary-doctor`,"PUT",{primaryDoctorId:1},staffCookie)).status===404,"assignment endpoint removed");
 const exerciseModule=await prisma.exerciseModule.findFirstOrThrow();
 exercise=await prisma.exercise.create({data:{module_id:exerciseModule.id,code:`it-knee-${tag}`,name_th:"MoRe Integration Fixture",supports_side_selection:true,sort_order:99}});
 const metric=await prisma.exerciseAngleMetric.create({data:{exercise_id:exercise.id,metric_code:"fixture",label_th:"Fixture",landmark_a:"LEFT_HIP",landmark_b:"LEFT_KNEE",landmark_c:"LEFT_ANKLE",is_primary:true}});
 const ids={};for(const phase of ["start","peak","return"]){const row=await prisma.exerciseCheckpoint.create({data:{exercise_id:exercise.id,metric_id:metric.id,code:phase,phase,min_value:phase==="peak"?160:75,max_value:phase==="peak"?170:105}});ids[phase==="return"?"returned":phase]=row.id;}
 const criteria={exerciseCode:exercise.code,metricId:metric.id,definitionVersion:1,criteriaVersion:1,landmarks:[23,25,27],coordinates:"image-2d",start:{min:75,max:105},departureMin:125,correctPeak:{min:160,max:170},stableMs:100,maxGapMs:1000,minVisibility:.6,checkpointIds:ids};
 await prisma.rehabilitationPlan.create({data:{patient_id:patients[0].id,created_by:doctor.id,plan_code:`IT-${tag}`,created_at:now,updated_at:now,exercises:{create:{exercise_id:exercise.id,selected_side:"left",target_sets:1,target_reps_per_set:5,effective_from:start,version_number:1,configured_by:doctor.id}}}});
 const today=await readDailyTraining(patients[0].id,now),service=createRecordingService(code=>code===exercise.code?criteria:undefined);
 const slot=await service.start(patients[0].id,today.items[0].id,{side:"left"},start);
 const cycle=new RepetitionCycle(criteria);let at=start.getTime()+100;for(let i=0;i<2;i++)for(const angle of [90,90,125,165,90,90]){cycle.sample(angle,at);at+=100;}
 const saved=await service.save(patients[0].id,slot.setId,{side:"left",metricId:metric.id,definitionVersion:1,criteriaVersion:1,elapsedSeconds:5,repetitions:cycle.repetitions},now);
 const trained=await(await request(`/api/doctor/patients/${patients[0].id}/training`,"GET",undefined,staffCookie)).json();
 const set=trained.sessions.flatMap(s=>s.sets).find(s=>s.id===saved.setId);
 check(trained.today.percent===40&&trained.routines[0].percent===40&&set.repetitions.length===2,"doctor reads same saved Routine and repetitions");
 check(set.target===5&&set.elapsed===5&&set.repetitions.every(rep=>rep.side==="left"&&rep.metrics[0].peak===165),"same side time targets and metrics");
 check(!/password_hash|national_id_|binding|session_secret/i.test(JSON.stringify(trained)),"safe detail DTO");
 const isolated=await(await request(`/api/doctor/patients/${patients[1].id}/training`,"GET",undefined,staffCookie)).json();check(isolated.sessions.length===0&&isolated.today.percent===0,"patient histories isolated");
 await prisma.user.update({where:{id:doctor.id},data:{role:"therapist"}});check((await request("/api/doctor/patients","GET",undefined,staffCookie)).status===403,"doctor role required");
 check((await request(`/api/doctor/patients/${patients[0].id}`,"GET",undefined,staffCookie)).status===403,"legacy patient API also requires doctor role");
 if(process.env.MORE_INTEGRATION_BROWSER==="1"){
  const filename="output/playwright/integration-code.js";fs.mkdirSync(path.dirname(filename),{recursive:true});
  fs.writeFileSync(filename,`async(page)=>{
   const context=await page.context().browser().newContext({ignoreHTTPSErrors:true});const p=await context.newPage(),errors=[];let checks=0;
   p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('pageerror',e=>errors.push(e.message));
   const check=(v,l)=>{if(!v)throw Error(l);checks++;};
   try{
    const cookie=${JSON.stringify(patients[0].cookie)};const domain=new URL(${JSON.stringify(origin)}).hostname;
    await context.addCookies(cookie.split('; ').map(value=>({name:value.slice(0,value.indexOf('=')),value:value.slice(value.indexOf('=')+1),domain,path:'/',httpOnly:true,sameSite:'Lax'})));
    for(const [width,height]of [[390,844],[820,1180],[1180,820],[1440,1000]]){
     await p.setViewportSize({width,height});await p.goto(${JSON.stringify(origin)}+'/patient/profile');await p.waitForLoadState('networkidle');
     check(await p.locator('#profile-doctor-title').count()===0,'doctor card removed');
     check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow');
     await p.reload();await p.waitForLoadState('networkidle');check(await p.locator('#profile-doctor-title').count()===0,'removed after reload');
    }
    await p.getByRole('link',{name:'แก้ไขข้อมูลส่วนตัว',exact:true}).click();await p.waitForURL('**/patient/profile/edit');
    check(await p.locator('input[maxlength="150"]').count()===0,'no primary doctor edit input');check(!errors.some(e=>/hydration|hydrated|didn.t match/i.test(e)),'hydration');
    return {checks,hydrationErrors:0,browser:'Chromium',physicalIPad:false};
   }finally{await context.close();}
  }`);
  try{
   let output;try{output=execFileSync(process.env.ComSpec,["/d","/s","/c",`npx.cmd --yes --package @playwright/cli playwright-cli -s=more-integration run-code --filename ${filename}`],{encoding:"utf8",timeout:100000,maxBuffer:1000000});}catch(error){throw Error(String(error.stdout||"").match(/(?:Error|TimeoutError):[^\r\n]*/)?.[0]||"Browser command failed");}
   const result=output.match(/### Result\r?\n([^\r\n]+)/);check(!!result,"browser result");console.log(JSON.stringify({browser:JSON.parse(result[1])}));
  }finally{fs.rmSync(filename,{force:true});}
 }
 console.log(JSON.stringify({checks,realPostgres:true,registrationThroughAPI:true,primaryDoctorRemoved:true}));
}catch(error){console.error("Integration verification failed:",error.code==="ERR_ASSERTION"?error.message:error.code||error.message?.split("\n")[0]);process.exitCode=1;}
finally{
 const patientIds=patients.map(p=>typeof p==="number"?p:p.id);
 if(patientIds.length){const daily={day:{patient_id:{in:patientIds}}},session={dailyExercise:daily},repetition={set:{session}};await prisma.repetitionCheckpointResult.deleteMany({where:{repetition}});await prisma.repetitionMetric.deleteMany({where:{repetition}});await prisma.repetition.deleteMany({where:repetition});await prisma.cameraCheck.deleteMany({where:{session}});await prisma.exerciseSet.deleteMany({where:{session}});await prisma.exerciseSession.deleteMany({where:session});await prisma.dailyExercise.deleteMany({where:daily});await prisma.rehabilitationDay.deleteMany({where:{patient_id:{in:patientIds}}});await prisma.planExercise.deleteMany({where:{plan:{patient_id:{in:patientIds}}}});await prisma.rehabilitationPlan.deleteMany({where:{patient_id:{in:patientIds}}});await prisma.patientProfile.deleteMany({where:{patient_id:{in:patientIds}}});}
 if(users.length)await prisma.user.deleteMany({where:{id:{in:users}}});
 if(exercise){await prisma.exerciseCheckpoint.deleteMany({where:{exercise_id:exercise.id}});await prisma.exerciseAngleMetric.deleteMany({where:{exercise_id:exercise.id}});await prisma.exercise.delete({where:{id:exercise.id}});}await prisma.$disconnect();console.log("Synthetic integration fixtures removed.");
}
