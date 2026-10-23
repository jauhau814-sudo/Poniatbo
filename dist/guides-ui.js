(() => {
 'use strict';
 const guides=window.SCHOOL_GUIDES;
 let returnCard=null;
 const book=`<svg viewBox="0 0 120 90" fill="none" aria-hidden="true"><path d="M60 21C44 12 23 12 11 16v57c15-5 33-4 49 4 16-8 34-9 49-4V16c-12-4-33-4-49 5Z" fill="white" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M60 21v56M23 31c9-2 18 0 25 3m-25 9c9-2 18 0 25 3m-25 9c9-2 18 0 25 3m24-24c7-3 16-5 25-3m-25 15c7-3 16-5 25-3m-25 15c7-3 16-5 25-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M88 13v24l6-5 6 3V12" fill="#f1ae73"/></svg>`;
 const safe=s=>esc(s).replace(/\n/g,'<br>');
 const previousTopic=topicPage;
 topicPage=()=>{
  const t=topic(state.topic);if(!t||!guides[t.id])return previousTopic();
  const read=!!result(t.id).guideCompletedAt;
  const tile=`<button class="lesson-step guide-route-card ${read?'guide-read':''}" data-read-guide="${esc(t.id)}"><span class="guide-book-icon">${book}</span><span class="step-copy"><strong>Справочник темы</strong><small>${read?'Уже читал · открыть снова':'Пойми тему перед заданиями'}</small></span><span class="guide-time">${guides[t.id].readMinutes}–${guides[t.id].readMinutes+1} мин <span>↗</span></span></button>`;
  return previousTopic().replace('<div class="lesson-route">','<div class="lesson-route with-guide">'+tile).replace(/<details class="lesson-reference">[\s\S]*?<\/details>/,'');
 };
 const previousPractice=practice;
 practice=()=>{
  const t=topic(state.topic);if(!t||!guides[t.id])return previousPractice();
  return previousPractice().replace('class="reference-button" data-rule',`class="reference-button" data-read-guide="${esc(t.id)}"`).replace('Открыть справочник <span>↗</span>','Справочник темы <span>↗</span>');
 };
 function openGuide(id,fromCard=null){
  const t=topic(id);if(!t||!guides[id])return;
  returnCard=fromCard;state.topic=id;state.grade=t.grade;
  const r=result(id);state.results[id]={...r,guideOpenedAt:Date.now()};save();
  go('guide');history.replaceState(null,'','#guide='+encodeURIComponent(id));
 }
 function guidePage(){
  const t=topic(state.topic),g=guides[t?.id];if(!g)return catalog();
  const s=subject(t.subject);
  const contexts=[g.scene,...g.examples.map(x=>x.context)].filter(Boolean);
  const distinct=[...new Set(contexts)];
  return `<article class="guide-page" data-guide-id="${esc(t.id)}"><div class="guide-topbar"><button class="game-back" data-open="${esc(t.id)}">← К маршруту темы</button><span>${esc(s.name)} · ${t.grade} класс</span>${returnCard!==null?'<button class="btn-link" data-guide-return>Вернуться к заданию →</button>':''}</div><header class="guide-hero"><div><span class="eyebrow">СПРАВОЧНИК ТЕМЫ · ${g.readMinutes}–${g.readMinutes+1} МИНУТ</span><h1>${esc(g.title)}</h1><p>Сначала поймём идею. Затем посмотрим, как она работает на примерах.</p></div><span class="guide-hero-book">${book}</span></header><div class="guide-layout"><div class="guide-reading"><section id="guideIdea" class="guide-section"><div class="guide-section-label"><span>01</span> ГЛАВНАЯ ИДЕЯ</div><h2>Разберёмся по порядку</h2>${g.firstSteps.length?`<div class="guide-story">${g.firstSteps.map(x=>`<p>${safe(x)}</p>`).join('')}</div><h3 class="guide-rule-label">Запомним правило</h3>`:''}<div class="guide-core">${safe(g.introduction)}</div>${g.glossary.length?`<div class="guide-simple"><h3>Простыми словами</h3><ul>${g.glossary.map(x=>`<li>${safe(x.explanation)}</li>`).join('')}</ul></div>`:''}</section><section id="guideSteps" class="guide-section"><div class="guide-section-label"><span>02</span> КАК РАБОТАТЬ С ТЕМОЙ</div><h2>На что обратить внимание</h2><ol class="guide-method">${g.method.map((x,i)=>`<li><span>${i+1}</span><p>${safe(x)}</p></li>`).join('')}</ol></section><section id="guideExamples" class="guide-section"><div class="guide-section-label"><span>03</span> ПРИМЕРЫ С ОБЪЯСНЕНИЕМ</div><h2>Посмотрим вместе</h2>${distinct.length?`<details class="guide-context" ${g.subject==='literature'||/исходн|по данным|сцен|текст|схем/i.test(g.examples.map(x=>x.question).join(' '))?'open':''}><summary>Ситуация для примеров</summary>${distinct.map(x=>`<p>${safe(x)}</p>`).join('')}</details>`:''}${g.examples.map((x,i)=>`<section class="worked-example"><span class="worked-example-number">ПРИМЕР ${i+1}</span><h3>${safe(x.question)}</h3><div class="worked-why"><span>Как рассуждать</span><p>${safe(x.explanation)}</p></div><div class="worked-result"><span>Получаем</span><p>${safe(x.answer)}</p></div></section>`).join('')}</section>${g.error?`<section id="guideMistake" class="guide-section"><div class="guide-section-label"><span>04</span> ЧАСТАЯ ОШИБКА</div><h2>Вот здесь легко запутаться</h2><div class="guide-mistake"><span class="guide-mistake-label">Проверим рассуждение</span><p>${safe(g.error.question)}</p><div><b>Правильный ход</b><p>${safe(g.error.correction)}</p><span>${safe(g.error.reason)}</span></div></div></section>`:''}<section id="guideReady" class="guide-section guide-ready"><div class="guide-section-label"><span>05</span> ТЕПЕРЬ ТВОЯ ОЧЕРЕДЬ</div><h2>Попробуй без подсказки</h2><p>${safe(g.check)}</p><div class="guide-bottom-actions"><button class="btn btn-orange" data-guide-finish="${esc(t.id)}">Понятно, к карточкам →</button><button class="btn btn-light" data-guide-top>Прочитать ещё раз ↑</button></div><span class="guide-status-note">Чтение и решение заданий отмечаются отдельно. К справочнику можно вернуться в любой момент.</span></section></div><aside class="guide-side"><div class="guide-contents"><span class="eyebrow">В ЭТОМ СПРАВОЧНИКЕ</span><button data-guide-section="guideIdea">Главная идея <span>01</span></button><button data-guide-section="guideSteps">Порядок действий <span>02</span></button><button data-guide-section="guideExamples">Разобранные примеры <span>03</span></button>${g.error?'<button data-guide-section="guideMistake">Частая ошибка <span>04</span></button>':''}<button data-guide-section="guideReady">Переход к практике <span>05</span></button></div><div class="guide-side-note"><img src="raccoon.svg" alt=""><p>Не нужно запоминать всё сразу. Попробуй объяснить мысль своими словами.</p></div><button class="btn btn-light" data-open="${esc(t.id)}">К маршруту темы →</button></aside></div></article>`;
 }
 const previousRender=render;
 render=()=>{
  if(state.page!=='guide'){previousRender();return;}
  APP.innerHTML=guidePage();document.title=`${topic(state.topic)?.title||'Справочник'} — Справочник темы`;
  document.body.classList.remove('in-lesson');document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav==='catalog'));
 };
 const previousStart=startCard;
 startCard=(id,index)=>{previousStart(id,index);if(state.practice?.topic===id){state.practice.guideAssisted=!!result(id).guideOpenedAt&&index<3;}};
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const stop=()=>{e.preventDefault();e.stopImmediatePropagation();};
  if(b.dataset.readGuide){stop();openGuide(b.dataset.readGuide,state.page==='practice'?state.card:null);return;}
  if(b.dataset.guideFinish){stop();const id=b.dataset.guideFinish;state.results[id]={...result(id),guideCompletedAt:Date.now()};save();openTopic(id);return;}
  if(b.hasAttribute('data-guide-return')){stop();if(returnCard!==null)startCard(state.topic,returnCard);else openTopic(state.topic);return;}
  if(b.dataset.guideSection){stop();document.getElementById(b.dataset.guideSection)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(b.hasAttribute('data-guide-top')){stop();window.scrollTo({top:0,behavior:'smooth'});}
 },true);
 window.addEventListener('hashchange',()=>{
  let h;try{h=decodeURIComponent(location.hash.slice(1));}catch{return;}
  if(h.startsWith('guide=')&&guides[h.slice(6)])openGuide(h.slice(6));
 });
 let initial;try{initial=decodeURIComponent(location.hash.slice(1));}catch{initial='';}
 if(initial.startsWith('guide=')&&guides[initial.slice(6)])openGuide(initial.slice(6));else render();
})();
