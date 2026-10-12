import fs from "node:fs";
import {execFileSync} from "node:child_process";
export async function verifyProgressBrowser(accounts,dailyId,otherId){
 const file="output/playwright/progress-fixture-code.js";
 fs.writeFileSync(file,fs.readFileSync("scripts/test-patient-progress-browser.js","utf8").replace("null /*FIXTURE*/",JSON.stringify({accounts,dailyId,otherId})),"utf8");
 try{const output=execFileSync(process.env.ComSpec,["/d","/s","/c",`npx.cmd --yes --package @playwright/cli playwright-cli -s=more-recording run-code --filename ${file}`],{encoding:"utf8",timeout:240000,maxBuffer:1000000});const result=output.match(/### Result\r?\n([^\r\n]+)/);if(!result)throw Error(output.match(/(?:Error|TimeoutError):[^\r\n]*/)?.[0]||"Progress browser verification failed");return JSON.parse(result[1]);}finally{fs.rmSync(file,{force:true});}
}
