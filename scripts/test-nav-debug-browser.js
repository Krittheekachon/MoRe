async (sessionPage) => {
 const accounts=null /*ACCOUNTS*/;const browser=sessionPage.context().browser();let checks=0;
 const check=(v,label)=>{if(!v)throw Error('Nav debug: '+label);checks++;};
 const context=await browser.newContext({ignoreHTTPSErrors:true,isMobile:true,hasTouch:true});
 const page=await context.newPage();const origin='https://localhost:3000';const errors=[];
 page.on('console',m=>{if(m.type()==='error'&&/hydration|hydrated|didn't match/i.test(m.text()))errors.push('hydration');});
 page.on('pageerror',()=>errors.push('pageerror'));
 try{
  const login=await context.request.post(origin+'/api/auth/login',{headers:{Origin:origin},data:{nationalId:accounts.patients[0].nationalId,password:accounts.patients[0].password}});check(login.ok(),'managed demo login');
  for(const [width,height] of [[390,844],[834,1194],[1194,834]]){
   await page.setViewportSize({width,height});await page.goto(origin+'/patient');await page.waitForTimeout(900);
   check(await page.locator('.nav-debug-panel').count()===0,'off without query');
   const before=await page.evaluate(()=>({height:document.documentElement.scrollHeight,nav:document.querySelector('.app-sidebar').getBoundingClientRect().bottom,padding:getComputedStyle(document.querySelector('.app-main')).paddingBottom}));
   await page.goto(origin+'/patient?debugNav=1&token=DO_NOT_EXPORT&patient=DO_NOT_EXPORT');
   await page.locator('.nav-debug-panel').waitFor();
   const after=await page.evaluate(()=>({height:document.documentElement.scrollHeight,nav:document.querySelector('.app-sidebar').getBoundingClientRect().bottom,padding:getComputedStyle(document.querySelector('.app-main')).paddingBottom}));
   check(JSON.stringify(before)===JSON.stringify(after),'unchanged geometry');
   await page.getByRole('button',{name:'ปกติ',exact:true}).click();
   await page.evaluate(()=>window.scrollTo(0,550));await page.waitForTimeout(220);
   await page.getByRole('button',{name:'ลอย',exact:true}).click();
   const data=JSON.parse(await page.locator('.nav-debug-panel pre').textContent());
   check(!!data.snapshots['ปกติ']&&!!data.snapshots['ลอย'],'two snapshots');
   check(data.live.window.scrollY>0&&data.snapshots['ลอย'].window.scrollY>0,'scroll updates');
   check(data.live.scrollContainers.some(x=>x.documentScroller),'actual document scroller');
   check(data.live.visualViewport.height>0,'visualViewport');
   check(Math.abs(data.live.layoutGap-(data.live.window.innerHeight-data.live.navbar.rect.bottom))<0.01,'layout gap formula');
   check(Math.abs(data.live.visualGap-(data.live.visualViewport.offsetTop+data.live.visualViewport.height-data.live.navbar.rect.bottom))<0.01,'visual gap formula');
   check(data.live.ancestors.length>=3&&'backdropFilter' in data.live.ancestors[0].styles,'ancestors styles');
   check(!JSON.stringify(data).includes('DO_NOT_EXPORT')&&!JSON.stringify(data).includes(accounts.patients[0].nationalId),'private query and patient data absent');
   check(data.live.buildIdentifier.startsWith('nav-debug-v1/dev-config-'),'development build ID');
   await page.setViewportSize({width,height:height-120});await page.waitForTimeout(250);
   const resized=JSON.parse(await page.locator('.nav-debug-panel pre').textContent());check(resized.live.window.innerHeight===height-120,'resize updates');
   await page.reload();await page.locator('.nav-debug-panel').waitFor();check(true,'direct reload');
  }
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('blocked')}}}));
  await page.getByRole('button',{name:'คัดลอกข้อมูล',exact:true}).click();
  check(JSON.parse(await page.locator('.nav-debug-panel textarea').inputValue()).tool==='MoRe nav-debug-v1','HTTP/autoplay clipboard fallback');
  await page.evaluate(()=>history.pushState(null,'','/patient?debugNav=0'));await page.waitForTimeout(250);check(await page.locator('.nav-debug-panel').count()===0,'same-route query disables'); await page.evaluate(()=>history.pushState(null,'','/patient?debugNav=1'));await page.locator('.nav-debug-panel').waitFor();check(true,'same-route query enables'); await page.locator('.app-navigation a[href="/patient/profile"]').click();await page.waitForTimeout(600);
  check(await page.locator('.nav-debug-panel').count()===0,'navigation without query disables');
  check(await page.locator('body > div[aria-hidden="true"]').count()===0,'probe removed');
  check(errors.length===0,'no hydration/page errors');
  return {checks,physicalIPadTested:false};
 }finally{await context.close();}
}
