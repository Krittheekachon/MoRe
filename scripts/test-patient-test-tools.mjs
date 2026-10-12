import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import {execFileSync} from "node:child_process";
import {createJiti} from "jiti";
export async function verifyPatientTestTools(prisma,users,accounts,service,slot,payload,before,after) {
 const j=createJiti(import.meta.url,{alias:{"@":path.resolve("src"),"server-only":path.resolve("node_modules/next/dist/compiled/server-only/empty.js")}});
 const {clearTrainingResults}=await j.import(path.resolve("src/lib/patient-test-tools.ts"));
 const {testToolsEnabled,validRoutineDate}=await j.import(path.resolve("src/lib/routine-clock.ts"));
 let checks=0;const check=(c,label)=>{assert.ok(c,label);checks++;};
 const old=process.env.MORE_PATIENT_TEST_TOOLS,env=process.env.NODE_ENV;
 try {
  process.env.NODE_ENV="production";delete process.env.MORE_PATIENT_TEST_TOOLS;check(!testToolsEnabled(),"production closed");
  process.env.MORE_PATIENT_TEST_TOOLS="1";check(testToolsEnabled(),"explicit server opt-in");
  check(!validRoutineDate("2026-02-30")&&!validRoutineDate("garbage")&&validRoutineDate("2026-10-12"),"calendar validation");
  const counts=id=>prisma.repetition.count({where:{set:{session:{dailyExercise:{day:{patient_id:id}}}}}});
  const otherCount=await counts(users[1]);const plans=await prisma.rehabilitationPlan.count({where:{patient_id:users[0]}});
  const result=await clearTrainingResults(users[0],"2026-10-12",false);check(result.clearedRounds===5,"clear selected day");
  check(await counts(users[0])>0,"other days retained");check(await counts(users[1])===otherCount,"other patient preserved");
  check(await prisma.dailyExercise.count({where:{day:{patient_id:users[0],local_date:new Date("2026-10-12T00:00Z")},status:"not_started"}})===1,"daily reset");
  let blocked=false;try{await service.save(users[0],slot.setId,payload,after);}catch(e){blocked=[404,409].includes(e.status);}check(blocked,"stale deleted set save blocked");
  await clearTrainingResults(users[0],"2026-10-12",true);check(await counts(users[0])===0,"all own results cleared");check(await prisma.rehabilitationPlan.count({where:{patient_id:users[0]}})===plans,"plans retained");
  check(await prisma.patientProfile.count({where:{patient_id:users[0]}})===1,"profile retained");
  process.env.MORE_PATIENT_TEST_TOOLS="0";let disabled=false;try{await clearTrainingResults(users[0],"2026-10-12",true);}catch(e){disabled=e.status===403;}check(disabled,"disabled tool refuses delete");
  const codePath="output/playwright/test-tools-code.js";
  fs.writeFileSync(codePath,fs.readFileSync("scripts/test-patient-test-tools-browser.js","utf8").replace("null /*FIXTURES*/",JSON.stringify(accounts)));
  try {
   const output=execFileSync(process.env.ComSpec,["/d","/s","/c",`npx.cmd --yes --package @playwright/cli playwright-cli -s=more-recording run-code --filename ${codePath}`],{encoding:"utf8",timeout:180000,maxBuffer:1000000});
   const match=output.match(/### Result\r?\n([^\r\n]+)/);if(!match)throw Error(output.match(/(?:Error|TimeoutError):[^\r\n]*/)?.[0]||"Browser failed");
   return {checks,realPostgres:true,browser:JSON.parse(match[1])};
  }finally{fs.rmSync(codePath,{force:true});}
 }finally{if(old===undefined)delete process.env.MORE_PATIENT_TEST_TOOLS;else process.env.MORE_PATIENT_TEST_TOOLS=old;if(env===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=env;}
}
