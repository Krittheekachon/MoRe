// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async sessionPage => {
 const context=await sessionPage.context().browser().newContext({ignoreHTTPSErrors:true});
 const page=await context.newPage();const origin="https://localhost:3000";let checks=0;
 const check=(value,label)=>{if(!value)throw Error(label);checks++;};
 const errors=[];page.on("console",m=>{if(m.type()==="error"&&m.text().includes("hydr"))errors.push(m.text());});page.on("pageerror",e=>errors.push(e.message));
 const global=["camera-ankle","ready_for_countdown","move_into_camera_view",...Array.from({length:20},(_,i)=>`rep_count_${String(i+1).padStart(2,"0")}`)];
 const knee=["exercise_intro","adjust_camera_position","improve_tracking_visibility","correct_seated_posture","turn_side_to_camera","encourage_knee_extension"];
 for(const voice of ["male","female"])for(const [folder,names] of [["global",global],["seated-knee-extension",knee]])for(const name of names){check((await context.request.get(`${origin}/audio/more-${voice}/${folder}/${name}.mp3`)).ok(),"MP3 HTTP path");}
 check((await context.request.get(origin+"/audio/shared/Whistle Sound Effect Ringtone.mp3")).ok(),"whistle path");
 await page.goto(origin);await page.getByRole("button",{name:"การแสดงผล",exact:true}).click();
 await page.getByLabel("เปิดเสียง",{exact:false}).uncheck();await page.getByText("เสียงชาย",{exact:true}).click();await page.getByRole("button",{name:"เสร็จสิ้น",exact:true}).click();
 await page.reload();await page.getByRole("button",{name:"การแสดงผล",exact:true}).click();check(!await page.getByLabel("เปิดเสียง",{exact:false}).isChecked(),"mute persists");check(await page.locator('input[name="training-voice"]').first().isChecked(),"male persists");
 await page.getByLabel("เปิดเสียง",{exact:false}).check();await page.getByRole("button",{name:"เสร็จสิ้น",exact:true}).click();
 await page.addInitScript(()=>{
   window.__played=[];const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__played.push({src:this.src,muted:this.muted});window.__lastAudio=this;return original.apply(this,args);};
   Object.defineProperty(navigator.mediaDevices,"getUserMedia",{value:async()=>{const canvas=document.createElement("canvas");canvas.width=640;canvas.height=480;const ctx=canvas.getContext("2d");setInterval(()=>{ctx.fillStyle="#888";ctx.fillRect(0,0,640,480);},100);return canvas.captureStream(10);}});
 });
 await page.locator("#national-id").fill("dev");await page.locator("#password").fill("password");await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();await page.waitForURL("**/developer");await page.reload();
 await page.getByRole("button",{name:"ซ้าย",exact:true}).click();await page.getByRole("button",{name:"เปิดกล้อง",exact:true}).click();
 await page.waitForFunction(()=>window.__played.some(p=>p.src.endsWith("exercise_intro.mp3")),{timeout:60000});
 check(await page.evaluate(()=>window.__played.filter(p=>p.src.endsWith("exercise_intro.mp3")).length===1),"one intro per open");
 await page.waitForFunction(()=>window.__lastAudio.currentTime>0&&!window.__lastAudio.muted,{timeout:20000});check(true,"real browser MP3 playback advances");
 await page.getByRole("button",{name:"การแสดงผล",exact:true}).click();await page.getByText("เสียงหญิง",{exact:true}).click();await page.waitForFunction(()=>window.__lastAudio.paused);check(true,"voice switch stops old audio");
 for(const [width,height] of [[390,844],[834,1194],[1194,834],[1440,900]]){await page.setViewportSize({width,height});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"settings do not overflow");}
 await page.getByRole("button",{name:"เสร็จสิ้น",exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector(".pose-primary-actions button").disabled,{timeout:60000});
 await page.getByRole("button",{name:"รีเซ็ตผลทดสอบ",exact:true}).click();
 await page.waitForFunction(()=>window.__lastAudio.src.includes("move_into_camera_view.mp3")&&!window.__lastAudio.paused,{timeout:10000});check(true,"reset restores guidance audio without reopening camera");
 check(await page.getByRole("button",{name:"ปิดกล้อง",exact:true}).count()===1,"reset retains open camera");
 await page.getByRole("button",{name:"เริ่ม",exact:true}).click();await page.getByRole("button",{name:"หยุด",exact:true}).click();
 check(await page.evaluate(()=>window.__lastAudio.paused),"pause stops audio");
 await page.getByRole("button",{name:"ปิดกล้อง",exact:true}).click();check(await page.evaluate(()=>window.__lastAudio.paused),"close stops audio");
 check(errors.length===0,"no hydration or page errors");
 await context.close();return {checks,physicalDeviceTested:false,humanPoseSequenceTested:false};
}
