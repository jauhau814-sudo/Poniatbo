import {test,after} from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';process.env.DB_PATH=':memory:';
const {app}=await import('./index.mjs');
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
async function call(url,method='GET',body,cookie){return fetch(base+'/api/'+url,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});}
after(()=>server.close());
test('accounts, isolation, progress persistence, logout and deletion',async()=>{
 assert.equal((await call('progress')).status,401);
 const a=await call('auth/register','POST',{username:'ученик1',password:'password123',name:'Анна'});assert.equal(a.status,200);const ca=a.headers.get('set-cookie').split(';')[0];assert.match(a.headers.get('set-cookie'),/HttpOnly/);
 assert.equal((await call('auth/register','POST',{username:'ученик1',password:'password123',name:'Анна'})).status,409);
 assert.equal((await call('auth/login','POST',{username:'ученик1',password:'wrongpass'})).status,401);
 const p={grade:7,results:{fractions:{cards:{0:{done:true}}}}};assert.equal((await call('progress','PUT',p,ca)).status,200);
 assert.deepEqual(await (await call('progress','GET',null,ca)).json(),p);
 const b=await call('auth/register','POST',{username:'ученик2',password:'password123',name:'Иван'});const cb=b.headers.get('set-cookie').split(';')[0];assert.deepEqual((await (await call('progress','GET',null,cb)).json()).results,{});
 assert.equal((await call('analysis','POST',{text:'abc',grade:7,confirmed:false},ca)).status,400);
 assert.equal((await call('ocr','POST',{images:['data:image/png;base64,YWJj']},ca)).status,400);
 assert.equal((await fetch(base+'/.env')).status,404);
 assert.equal((await fetch(base+'/server/index.mjs')).status,404);
 const cross=await fetch(base+'/api/progress',{method:'PUT',headers:{origin:'https://other.example','Content-Type':'application/json',cookie:ca},body:JSON.stringify(p)});assert.equal(cross.status,403);
 await call('auth/logout','POST',{},ca);assert.equal((await call('me','GET',null,ca)).status,401);
 const login=await call('auth/login','POST',{username:'ученик1',password:'password123'});const c=login.headers.get('set-cookie').split(';')[0];assert.deepEqual(await(await call('progress','GET',null,c)).json(),p);
 await call('me','DELETE',{},c);assert.equal((await call('me','GET',null,c)).status,401);
});
test('AI schema failure and provider errors are explicit',async()=>{
 const {generate}=await import('./ai.mjs');const original=globalThis.fetch;const old=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test';
 try{globalThis.fetch=async()=>new Response('{}',{status:429});await assert.rejects(generate('ocr',[]),/Лимит/);
 globalThis.fetch=async()=>Response.json({candidates:[{content:{parts:[{text:'{}'}]}}]});await assert.rejects(generate('analysis',[]),/неполный/);
 }finally{globalThis.fetch=original;if(old)process.env.GEMINI_API_KEY=old;else delete process.env.GEMINI_API_KEY;}
});
test('analysis is saved, isolated and deleted through API',async()=>{
 const r=await call('auth/register','POST',{username:'historyuser',password:'password123',name:'История'});const c=r.headers.get('set-cookie').split(';')[0];
 const other=await call('auth/register','POST',{username:'otherhistory',password:'password123',name:'Другой'});const c2=other.headers.get('set-cookie').split(';')[0];
 const real=globalThis.fetch,old=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test';
 const report={summary:'Ошибка знака.',errors:[{fragment:'3x=19+4',problem:'Неверный знак.',correction:'3x=15, x=5',topic:'Уравнения'}],topics:[{title:'Перенос слагаемых',reason:'Ошибка знака',practice:'Реши 2x+3=7'}],limitations:[]};
 globalThis.fetch=(url,options)=>String(url).startsWith('https://generativelanguage.googleapis.com/')?Promise.resolve(Response.json({candidates:[{content:{parts:[{text:JSON.stringify(report)}]}}]})):real(url,options);
 try{const result=await call('analysis','POST',{text:'3x+4=19;3x=23',confirmed:true,grade:6},c);assert.equal(result.status,200);const work=await result.json();assert.deepEqual(work.report,report);assert.equal((await(await call('works','GET',null,c)).json()).length,1);assert.equal((await(await call('works','GET',null,c2)).json()).length,0);await call('works/'+work.id,'DELETE',{},c2);assert.equal((await(await call('works','GET',null,c)).json()).length,1);await call('works/'+work.id,'DELETE',{},c);assert.equal((await(await call('works','GET',null,c)).json()).length,0);
 }finally{globalThis.fetch=real;if(old)process.env.GEMINI_API_KEY=old;else delete process.env.GEMINI_API_KEY;}
});
