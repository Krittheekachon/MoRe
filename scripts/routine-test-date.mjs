import { rm } from "node:fs/promises";
import path from "node:path";
const date=process.argv[2];
const file=path.resolve(".demo/routine-test-date.json");
if(date==="off") {
  await rm(file,{force:true});console.log("Routine test date disabled; real Bangkok date restored.");
} else {
  console.error("Global date override is retired. Sign in as the test patient and open /patient?testTools=1; dates are scoped to that account session.");
  process.exitCode=1;
}
