// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async page => {
 const context=await page.context().browser().newContext({ignoreHTTPSErrors:true});
 const dev='https://localhost:3000',prod='http://localhost:3002';
 const login=await context.request.post(dev+'/api/auth/login',{headers:{Origin:dev},data:{nationalId:'dev',password:'password'}});if(!login.ok())throw Error('dev login failed');
 const denied=await context.request.post(prod+'/api/auth/login',{headers:{Origin:prod},data:{nationalId:'dev',password:'password'}});
 if(denied.status()!==401)throw Error('production login not denied');
 if((await context.request.get(prod+'/api/developer/criteria?side=left')).status()!==403)throw Error('dev cookie accepted in production API');
 if((await context.request.get(prod+'/developer')).status()!==404)throw Error('dev cookie accepted in production page');
 await context.close();return {productionChecks:3};
}