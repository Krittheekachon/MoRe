import assert from "node:assert/strict";
import fs from "node:fs";
import {createJiti} from "jiti";
const jiti=createJiti(import.meta.url);
const {TrainingAudioController}=await jiti.import("../src/lib/audio/controller.ts");
const {KneeAudio}=await jiti.import("../src/lib/audio/knee-audio.ts");
const {audioConfig,soundPath,globalSounds,kneeSounds}=await jiti.import("../src/lib/audio/catalog.ts");
async function waitUntil(test){const deadline=performance.now()+800;while(!test()&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,2));}
let checks=0; const check=(value)=>{assert.ok(value);checks++;};
for(const voice of ["male","female"]){
 for(const event of [...Object.keys(globalSounds),...Object.keys(kneeSounds),...Array.from({length:20},(_,i)=>i+1)]){check(fs.existsSync("public"+soundPath(voice,event)));}
}
check(soundPath("male",1).endsWith("rep_count_01.mp3"));check(soundPath("female",21)===null);
check(fs.existsSync("public/audio/shared/Whistle Sound Effect Ringtone.mp3"));
let time=0;const calls=[];
const media={src:"",currentTime:0,muted:false,onended:null,onerror:null,pause(){},play(){calls.push(this.src);return Promise.resolve();}};
const player=new TrainingAudioController(()=>media,()=>time);
const guidance=player.play("camera");check(await player.play("camera")===false);check(calls.length===1);
const rep=player.play(1,5);check(await guidance===false);check(await player.play("posture")===false);media.onended();check(await rep===true);
const next=player.play("posture");media.onended();await next;time=4999;check(await player.play("posture")===false);time=5000;
const repeated=player.play("posture");media.onended();check(await repeated===true);
const canceled=player.play(2,5);player.configure(true,"male");check(await canceled===false);
media.play=()=>Promise.reject(new Error("blocked"));check(await player.play(3,5)===false);
player.configure(false,"male");check(await player.play("ready",4)===false);
const events=[];const fake={play:async(event)=>{events.push(event);return true;},stop(){},cancel(){},cancelGuidance(){}};
const adapter=new KneeAudio(fake);audioConfig.countdownStepMs=1;
adapter.updatePreparation(true,performance.now(),1000);
await waitUntil(()=>adapter.ready);check(adapter.ready);check(events.join(",")==="ready,5,4,3,2,1,whistle");
adapter.reset(0);events.length=0;adapter.movement(1,false,true,90,160,0);adapter.movement(1,false,true,90,160,100);check(events.join(",")==="1");
adapter.reset(1);events.length=0;adapter.movement(2,false,true,90,160,200);check(events[0]===2);
adapter.reset(0);events.length=0;adapter.movement(0,true,true,145,160,0);adapter.movement(0,true,true,145,160,2000);check(events[0]==="encourage");
adapter.movement(0,true,true,145,160,9000);check(events.length===1);
adapter.movement(0,true,false,145,160,9100);adapter.movement(0,true,true,145,160,9200);adapter.movement(0,true,true,145,160,12000);check(events.length===1);
for(const angle of [139,151]){adapter.reset(0);events.length=0;adapter.movement(0,true,true,angle,160,0);adapter.movement(0,true,true,angle,160,3000);check(events.length===0);}
for(const angle of [140,150]){adapter.reset(0);events.length=0;adapter.movement(0,true,true,angle,160,0);adapter.movement(0,true,true,angle,160,2000);check(events[0]==="encourage");}
adapter.movement(0,false,true,90,160,2100);adapter.movement(0,true,true,145,160,2200);adapter.movement(0,true,true,145,160,4200);check(events.length===2);
adapter.reset(0);events.length=0;adapter.movement(0,true,true,145,160,0);adapter.movement(0,true,true,130,160,100);adapter.movement(0,true,true,130,160,2200);check(events.length===0);
adapter.reset();events.length=0;adapter.updatePreparation(true,performance.now(),1000);adapter.updatePreparation(false,performance.now(),1000);await new Promise(resolve=>setTimeout(resolve,10));check(!adapter.ready);check(!events.includes("whistle"));
// Lose preparation specifically while the spoken 5 is in flight.
let releaseFive; const canceledEvents=[];
const stalled=new KneeAudio({...fake,play:async(event)=>{canceledEvents.push(event);if(event===5)await new Promise(resolve=>{releaseFive=resolve;});return true;}});
stalled.updatePreparation(true,performance.now(),1000);
await new Promise(resolve=>setTimeout(resolve,2));check(stalled.remaining===5);
check(stalled.updatePreparation(false,performance.now(),1000,{message:"งอเข่ากลับสู่ท่าเริ่มต้น",missing:false})===false);
check(stalled.remaining===null);check(canceledEvents.at(-1)==="posture");
releaseFive();await new Promise(resolve=>setTimeout(resolve,10));
check(!canceledEvents.includes(4)&&!canceledEvents.includes("whistle"));check(!stalled.ready);
stalled.updatePreparation(true,performance.now(),1000);
await new Promise(resolve=>setTimeout(resolve,2));releaseFive();await waitUntil(()=>stalled.ready);
check(stalled.ready);check(stalled.updatePreparation(false,performance.now(),1000)===false);
// A browser that never fires ended on numbers or the whistle cannot hold 1.
const silentMedia={...media,src:"",onended:null,onerror:null,play:()=>Promise.resolve()};
const watchdogPlayer=new TrainingAudioController(()=>silentMedia);
const watchdog=new KneeAudio(watchdogPlayer);
const oldTimeout=audioConfig.countdownAudioTimeoutMs;audioConfig.countdownAudioTimeoutMs=2;
watchdog.updatePreparation(true,performance.now(),1000);
await new Promise(resolve=>setTimeout(resolve,2));silentMedia.onended(); // ready prompt completes normally
await waitUntil(()=>watchdog.ready);
check(watchdog.ready);check(watchdog.remaining===null);
check(silentMedia.src.endsWith("Whistle Sound Effect Ringtone.mp3"));
check(watchdog.updatePreparation(true,performance.now(),1000)===true);
watchdog.reset();audioConfig.countdownAudioTimeoutMs=oldTimeout;
watchdog.setPaused(true);watchdog.resetForNewSet(true);
check(!watchdog.paused);check(!watchdog.ready&&watchdog.remaining===null);
watchdog.resetForNewSet(false);check(watchdog.paused);
console.log(JSON.stringify({checks,pathsVerified:56,physicalDeviceTested:false}));
