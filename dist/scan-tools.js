/* Deterministic text processing and arithmetic. No eval, neural model or API. */
(function(root){
 'use strict';
 const stop=new Set('это этот этой эти как что для при или все его она они оно имя тема класс работа задание задания найти найди нужно дано после перед между через который которые чтобы the and with from this that have has was were are you your she his her they their not into about step unit'.split(' '));
 const normalize=s=>String(s||'').replace(/²/g,'^2').replace(/³/g,'^3').normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[−–—]/g,'-');
 const tokens=s=>normalize(s).match(/[a-zа-я]{3,}/g)?.filter(w=>!stop.has(w))||[];
 const stem=w=>/[а-я]/.test(w)?w.replace(/(?:иями|ями|ами|ого|ему|ому|ыми|ими|ость|ости|ение|ения|ений|ая|яя|ое|ее|ые|ие|ий|ый|ой|ам|ям|ах|ях|ов|ев|ом|ем|ы|и|а|я|у|ю|е)$/,''):w.replace(/(?:ing|ed|s)$/,'');
 function split(text){
  text=String(text||'').replace(/\r/g,'').replace(/\n[ \t]*\n/g,'\n').trim();if(!text)return [];
  const starts=[...text.matchAll(/(?:^|\n)\s*(?:№\s*)?\d{1,3}\s*[.)]\s+/g)];
  if(starts.length<2)return [text];
  const result=[];if(starts[0].index>0)result.push(text.slice(0,starts[0].index).trim());
  for(let i=0;i<starts.length;i++)result.push(text.slice(starts[i].index,i+1<starts.length?starts[i+1].index:undefined).trim());return result.filter(Boolean).slice(0,100);
 }
 function arithmetic(input){
  let s=normalize(input).replace(/,/g,'.').replace(/×|·/g,'*').replace(/÷|:/g,'/').replace(/\s/g,'');
  if(s.length>180||!/^[\d.+*/^()-]+$/.test(s))return null;
  const ts=s.match(/\d+(?:\.\d+)?|[()+*/^.-]/g)||[];if(ts.join('')!==s)return null;let at=0,depth=0;
  function atom(){if(++depth>25)throw 0;let v;
   if(ts[at]==='('){at++;v=expr();if(ts[at++]!==')')throw 0;}
   else{if(!/^\d/.test(ts[at]||''))throw 0;v=Number(ts[at++]);}depth--;return v;
  }
  function unary(){if(ts[at]==='+'){at++;return unary();}if(ts[at]==='-'){at++;return -unary();}return power();}
  function power(){let a=atom();if(ts[at]==='^'){at++;const b=unary();if(Math.abs(b)>100)throw 0;a=Math.pow(a,b);}return a;}
  function product(){let a=unary();while(ts[at]==='*'||ts[at]==='/'){const op=ts[at++],b=unary();if(op==='/'&&b===0)throw 0;a=op==='*'?a*b:a/b;}return a;}
  function expr(){let a=product();while(ts[at]==='+'||ts[at]==='-'){const op=ts[at++],b=product();a=op==='+'?a+b:a-b;}return a;}
  try{const value=expr();return at===ts.length&&Number.isFinite(value)?value:null;}catch{return null;}
 }
 function equalities(text){
  const checks=[];
  for(const line of String(text).split('\n')){
   const clean=line.replace(/^\s*(?:№\s*)?\d+[.)]\s+/,'').trim();
   if(!/^[\d\s.,+*/×·÷:^()−–—=-]+$/.test(clean)||clean.split('=').length!==2)continue;
   const [l,r]=clean.split('='),a=arithmetic(l),b=arithmetic(r);if(a===null||b===null)continue;
   checks.push({expression:clean,left:a,right:b,equal:Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b))});
  }return checks;
 }
 function rank(text,topics,grade,subject='all'){
  const raw=normalize(text),ws=new Set(tokens(text).map(stem));
  const eligible=topics.filter(t=>t.grade===Number(grade)&&(subject==='all'||t.subject===subject));
  const docs=eligible.map(t=>({t,terms:new Set(tokens([t.title,t.unit,...(t.keywords||[])].join(' ')).map(stem))}));
  const frequency=new Map();for(const d of docs)for(const w of d.terms)frequency.set(w,(frequency.get(w)||0)+1);
  const hits=[];
  for(const {t,terms} of docs){let score=0;const matched=[];
   for(const w of terms)if(ws.has(w)&&w.length>=3){score+=1+Math.log(1+docs.length/(frequency.get(w)||1));matched.push(w);}
   const title=normalize(t.title);
   if(/(?:квадратн.{0,8}уравнен|[xх]\s*(?:²|\^\s*2))/.test(raw)&&/квадратн.{0,8}уравнен/.test(title)){score+=12;matched.push('квадратное уравнение');}
   if(/(?:√|квадратн.{0,8}кор)/.test(raw)&&/квадратн.{0,8}кор/.test(title)){score+=12;matched.push('квадратный корень');}
   if(/(?:\b[UIR]\s*=|закон.{0,5}ома)/i.test(text)&&/закон.{0,5}ома/i.test(title)){score+=10;matched.push('закон Ома');}
   if(score>=4&&matched.length)hits.push({id:t.id,score,matched:[...new Set(matched)].slice(0,4)});
  }
  hits.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));const seen=new Set();
  return hits.filter(h=>{const t=topics.find(t=>t.id===h.id),key=t.subject+'|'+t.title.replace(/\s*·\s*Step \d+.*/i,'');if(seen.has(key))return false;seen.add(key);return true;}).slice(0,4);
 }
 const api={normalize,tokens,split,arithmetic,equalities,rank};root.SCHOOL_SCAN_TOOLS=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
