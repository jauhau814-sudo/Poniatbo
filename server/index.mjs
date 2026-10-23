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
CREATE TABLE IF NOT EXISTS works(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,created INTEGER NOT NULL,text TEXT NOT NULL,report TEXT NOT NULL);`);
export const app=express();
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'blob:','data:'],fontSrc:["'self'"],connectSrc:["'self'"],workerSrc:["'self'",'blob:']}}}));
app.use('/api',rateLimit({windowMs:60000,limit:120}));
app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');if(!['GET','HEAD'].includes(req.method)){const origin=req.get('origin');if((origin&&origin!==`${req.protocol}://${req.get('host')}`&&origin!==process.env.PUBLIC_ORIGIN)||!req.is('application/json'))return res.status(403).json({error:'Запрос отклонён.'});}next();});
app.use(express.json({limit:'46mb'}));
const hash=s=>createHash('sha256').update(s).digest('hex');
function session(req){const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('sid='))?.slice(4);return token&&db.prepare('SELECT users.id,users.name,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(hash(token),Date.now());}
function auth(req,res,next){req.user=session(req);if(!req.user)return res.status(401).json({error:'Войди в профиль.'});next();}
function cookie(res,token,age=604800){res.setHeader('Set-Cookie',`sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);}
const credentials=z.object({username:z.string().regex(/^[\p{L}\p{N}_.-]{3,32}$/u).transform(s=>s.toLowerCase()),password:z.string().min(8).max(128),name:z.string().trim().min(2).max(40).optional()});
const loginLimit=rateLimit({windowMs:900000,limit:30});
app.get('/api/health',(req,res)=>res.json({ok:true,aiConfigured:!!process.env.GEMINI_API_KEY}));
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
const aiLimit=rateLimit({windowMs:3600000,limit:40,keyGenerator:req=>req.user.id});
app.post('/api/ocr',auth,aiLimit,async(req,res)=>{const b=z.object({images:z.array(z.string().max(12000000)).min(1).max(4)}).parse(req.body);const parts=b.images.map(image=>{const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image);if(!match)throw Object.assign(new Error('Нужен JPG, PNG или WEBP.'),{status:400});const bytes=Buffer.from(match[2],'base64');if(bytes.length>8*1024*1024)throw Object.assign(new Error('Фото больше 8 МБ.'),{status:413});const valid=match[1]==='image/jpeg'?bytes[0]===255&&bytes[1]===216:match[1]==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';if(!valid)throw Object.assign(new Error('Файл не соответствует формату изображения.'),{status:400});return {inlineData:{mimeType:match[1],data:match[2]}};});res.json(await generate('ocr',parts));});
app.post('/api/analysis',auth,aiLimit,async(req,res)=>{const b=z.object({text:z.string().trim().min(1).max(40000),confirmed:z.literal(true),grade:z.number().int().min(5).max(9)}).parse(req.body);const report=await generate('analysis',[],`Класс: ${b.grade}. Работа ученика:\n${b.text}`);const id=randomUUID(),created=Date.now();db.prepare('INSERT INTO works VALUES(?,?,?,?,?)').run(id,req.user.id,created,b.text,JSON.stringify(report));res.json({id,created,text:b.text,report});});
app.get('/api/works',auth,(req,res)=>res.json(db.prepare('SELECT id,created,text,report FROM works WHERE user_id=? ORDER BY created DESC LIMIT 100').all(req.user.id).map(w=>({...w,report:JSON.parse(w.report)}))));
app.delete('/api/works/:id',auth,(req,res)=>{db.prepare('DELETE FROM works WHERE id=? AND user_id=?').run(req.params.id,req.user.id);res.json({ok:true});});
app.use('/api',(req,res)=>res.status(404).json({error:'Маршрут не найден.'}));
app.use(express.static(path.join(root,'dist'),{dotfiles:'deny'}));
app.use((e,req,res,next)=>{const status=e instanceof z.ZodError?400:e.status||500;res.status(status).json({error:e instanceof z.ZodError?'Проверь заполненные поля.':status<500||status===502||status===503||status===504?e.message:'Ошибка сервера.'});});
if(process.env.NODE_ENV!=='test')app.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Понятно: http://localhost:'+(process.env.PORT||3000)));
