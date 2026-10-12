import fs from "node:fs";
import {execFileSync} from "node:child_process";
// Called only with a freshly created synthetic patient by test-routine.mjs.
export async function verifyRoutineBrowser(prisma,patientId,account,routineNow,ordinaryPatientId){
 const manifestPath=".demo/manifest.json",clockPath=".demo/routine-test-date.json",codePath="output/playwright/routine-code.js";
 const backup=file=>fs.existsSync(file)?fs.readFileSync(file):null;
 const manifestBackup=backup(manifestPath),clockBackup=backup(clockPath);
 const restore=(file,value)=>value===null?fs.rmSync(file,{force:true}):fs.writeFileSync(file,value);
 const profile=await prisma.patientProfile.findUniqueOrThrow({where:{patient_id:patientId}});
 const manifest=manifestBackup?JSON.parse(manifestBackup):{doctorId:0,exerciseId:0,patients:[]};
 manifest.patients.push({id:patientId,hn:profile.hn,lookup:profile.national_id_lookup});
 const run=code=>{
  fs.mkdirSync("output/playwright",{recursive:true});fs.writeFileSync(codePath,code);
  let output;
  try{output=execFileSync(process.env.ComSpec,["/d","/s","/c",`npx.cmd --yes --package @playwright/cli playwright-cli -s=more-recording run-code --filename ${codePath}`],{encoding:"utf8",timeout:100000,maxBuffer:1000000});}
  catch(error){throw Error(String(error.stdout||"").match(/(?:Error|TimeoutError):[^\r\n]*/)?.[0]||"Routine browser command failed");}
  const result=output.match(/### Result\r?\n([^\r\n]+)/);
  if(!result)throw Error(output.match(/(?:Error|TimeoutError):[^\r\n]*/)?.[0]||"Routine browser returned no result");
  return JSON.parse(result[1]);
 };
 const clock=date=>fs.writeFileSync(clockPath,JSON.stringify({date}));
 try{
  fs.writeFileSync(manifestPath,JSON.stringify(manifest));clock("1990-01-01");
  const real=new Date("2026-10-12T12:00:00Z"),environment=process.env.NODE_ENV;let policyChecks=0;
  try{
   process.env.NODE_ENV="development";
   if((await routineNow(patientId,real)).toISOString().slice(0,10)!=="1990-01-01")throw Error("verified demo clock");policyChecks++;
   if((await routineNow(ordinaryPatientId,real)).getTime()!==real.getTime())throw Error("ordinary patient clock");policyChecks++;
   process.env.NODE_ENV="production";
   if((await routineNow(patientId,real)).getTime()!==real.getTime())throw Error("production clock");policyChecks++;
  }finally{if(environment===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=environment;}
  clock("2026-10-12");
  const first=run(`async(page)=>{
   let checks=0;const check=(v,l)=>{if(!v)throw Error(l);checks++;};const errors=[];
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
   const origin='https://localhost:3000',account=${JSON.stringify(account)};
   const login=()=>page.context().request.post(origin+'/api/auth/login',{ignoreHTTPSErrors:true,headers:{Origin:origin},data:account});
   check((await login()).ok(),'login');
   for(const [width,height]of [[390,844],[820,1180],[1440,1000]]){
    await page.setViewportSize({width,height});await page.goto(origin+'/patient');await page.waitForLoadState('networkidle');
    check(await page.getByRole('meter').getAttribute('aria-valuenow')==='100','persisted routine');
    await page.reload();await page.waitForLoadState('networkidle');check(await page.getByRole('meter').getAttribute('aria-valuenow')==='100','refresh');
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow');
    await page.goto(origin+'/patient/progress');await page.waitForLoadState('networkidle');check(await page.getByRole('region',{name:'Routine ประจำวัน'}).getByText('Routine สำเร็จ 1 ครั้ง').count()===1,'real history');
   }
   check((await page.context().request.post(origin+'/api/auth/logout',{ignoreHTTPSErrors:true,headers:{Origin:origin},data:{}})).ok(),'logout');
   await page.goto(origin+'/patient');await page.waitForURL(url=>!url.pathname.startsWith('/patient'));check(!page.url().endsWith('/patient'),'logout blocks patient');
   check((await login()).ok(),'relogin');await page.goto(origin+'/patient');await page.waitForLoadState('networkidle');
   check(await page.getByRole('meter').getAttribute('aria-valuenow')==='100','relogin persisted');
   check(!errors.some(e=>/hydration|hydrated|didn.t match/i.test(e)),'hydration');return {checks,hydrationErrors:0};
  }`);
  clock("2026-10-13");
  const second=run(`async(page)=>{
   let checks=0;const check=(v,l)=>{if(!v)throw Error(l);checks++;};await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
   await page.waitForFunction(()=>document.querySelector('[role=meter]')?.getAttribute('aria-valuenow')==='0');check(true,'focus rollover');
   const today=await(await page.context().request.get('https://localhost:3000/api/patient/training/today',{ignoreHTTPSErrors:true})).json();
   check(today.date==='2026-10-13'&&today.percent===0,'server date consistent');
   await page.goto('https://localhost:3000/patient/progress');await page.waitForLoadState('networkidle');check(await page.getByText('Routine สำเร็จ 1 ครั้ง').count()===1,'previous history retained');
   await page.goto('https://localhost:3000/patient');await page.waitForLoadState('networkidle');return {checks};
  }`);
  clock("2026-10-14");
  const third=run(`async(page)=>{
   await page.waitForFunction(()=>document.querySelector('.page-heading')?.innerText.includes('14 ต.ค.'),{},{timeout:45000});
   const today=await(await page.context().request.get('https://localhost:3000/api/patient/training/today',{ignoreHTTPSErrors:true})).json();
   if(today.date!=='2026-10-14'||today.percent!==0)throw Error('poll rollover');return {checks:1};
  }`);
  return {checks:first.checks+second.checks+third.checks,clockPolicyChecks:policyChecks,hydrationErrors:first.hydrationErrors,browser:"Chromium",physicalIPad:false};
 }finally{restore(manifestPath,manifestBackup);restore(clockPath,clockBackup);fs.rmSync(codePath,{force:true});}
}
