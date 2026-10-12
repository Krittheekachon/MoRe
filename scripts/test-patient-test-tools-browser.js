// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async(page)=>{
 const accounts=null /*FIXTURES*/; const origin="https://localhost:3000";let checks=0;const errors=[]; const contexts=[];
 const check=(c,s)=>{if(!c)throw new Error(s);checks++;};
 try {
  for(const a of accounts){const c=await page.context().browser().newContext({ignoreHTTPSErrors:true});contexts.push(c);check((await c.request.post(`${origin}/api/auth/login`,{headers:{Origin:origin},data:{nationalId:a.nationalId,password:a.password}})).ok(),"login");}
  const c=contexts[0], other=contexts[1]; const api=(data)=>c.request.post(`${origin}/api/patient/test-tools`,{headers:{Origin:origin},data});
  check((await api({action:"date",date:"2026-02-30"})).status()===400,"invalid date blocked");
  const otherDate=(await (await other.request.get(`${origin}/api/patient/test-tools`)).json()).date;
  await api({action:"date",date:"2026-10-12"});check((await(await c.request.get(`${origin}/api/patient/training/today`)).json()).date==="2026-10-12","backend override");
  check((await(await other.request.get(`${origin}/api/patient/test-tools`)).json()).date===otherDate,"session isolation");
  const p=await c.newPage();p.on("console",m=>{if(m.type()==="error"&&/hydrat|didn't match/i.test(m.text()))errors.push(m.text());});
  await p.goto(`${origin}/patient?testTools=1`);await p.waitForLoadState("networkidle");await p.reload();await p.waitForLoadState("networkidle");
  check(await p.getByRole("heading",{name:"เครื่องมือทดสอบ",exact:true}).count()===1,"panel present");
  check((await p.locator('.test-date-banner').innerText()).includes("2026-10-12"),"date banner");
  await p.getByRole("button",{name:"วันถัดไป",exact:true}).click();await p.waitForLoadState("networkidle");await p.waitForFunction(()=>document.querySelector('.test-date-banner')?.textContent.includes('2026-10-13'));
  check((await(await c.request.get(`${origin}/api/patient/training/today`)).json()).date==="2026-10-13","next day frontend/backend agree");
  await api({action:"date",date:"2026-10-12"});await p.reload();await p.waitForLoadState("networkidle");
  check((await(await c.request.get(`${origin}/api/patient/training/today`)).json()).date==="2026-10-12","return day");
  check((await api({action:"clear",date:"2026-10-11",scope:"day",confirmation:"CLEAR_MY_TRAINING"})).status()===409,"stale date blocked");
  check((await api({action:"clear",date:"2026-10-12",scope:"all"})).status()===400,"confirmation required");
  check((await api({action:"clear",patientId:123,date:"2026-10-12",scope:"all",confirmation:"CLEAR_MY_TRAINING"})).status()===400,"cannot choose another patient");
  await p.getByRole("button",{name:"เคลียร์ข้อมูลการฝึก",exact:true}).click();check(await p.getByRole("dialog").isVisible(),"confirmation dialog");await p.getByRole("button",{name:"ยกเลิก",exact:true}).click();
  check((await api({action:"clear",date:"2026-10-12",scope:"day",confirmation:"CLEAR_MY_TRAINING"})).ok(),"own day API clear");
  check((await api({action:"clear",date:"2026-10-12",scope:"all",confirmation:"CLEAR_MY_TRAINING"})).ok(),"own all API clear");
  for(const [width,height] of [[390,844],[820,1180],[1180,820],[1440,900]]) {await p.setViewportSize({width,height});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"responsive overflow");await p.locator('.patient-test-tools').scrollIntoViewIfNeeded();check(await p.locator('.patient-test-tools').isVisible(),"panel in flow");}
  await api({action:"real"});await p.goto(`${origin}/patient`);await p.waitForLoadState("networkidle");check(await p.locator('.patient-test-tools,.test-date-banner').count()===0,"normal UI restored");
  check((await(await c.request.get(`${origin}/api/patient/test-tools`)).json()).simulated===false,"override cleared");check(errors.length===0,"hydration warnings");
  const anon=await page.context().browser().newContext({ignoreHTTPSErrors:true});contexts.push(anon);check((await anon.request.get(`${origin}/api/patient/test-tools`)).status()===401,"anonymous denied");
  return {checks,hydrationWarnings:errors.length,realIPad:false};
 }finally{for(const c of contexts)await c.close();}
}
