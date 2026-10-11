import assert from "node:assert/strict";
import { createJiti } from "jiti";
const jiti=createJiti(import.meta.url);
const {developerCredentials,developerEnabled}=await jiti.import('../src/lib/developer-policy.ts');
for (const env of ['production','test',undefined]) {
 if(env===undefined) continue;
 assert.equal(developerEnabled(env),false);
 assert.equal(developerCredentials('dev','password',env),false);
}
assert.equal(developerCredentials('dev','password','development'),true);
assert.equal(developerCredentials('dev','wrong','development'),false);
assert.equal(developerCredentials('DEV','password','development'),false);
assert.equal(developerCredentials('1234567890123','password','development'),false);
console.log('Developer policy: 8 assertions passed');