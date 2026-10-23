/* Match recommendations only to topics and cards that exist in the loaded catalog. */
(()=>{
 const normalize=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
 const stops=new Set(['тема','темы','повтор','ошиб','основ','правил','задач','решен','ученик','класс','кинемат']);
 const tokens=s=>[...new Set(normalize(s).split(' ').filter(w=>w.length>=4).map(w=>w.slice(0,6)).filter(w=>![...stops].some(t=>w.startsWith(t))))];
 const aliases=[[/центрострем|окружност|кругов.*движ|движ.*кругов/,/движение по окружности/],[/закон.*ома|сопротивлен.*напряжен/,/закон.*ома/],[/линейн.*уравнен|перенос.*слагаем/,/линейн.*уравнен/],[/квадратн.*уравнен/,/квадратн.*уравнен/],[/посторонн.*кор|иррациональн.*уравнен/,/иррациональн.*уравнен|квадратн.*кор/]];
 window.SCHOOL_AI_TOPIC_MATCHER={match(recommendations,catalog,grade){
  const topics=catalog.topics.filter(t=>(catalog.questions(t.id)||[]).length);
  const index=topics.map(t=>({t,title:normalize(t.title),short:tokens(t.title+' '+(t.keywords||[]).join(' ')),body:tokens(t.learn)}));
  const frequencies=new Map();for(const row of index)for(const word of row.short)frequencies.set(word,(frequencies.get(word)||0)+1);
  const groups=new Map(),unmatched=[];
  for(const recommendation of recommendations){
   const query=normalize(recommendation.title),words=tokens(recommendation.title),details=tokens(recommendation.reason);
   const ranked=index.map(row=>{const common=words.filter(w=>row.short.includes(w));let score=common.reduce((n,w)=>n+Math.log(1+topics.length/(frequencies.get(w)||1)),0);score+=words.filter(w=>row.body.includes(w)).length*.4;score+=details.filter(w=>row.short.includes(w)).length*.15;
    if(row.title===query)score+=30;
    if(row.title.length>10&&query.includes(row.title))score+=15;
    for(const [pattern,target] of aliases)if(pattern.test(query)&&target.test(row.title))score+=35;
    if(row.t.grade===grade)score+=.25;
    return {...row,score,common:common.length};}).sort((a,b)=>b.score-a.score||Math.abs(a.t.grade-grade)-Math.abs(b.t.grade-grade));
   const best=ranked[0];
   if(!best||best.score<4||(best.common<Math.min(words.length,2)&&best.score<20)){unmatched.push(recommendation.title);continue;}
   const existing=groups.get(best.t.id);if(existing){if(!existing.reasons.includes(recommendation.title))existing.reasons.push(recommendation.title);}else groups.set(best.t.id,{topic:best.t,reasons:[recommendation.title]});
  }
  return {matches:[...groups.values()],unmatched};
 }};
})();

