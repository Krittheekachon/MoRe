// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async sessionPage => {
 const browser=sessionPage.context().browser(); const context=await browser.newContext({ignoreHTTPSErrors:true}); const page=await context.newPage(); const origin='https://localhost:3000'; let checks=0;
 const check=(value,label)=>{if(!value)throw Error(label);checks++;};
 check((await context.request.get(origin+'/api/developer/criteria?side=left')).status()===403,'anonymous developer API denied');
 check((await page.goto(origin+'/developer')).status()===404,'anonymous developer page denied');
 const wrong=await context.request.post(origin+'/api/auth/login',{headers:{Origin:origin},data:{nationalId:'dev',password:'wrong'}});check(wrong.status()===401,'wrong developer password denied');
 await page.goto(origin); await page.locator('#national-id').fill('dev'); await page.locator('#password').fill('password'); await page.getByRole('button',{name:'เข้าสู่ระบบ',exact:true}).click(); await page.waitForURL('**/developer'); check(true,'login UI accepts dev');
 check((await context.request.get(origin+'/api/developer/criteria?side=left')).ok(),'developer criteria allowed');
 check((await context.request.get(origin+'/api/patient/training/today')).status()>=400,'developer cannot access patient API');
 const errors=[]; page.on('console',m=>{if(m.type()==='error'&&m.text().includes('hydr'))errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[390,844],[834,1194],[1194,834],[1440,900]]){await page.setViewportSize({width,height});await page.reload();check(await page.getByRole('button',{name:'Debug ท่าทดสอบ',exact:true}).count()===1,'developer debug available');check(await page.getByRole('button',{name:'บันทึกเซต',exact:true}).count()===0,'developer has no save');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');await page.screenshot({path:'output/playwright/developer-'+width+'.png',fullPage:false});}
 check(errors.length===0,'direct loads no hydration/page errors');
 const mutations=[]; page.on('request',r=>{if(r.url().includes('/api/patient/')&&r.method()!=='GET')mutations.push(r.url());});
 await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const c=canvas.getContext('2d');setInterval(()=>{c.fillStyle='#888';c.fillRect(0,0,640,480);},100);const stream=canvas.captureStream(10);window.__devTrack=stream.getVideoTracks()[0];return stream;}});});
 await page.reload(); await page.getByRole('button',{name:'ซ้าย',exact:true}).click();await page.getByRole('button',{name:'เปิดกล้อง',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.pose-primary-actions button').disabled===false,{timeout:60000});
 await page.getByRole('button',{name:'Debug ท่าทดสอบ',exact:true}).click();await page.waitForFunction(()=>/inference [0-9]/.test(document.querySelector('.developer-controls').textContent));check((await page.locator('.developer-controls').innerText()).includes('inference'),'real runtime telemetry panel');
 await page.getByRole('button',{name:'เริ่ม',exact:true}).click();await page.getByRole('button',{name:'หยุด',exact:true}).click();await page.getByRole('button',{name:'รีเซ็ตผลทดสอบ',exact:true}).click();
 check(await page.evaluate(()=>window.__devTrack.readyState==='live'),'reset preserves camera');check(mutations.length===0,'developer never sends patient mutations');
 await page.getByRole('button',{name:'ปิดกล้อง',exact:true}).click();check(await page.evaluate(()=>window.__devTrack.readyState==='ended'),'camera released');
 await context.close(); return {checks,physicalDeviceTested:false,humanMovementTested:false};
}