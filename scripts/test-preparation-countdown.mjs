import assert from "node:assert/strict";
import path from "node:path";
import {createJiti} from "jiti";
const {PreparationCountdown}=await createJiti(import.meta.url).import(path.resolve("src/lib/pose/preparation-countdown.ts"));
const c=new PreparationCountdown();let checks=0;
function check(a,b){assert.deepEqual(a,b);checks++;}
check(c.update(false,0,1000),{allowed:false,remaining:null});
for(let i=0;i<50;i++){const r=c.update(true,100+i*100,1000);check(r.allowed,false);check(r.remaining,5-Math.floor(i/10));}
check(c.update(true,5100,1000),{allowed:true,remaining:null});
check(c.update(false,5200,1000),{allowed:true,remaining:null}); // Once per start, not per rep.
c.reset();check(c.update(true,6000,1000).remaining,5);
check(c.update(false,6100,1000).remaining,null);check(c.update(true,6200,1000).remaining,5);
check(c.update(true,8000,1000).remaining,5); // No countdown through missing frames.
c.reset();check(c.update(true,9000,1000).remaining,5);
check(c.update(true,9000,1000).allowed,false);check(c.update(true,9100,1000).remaining,5);
console.log(JSON.stringify({countdownChecks:checks}));
