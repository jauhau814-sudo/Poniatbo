import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,scryptSync,timingSafeEqual,createHash,randomUUID} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {z} from 'zod';
import {generate} from './ai.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
mkdirSync(path.join(root,'data'),{recursive:true});
const db=new DatabaseSync(process.env.DB_PATH||path.join(root,'data/site.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,name TEXT NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS progress(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS works(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,created INTEGER NOT NULL,text TEXT NOT NULL,report TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ai_cache(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,digest TEXT NOT NULL,result TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(user_id,kind,digest));`);
export const app=express();
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'blob:','data:'],fontSrc:["'self'"],connectSrc:["'self'"],workerSrc:["'self'",'blob:']}}}));
const limited=(req,res)=>res.status(429).json({error:'Слишком много запросов. Подожди и повтори позже.'});
app.use('/api',rateLimit({windowMs:60000,limit:120,handler:limited}));
app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');if(!['GET','HEAD'].includes(req.method)){const origin=req.get('origin');if((origin&&origin!==`${req.protocol}://${req.get('host')}`&&origin!==process.env.PUBLIC_ORIGIN)||!req.is('application/json'))return res.status(403).json({error:'Запрос отклонён.'});}next();});
app.use(express.json({limit:'46mb'}));
const hash=s=>createHash('sha256').update(s).digest('hex');
function session(req){const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('sid='))?.slice(4);return token&&db.prepare('SELECT users.id,users.name,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(hash(token),Date.now());}
function auth(req,res,next){req.user=session(req);if(!req.user)return res.status(401).json({error:'Войди в профиль.'});next();}
function cookie(res,token,age=604800){res.setHeader('Set-Cookie',`sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);}
const credentials=z.object({username:z.string().regex(/^[\p{L}\p{N}_.-]{3,32}$/u).transform(s=>s.toLowerCase()),password:z.string().min(8).max(128),name:z.string().trim().min(2).max(40).optional()});
const loginLimit=rateLimit({windowMs:900000,limit:30,handler:limited});
app.get('/api/health',(req,res)=>res.json({ok:true,aiConfigured:!!process.env.GEMINI_API_KEY,version:'ai-stable-2'}));
app.post('/api/auth/:action',loginLimit,(req,res,next)=>{try{
 if(req.params.action==='logout'){const raw=req.headers.cookie?.match(/(?:^|;\s*)sid=([^;]+)/)?.[1];if(raw)db.prepare('DELETE FROM sessions WHERE token=?').run(hash(raw));cookie(res,'',0);return res.json({ok:true});}
 if(!['login','register'].includes(req.params.action))return res.sendStatus(404);
 const b=credentials.parse(req.body);let user=db.prepare('SELECT * FROM users WHERE username=?').get(b.username);
 if(req.params.action==='register'){if(!b.name)return res.status(400).json({error:'Укажи имя.'});if(user)return res.status(409).json({error:'Логин занят.'});const salt=randomBytes(16).toString('hex');user={id:randomUUID(),name:b.name,username:b.username,salt,hash:scryptSync(b.password,salt,64).toString('hex')};db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(user.id,user.username,user.name,user.salt,user.hash);}
 else{const salt=user?.salt||'invalid-user-salt';const actual=scryptSync(b.password,salt,64);if(!user||!timingSafeEqual(actual,Buffer.from(user.hash,'hex')))return res.status(401).json({error:'Неверный логин или пароль.'});}
 const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),user.id,Date.now()+604800000);cookie(res,token);res.json({id:user.id,name:user.name,username:user.username});
 }catch(e){next(e);}});
app.get('/api/me',auth,(req,res)=>res.json(req.user));
app.delete('/api/me',auth,(req,res)=>{db.prepare('DELETE FROM users WHERE id=?').run(req.user.id);cookie(res,'',0);res.json({ok:true});});
app.get('/api/progress',auth,(req,res)=>res.json(JSON.parse(db.prepare('SELECT data FROM progress WHERE user_id=?').get(req.user.id)?.data||'{"grade":6,"results":{}}')));
app.put('/api/progress',auth,(req,res)=>{const b=z.object({grade:z.number().int().min(5).max(9),results:z.record(z.string().max(150),z.unknown())}).parse(req.body);const data=JSON.stringify(b);if(data.length>2000000)return res.status(413).json({error:'Слишком много данных.'});db.prepare('INSERT INTO progress VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').run(req.user.id,data);res.json({ok:true});});
const aiLimit=rateLimit({windowMs:3600000,limit:40,handler:limited,keyGenerator:req=>req.user.id});
const inflight=new Map();
function once(key,task){if(inflight.has(key))return inflight.get(key);const promise=Promise.resolve().then(task).finally(()=>inflight.delete(key));inflight.set(key,promise);return promise;}
function cacheGet(user,kind,digest){const row=db.prepare('SELECT result FROM ai_cache WHERE user_id=? AND kind=? AND digest=? AND created>?').get(user,kind,digest,Date.now()-86400000);return row?JSON.parse(row.result):null;}
function cachePut(user,kind,digest,result){db.prepare('DELETE FROM ai_cache WHERE created<?').run(Date.now()-86400000);db.prepare('INSERT INTO ai_cache VALUES(?,?,?,?,?) ON CONFLICT(user_id,kind,digest) DO UPDATE SET result=excluded.result,created=excluded.created').run(user,kind,digest,JSON.stringify(result),Date.now());}
app.post('/api/ocr',auth,aiLimit,async(req,res)=>{const b=z.object({images:z.array(z.string().max(12000000)).min(1).max(4)}).parse(req.body);const parts=b.images.map(image=>{const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image);if(!match)throw Object.assign(new Error('Нужен JPG, PNG или WEBP.'),{status:400});const bytes=Buffer.from(match[2],'base64');if(bytes.length>8*1024*1024)throw Object.assign(new Error('Фото больше 8 МБ.'),{status:413});const valid=match[1]==='image/jpeg'?bytes[0]===255&&bytes[1]===216:match[1]==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';if(!valid)throw Object.assign(new Error('Файл не соответствует формату изображения.'),{status:400});return {inlineData:{mimeType:match[1],data:match[2]}};});const digest=hash('ocr-v3:'+JSON.stringify(parts));const cached=cacheGet(req.user.id,'ocr',digest);if(cached)return res.json(cached);const result=await once(req.user.id+':ocr:'+digest,async()=>{const result=await generate('ocr',parts);if(result.readable)cachePut(req.user.id,'ocr',digest,result);return result;});res.json(result);});
app.post('/api/analysis',auth,aiLimit,async(req,res)=>{const b=z.object({text:z.string().trim().min(1).max(40000),confirmed:z.literal(true),grade:z.number().int().min(5).max(9)}).parse(req.body);const digest=hash('analysis-v3:'+b.grade+':'+b.text);const cached=cacheGet(req.user.id,'analysis',digest);if(cached&&db.prepare('SELECT id FROM works WHERE id=? AND user_id=?').get(cached.id,req.user.id))return res.json(cached);const result=await once(req.user.id+':analysis:'+digest,async()=>{const report=await generate('analysis',[],`Выбранный класс: ${b.grade}. Если в работе указан другой класс, ориентируйся на фактическое условие. Работа ученика:\n${b.text}`);const id=randomUUID(),created=Date.now();db.prepare('INSERT INTO works VALUES(?,?,?,?,?)').run(id,req.user.id,created,b.text,JSON.stringify(report));const result={id,created,text:b.text,report};cachePut(req.user.id,'analysis',digest,result);return result;});res.json(result);});
app.post('/api/practice',auth,aiLimit,async(req,res)=>{const b=z.object({title:z.string().trim().min(2).max(500),reason:z.string().max(3000).default(''),grade:z.number().int().min(5).max(11)}).parse(req.body);const digest=hash('practice-v1:'+JSON.stringify(b));const cached=cacheGet(req.user.id,'practice',digest);if(cached)return res.json(cached);const result=await once(req.user.id+':practice:'+digest,async()=>{const result=await generate('practice',[],`Класс: ${b.grade}. Тема: ${b.title}. Причина повторения: ${b.reason}`);cachePut(req.user.id,'practice',digest,result);return result;});res.json(result);});
app.get('/api/works',auth,(req,res)=>res.json(db.prepare('SELECT id,created,text,report FROM works WHERE user_id=? ORDER BY created DESC LIMIT 100').all(req.user.id).map(w=>({...w,report:JSON.parse(w.report)}))));
app.delete('/api/works/:id',auth,(req,res)=>{db.prepare('DELETE FROM works WHERE id=? AND user_id=?').run(req.params.id,req.user.id);res.json({ok:true});});
app.use('/api',(req,res)=>res.status(404).json({error:'Маршрут не найден.'}));
app.use(express.static(path.join(root,'dist'),{dotfiles:'deny'}));
app.use((e,req,res,next)=>{const status=e instanceof z.ZodError?400:e.status||500;res.status(status).json({error:status===413?'Объём файла слишком большой.':e instanceof z.ZodError?'Проверь заполненные поля.':status<500||status===502||status===503||status===504?e.message:'Ошибка сервера.'});});
if(process.env.NODE_ENV!=='test')app.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Понятно: http://localhost:'+(process.env.PORT||3000)));
