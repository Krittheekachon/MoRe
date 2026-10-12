// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async(page)=>{
 const fixture=null /*FIXTURE*/; const origin="https://localhost:3000";const context=await page.context().browser().newContext({ignoreHTTPSErrors:true,viewport:{width:820,height:1180}});
 const p=await context.newPage();let checks=0;const errors=[];const check=(c,s)=>{if(!c)throw Error(s);checks++;};
 p.on("console",m=>{if(m.type()==="error"&&/hydrat|didn't match/i.test(m.text()))errors.push(m.text());});
 try{
  const account=fixture.accounts[0];check((await context.request.post(`${origin}/api/auth/login`,{headers:{Origin:origin},data:{nationalId:account.nationalId,password:account.password}})).ok(),"fixture login");
  const url=`${origin}/patient/progress?date=2026-10-12`;await p.goto(url);await p.waitForLoadState("networkidle");
  check(await p.getByRole("heading",{name:"ความก้าวหน้า",exact:true}).count()===1,"overview entry");
  check((await p.locator(`#progress-${fixture.dailyId}`).innerText()).includes("ทำ 5 ครั้ง · ถูก 4 ครั้ง"),"actual accumulated totals");
  await p.screenshot({path:"output/playwright/progress-overview-820.png",fullPage:true});
  const api=await context.request.get(`${origin}/api/patient/progress/${fixture.dailyId}`);check(api.ok(),"detail API");check((await api.json()).selected.id===fixture.dailyId,"correct selected id");
  check((await context.request.get(`${origin}/api/patient/progress/${fixture.otherId}`)).status()===404,"other patient detail denied");
  const otherPage=await context.newPage();await otherPage.goto(`${origin}/patient/progress/exercises/${fixture.otherId}`);await otherPage.waitForLoadState("networkidle");check((await otherPage.title()).includes("404")||(await otherPage.innerText('body')).includes("ไม่พบ")||(await otherPage.innerText('body')).includes("404"),"other patient page denied");await otherPage.close();
  await p.locator(`#progress-${fixture.dailyId}`).getByRole("link",{name:"ดูรายละเอียด"}).click();await p.waitForURL(`**/patient/progress/exercises/${fixture.dailyId}?**`);await p.waitForLoadState("networkidle");check(new URL(p.url()).pathname.endsWith(`/${fixture.dailyId}`),"detail route identity");
  check((await p.locator('#progress-results').innerText()).includes("162.0°"),"weighted peak average shown");
  check(await p.locator('#progress-chart svg').count()===1&&await p.locator('#progress-results').count()===1,"chart and results one page");
  const graph=p.locator('#progress-chart');
  check(await graph.locator('g[data-metric]').count()===2,"all shows two series");
  check((await graph.locator('svg').getAttribute('aria-label')).includes('2026-10-12: 5')&&(await graph.locator('svg').getAttribute('aria-label')).includes('2026-10-12: 4'),"saved total and correct series");
  await graph.getByRole('button',{name:'จำนวนครั้งที่ทำถูก',exact:true}).click();check(await graph.locator('g[data-metric="correct"]').count()===1&&await graph.locator('g[data-metric="count"]').count()===0,"correct filter");
  await graph.getByRole('button',{name:'จำนวนครั้งที่ทำได้',exact:true}).click();check(await graph.locator('g[data-metric="count"]').count()===1&&await graph.locator('g[data-metric="correct"]').count()===0,"total filter");
  await graph.getByRole('button',{name:'ทั้งหมด',exact:true}).click();check(await graph.locator('g[data-metric]').count()===2,"restore both series");
  check(Number(await graph.locator('g[data-metric="count"] circle').first().getAttribute('cx'))===45,"first recorded date starts left");
  const historyData=(await(await context.request.get(`${origin}/api/patient/progress`)).json()).days;
  const latestHistoryDate=historyData.filter(d=>d.sets.length).map(d=>d.date).sort().at(-1);
  const older=historyData.find(d=>d.date<latestHistoryDate&&d.sets.length);
  check(await p.locator('#progress-history').getByRole('link',{name:'ดูรายละเอียด'}).count()>0,"history entries available");
  if(older){
   await p.goto(`${origin}/patient/progress?date=${latestHistoryDate}`);await p.waitForLoadState('networkidle');
   await p.locator(`#progress-history a[href*="/exercises/${older.id}?"]`).click();await p.waitForURL(`**/exercises/${older.id}?**`);await p.waitForLoadState('networkidle');
   check(new URL(p.url()).pathname.endsWith(`/${older.id}`),"previous day selected by actual ID");
   check((await p.locator('#progress-results').innerText()).includes(`ทำ ${older.count}`)||(await p.locator('#progress-results').innerText()).includes(String(older.count)),"previous day result shown");
   await p.goto(`${origin}/patient/progress/exercises/${fixture.dailyId}?date=2026-10-12`);await p.waitForLoadState('networkidle');
  }
  await p.reload();await p.waitForLoadState("networkidle");check((await p.locator('#progress-results').innerText()).includes("162.0°"),"direct refresh data");
  await p.getByRole("link",{name:"กลับหน้าภาพรวม"}).click();await p.waitForURL("**/patient/progress?**");await p.waitForLoadState("networkidle");check(new URL(p.url()).searchParams.get("date")==="2026-10-12","return filters");
  await p.goto(`${origin}/patient/progress?date=2026-10-12&scope=test`);await p.waitForLoadState("networkidle");check(await p.locator(`#progress-${fixture.dailyId}`).count()===1,"legacy scope ignored");
  for(const [width,height] of [[390,844],[820,1180],[1180,820],[1440,900]])for(const theme of ["light","dark"])for(const size of ["m","l","xl"]){
   await p.setViewportSize({width,height});await context.addCookies([{name:"more-theme",value:theme,domain:"localhost",path:"/"},{name:"more-font-size",value:size,domain:"localhost",path:"/"}]);
   for(const route of [url,`${origin}/patient/progress/exercises/${fixture.dailyId}?date=2026-10-12`]){
    await p.goto(route);await p.waitForLoadState("networkidle");check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`no overflow ${width}/${theme}/${size}`);
    check(await p.evaluate(({theme,size})=>document.documentElement.dataset.theme===theme&&document.documentElement.dataset.size===size,{theme,size}),"theme and size applied");
   }
   if(theme==="light"&&size==="m")await p.screenshot({path:`output/playwright/progress-detail-${width}.png`,fullPage:true});
  }
  const days=(await(await context.request.get(`${origin}/api/patient/progress`)).json()).days;const blank=days.find(d=>!d.sets.length);if(blank){await p.goto(`${origin}/patient/progress/exercises/${blank.id}`);await p.waitForLoadState("networkidle");check((await p.locator('#progress-results').innerText()).includes("ยังไม่มีข้อมูลมุมที่บันทึก"),"missing angle empty state");}
  check(errors.length===0,"hydration warnings");return {checks,responsiveCombinations:24,hydrationWarnings:errors.length,realIPad:false};
 }finally{await context.close();}
}
