// Run with Playwright CLI against the existing development camera-test server.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async sessionPage => {
 const origin=new URL(sessionPage.url()).origin, context=await sessionPage.context().browser().newContext();const page=await context.newPage();let checks=0;const errors=[];
 const check=(v,l)=>{if(!v)throw Error(l);checks++};
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/hydration|hydrated|didn't match/i.test(m.text()))errors.push(m.text())});
 await context.addCookies([{name:'more-audio-enabled',value:'0',url:origin}]);
 check((await context.request.post(origin+'/api/auth/login',{headers:{Origin:origin},data:{nationalId:'dev',password:'password'}})).ok(),'developer login');
 await page.addInitScript(()=>{
 window.__poseTest={alive:0,max:0,angle:90,visible:true,bad:false,ankleBad:false,models:[]};
 Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{const c=document.createElement('canvas');c.width=640;c.height=640;const timer=setInterval(()=>{c.getContext('2d').fillRect(0,0,640,640)},60);const stream=c.captureStream(10);window.__poseTrack=stream.getVideoTracks()[0];window.__poseTrack.addEventListener('ended',()=>clearInterval(timer));return stream;}});
 window.Worker=class{onmessage;onerror;closed=false;postMessage(m){if(m.type==='init'){window.__poseTest.alive++;window.__poseTest.max=Math.max(window.__poseTest.max,window.__poseTest.alive);window.__poseTest.models.push(m.model);setTimeout(()=>this.onmessage?.({data:{type:'ready'}}),10)}if(m.type==='close'){this.closed=true;setTimeout(()=>{window.__poseTest.alive--;this.onmessage?.({data:{type:'closed'}})},30)}if(m.type==='frame'){const p=Array.from({length:33},()=>({x:.5,y:.5,z:0,visibility:0}));for(const [h,k,a,sh]of [[23,25,27,11],[24,26,28,12]]){const t=(180-window.__poseTest.angle)*Math.PI/180;p[h]={x:.35,y:.5,z:0,visibility:1};p[k]={x:.55,y:.5,z:0,visibility:1};p[a]={x:.55+.2*Math.cos(t),y:.5+.2*Math.sin(t),z:0,visibility:1};p[sh]={x:.35,y:.3,z:0,visibility:1};p[a+2]={...p[a],x:p[a].x-.03,y:p[a].y+.02};p[a+4]={...p[a],x:p[a].x+.06,y:p[a].y+.02};}if(window.__poseTest.ankleBad)p[27].y-=.08;if(window.__poseTest.bad)p[23].y=.15;if(!window.__poseTest.visible)for(const v of p)v.visibility=0;m.bitmap.close();setTimeout(()=>{if(!this.closed)this.onmessage?.({data:{type:'pose',points:p,world:[],timestamp:m.timestamp,at:m.at,width:640,height:640,inferenceMs:8}})},5)}}terminate(){}};
 });
 const mutations=[];page.on('request',r=>{if(r.url().includes('/api/patient/')&&r.method()!=='GET')mutations.push(r.url())});
 try{
 for(const [w,h]of [[390,844],[820,1180],[1180,820],[1440,900]]){await page.setViewportSize({width:w,height:h});await page.goto(origin+'/developer');await page.waitForLoadState('networkidle');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'fits');await page.reload();await page.waitForLoadState('networkidle');check(await page.locator('.pose-chain-check').count()===0,'no preflight until camera')}
 await page.locator('.developer-controls select').selectOption('full');await page.getByRole('button',{name:'ซ้าย',exact:true}).click();await page.getByRole('button',{name:'เปิดกล้อง',exact:true}).click();await page.locator('.pose-chain-check').waitFor();
 for(const [w,h]of [[390,844],[820,1180],[1180,820],[1440,900]]){await page.setViewportSize({width:w,height:h});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'preflight fits');await page.screenshot({path:'output/playwright/pose-preflight-'+w+'.png'});}
 check(await page.locator('.pose-chain-check button').count()===0,'no manual confirmation button');check(await page.getByRole('button',{name:'เริ่ม',exact:true}).isEnabled(),'start arms automatic preparation');
 check(await page.locator('.camera-summary strong').first().innerText()==='0 / 5','preview does not count');await page.evaluate(()=>window.__poseTest.visible=false);
 await page.getByRole('button',{name:'เริ่ม',exact:true}).click();await page.getByRole('button',{name:'หยุด',exact:true}).waitFor();await page.waitForTimeout(1200);
 check(await page.locator('.pose-chain-check').count()===1,'unreliable pose does not auto acquire');check(await page.locator('.camera-summary strong').first().innerText()==='0 / 5','unreliable preparation no count');
 await page.evaluate(()=>window.__poseTest.visible=true);await page.waitForFunction(()=>!document.querySelector('.pose-chain-check'));check(true,'valid preparation automatically acquired');check(await page.locator('.developer-controls select').isDisabled(),'cannot change model during training');
 await page.waitForTimeout(350);await page.evaluate(()=>window.__poseTest.visible=false);await page.waitForTimeout(650);
 check((await page.locator('.pose-tracking-card').innerText()).includes('เตรียมเริ่มใน')===false,'tracking loss cancels countdown');check(await page.locator('.camera-summary strong').first().innerText()==='0 / 5','loss during countdown does not count');
 await page.evaluate(()=>window.__poseTest.visible=true);await page.waitForTimeout(7000);
 for(const a of [...Array.from({length:15},(_,i)=>95+i*5),...Array(6).fill(165),...Array.from({length:15},(_,i)=>160-i*5),...Array(8).fill(90)]){await page.evaluate(a=>window.__poseTest.angle=a,a);await page.waitForTimeout(110)}
 check((await page.locator('.camera-summary strong').first().innerText()).startsWith('1 /'),'shared pipeline counts completed round: '+await page.locator('.pose-control-card').innerText()+' '+await page.locator('.pose-warning').allTextContents());
 await page.evaluate(()=>window.__poseTest.ankleBad=true);
 await page.getByText('ให้กล้องเห็นข้อเท้าข้างที่ฝึกชัดเจน',{exact:true}).waitFor();check(true,'ankle geometry has specific guidance');
 await page.waitForTimeout(700);check((await page.locator('.camera-summary strong').first().innerText()).startsWith('1 /'),'cuff motion cannot add count');
 await page.evaluate(()=>window.__poseTest.ankleBad=false);await page.waitForTimeout(1200);
 for(const a of [95,100,105,110,115,120,125,130,135,140]){await page.evaluate(a=>window.__poseTest.angle=a,a);await page.waitForTimeout(110)}await page.waitForTimeout(400);await page.evaluate(()=>{window.__poseTest.angle=165;window.__poseTest.bad=true});
 await page.getByText('ตรวจจับข้างที่ฝึกไม่ชัด กรุณาจัดตำแหน่งใหม่',{exact:true}).waitFor();check(true,'uncertain tracking warning');
 await page.evaluate(()=>{window.__poseTest.bad=false;window.__poseTest.angle=90});await page.waitForTimeout(1200);check((await page.locator('.camera-summary strong').first().innerText()).startsWith('1 /'),'cancel unfinished round preserves completed count');

 await page.getByRole('button',{name:'หยุด',exact:true}).click();await page.getByRole('button',{name:'เริ่ม',exact:true}).click();await page.getByRole('button',{name:'หยุด',exact:true}).waitFor();await page.getByRole('button',{name:'หยุด',exact:true}).click();check(true,'pause resume');
 await page.locator('.developer-controls select').selectOption('heavy');await page.locator('.pose-chain-check').waitFor();check(await page.getByRole('button',{name:'เริ่ม',exact:true}).isEnabled(),'model change requires automatic reacquisition after Start');check(await page.evaluate(()=>window.__poseTest.models.join(',')==='full,heavy'&&window.__poseTest.max===1),'one worker at a time');
 await page.getByRole('button',{name:'รีเซ็ตผลทดสอบ',exact:true}).click();await page.locator('.pose-chain-check').waitFor();check(await page.evaluate(()=>window.__poseTrack.readyState==='live'),'reset retains stream');check(await page.getByRole('button',{name:'เริ่ม',exact:true}).isEnabled(),'reset permits Start and automatic reacquisition');await page.getByRole('button',{name:'ปิดกล้อง',exact:true}).click();check(await page.evaluate(()=>window.__poseTrack.readyState==='ended'),'close stops stream');
 check(mutations.length===0,'developer/preflight no patient mutations');check(errors.length===0,'hydration and page errors');return {checks,hydrationErrors:errors.length,mockedWorker:true,physicalIPad:false};
 }finally{await context.close()}
}
