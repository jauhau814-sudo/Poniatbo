/* Full curriculum interface. Local-only drafts, transparent review, original art. */
(() => {
 'use strict';
 const M=window.SCHOOL_MATERIALS;
 const countWord=(n,a,b,c)=>`${num(n)} ${n%100>=11&&n%100<=14?c:n%10===1?a:n%10>=2&&n%10<=4?b:c}`;
 const stageNames=['Исследуй','Решай с опорой','Исправь енота','Реши самостоятельно','Примени'];
 const palette={math:['#c90061','#fce6ef'],algebra:['#c90061','#fce6ef'],geometry:['#6638ad','#eee7fa'],statistics:['#087f79','#e1f5f0'],physics:['#90651d','#fff2d4'],chemistry:['#087f79','#e1f5f0'],russian:['#b51c87','#f9e5f3'],literature:['#6638ad','#eee7fa'],english:['#6638ad','#eee7fa'],informatics:['#176f9f','#e5f2fc'],biology:['#46713b','#ebf4e2'],geography:['#087f79','#e1f5f0'],history:['#90651d','#fff2d4'],society:['#176f9f','#e5f2fc']};
 let query='',pageNumber=0,progressFilter='all';
 for(const t of C.topics)if(t.prereq)t.prereq=t.prereq.filter(id=>C.byId(id));
 const PAGE_SIZE=18, DRAFT_KEY='school-card-drafts-v4';
 let drafts={};try{drafts=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')}catch{}
 if(!drafts||typeof drafts!=='object'||Array.isArray(drafts))drafts={};
 let draftTimer;
 const draftId=p=>p.question.id||`${p.topic}:${p.card}`;
 const storeDraft=()=>{clearTimeout(draftTimer);try{localStorage.setItem(DRAFT_KEY,JSON.stringify(drafts))}catch{toast('Не хватает места для черновика. Скопируй ответ перед закрытием.')}};
 const saveDraft=()=>{const p=state.practice;if(!p)return;drafts[draftId(p)]={text:p.text||'',strokes:p.strokes||[],hintLevel:p.hintLevel||0,solutionSeen:!!p.solutionSeen,everSolution:!!p.everSolution,attempts:p.attempts||0,order:p.order||[],choices:p.choices||{}};clearTimeout(draftTimer);draftTimer=setTimeout(storeDraft,350)};
 const oldSave=save;
 save=()=>{try{oldSave()}catch{toast('Не удалось сохранить прогресс в браузере. Можно скачать его в разделе «Мой прогресс».')}};
 const total=t=>C.questions(t.id).length;
 const percent=t=>Math.min(100,Math.round(cardCount(t.id)/total(t)*100));
 const isNew=t=>Boolean(M.cards[t.id]);
 const num=n=>n.toLocaleString('ru-RU');
 const rich=s=>esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
 const subjectStyle=s=>`--ink:${(palette[s]||palette.math)[0]};--wash:${(palette[s]||palette.math)[1]}`;
 function illustration(id,large=false,title=''){
  const attrs=`viewBox="0 0 240 160" fill="none" aria-hidden="true" class="lesson-art ${large?'large':''}"`;
  const paper='<rect x="57" y="25" width="131" height="116" rx="13" fill="white"/>';
  const base='<ellipse cx="125" cy="144" rx="88" ry="7" fill="currentColor" opacity=".08"/>';
  const icons={
   english:'<path d="M35 36h113v70H81l-22 20v-20H35V36Z" fill="white" stroke="currentColor" stroke-width="3"/><path d="M143 70h62v65h-45l-17 14V70Z" fill="#ffd96c"/><text x="58" y="82" fill="currentColor" font-size="31" font-family="Georgia,serif">Aa</text><path d="M157 91h31m-31 14h22" stroke="white" stroke-width="3"/>', 
   informatics:`${paper}<rect x="73" y="43" width="101" height="66" rx="6" fill="currentColor" opacity=".18"/><path d="m103 62-12 13 12 13m39-26 12 13-12 13m-19-29-9 32M105 120h38" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
   literature:'<path d="M120 40C92 24 57 26 37 32v95c25-8 57-7 83 7 26-14 58-15 83-7V32c-20-6-55-8-83 8Z" fill="white" stroke="currentColor" stroke-width="3"/><path d="M120 40v94M55 57h44M55 74h44M55 91h33M140 57h43M140 74h43M140 91h31" stroke="currentColor" stroke-width="3" opacity=".5"/>',
   math:`${paper}<rect x="74" y="45" width="36" height="36" rx="7" fill="currentColor" opacity=".15"/><path d="M84 63h17m-8-8v16M129 62h33M78 103h87M78 119h52" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="169" cy="35" r="18" fill="#ffd96c"/><path d="m162 35 5 5 9-10" stroke="white" stroke-width="3"/>`,
   algebra:`${paper}<text x="80" y="86" fill="currentColor" font-size="44" font-family="Georgia,serif">x²</text><path d="M80 106h82M80 120h53" stroke="currentColor" stroke-width="3" opacity=".3"/><circle cx="177" cy="34" r="17" fill="#ffd96c"/>`,
   geometry:'<path d="M58 128 137 28l62 100H58Z" fill="white" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M137 28v100M137 115h13v13" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><circle cx="58" cy="128" r="5" fill="currentColor"/><circle cx="137" cy="28" r="5" fill="#ffd96c"/><circle cx="199" cy="128" r="5" fill="currentColor"/><path d="m34 58 30-29m-24 8 12 12" stroke="currentColor" stroke-width="3"/>',
   statistics:`${paper}<path d="M77 117h91M77 117V48" stroke="currentColor" stroke-width="2"/><rect x="90" y="86" width="16" height="30" rx="3" fill="currentColor" opacity=".3"/><rect x="115" y="65" width="16" height="51" rx="3" fill="currentColor" opacity=".6"/><rect x="140" y="49" width="16" height="67" rx="3" fill="currentColor"/><circle cx="184" cy="34" r="19" fill="#ffd96c"/>`,
   physics:'<rect x="49" y="125" width="149" height="12" rx="6" fill="currentColor" opacity=".2"/><path d="M88 125V37h80v20" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M168 53v42" stroke="currentColor" stroke-width="2"/><circle cx="168" cy="110" r="16" fill="#ffd96c"/><path d="M49 61h32M58 48l-11 13 11 13" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="88" cy="37" r="9" fill="white" stroke="currentColor" stroke-width="3"/>',
   chemistry:'<path d="M92 29h38m-31 0v42l-34 51a12 12 0 0 0 10 18h72a12 12 0 0 0 10-18l-34-51V29" fill="white" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="m81 103-13 22a7 7 0 0 0 7 11h73a7 7 0 0 0 6-11l-14-22H81Z" fill="currentColor" opacity=".22"/><circle cx="96" cy="119" r="4" fill="currentColor"/><circle cx="128" cy="110" r="5" fill="currentColor"/><circle cx="168" cy="45" r="13" fill="#ffd96c"/><circle cx="188" cy="70" r="7" fill="currentColor" opacity=".3"/>',
   russian:`${paper}<path d="M77 52h72M77 68h91M77 84h65M77 100h82" stroke="currentColor" stroke-width="3" opacity=".3" stroke-linecap="round"/><path d="m130 119 45-54 13 12-45 54-18 7 5-19Z" fill="#ffd96c"/><path d="m130 119 13 12-18 7 5-19Z" fill="currentColor"/>`,
   biology:'<path d="M121 137V73" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M121 98C80 99 62 80 67 49c34-1 56 16 54 49Z" fill="currentColor" opacity=".3"/><path d="M121 80c-1-37 20-57 56-52 1 31-19 52-56 52Z" fill="currentColor" opacity=".6"/><path d="M79 62l42 36m0-18 40-37" stroke="currentColor" stroke-width="2"/><path d="M88 139h66" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><circle cx="55" cy="113" r="9" fill="#ffd96c"/>',
   geography:'<path d="m43 45 48-16 55 17 48-16v100l-48 16-55-17-48 16V45Z" fill="white" stroke="currentColor" stroke-width="2"/><path d="M91 29v100m55-83v100" stroke="currentColor" opacity=".25"/><path d="m56 113 30-38 41 26 48-45" stroke="currentColor" stroke-width="3" stroke-dasharray="5 5"/><circle cx="127" cy="101" r="8" fill="#ffd96c"/><circle cx="175" cy="56" r="6" fill="currentColor"/>',
   history:'<path d="M120 38C94 23 58 26 35 35v101c29-10 61-9 85 6 24-15 56-16 85-6V35c-23-9-59-12-85 3Z" fill="white" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M120 38v104M54 59h45M54 76h45M54 93h28M141 59h45M141 76h45M141 93h28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="71" y="105" width="31" height="17" rx="3" fill="#ffe574"/><path d="M147 112h29" stroke="currentColor" stroke-width="3"/>',
   society:'<rect x="48" y="71" width="67" height="53" rx="16" fill="white"/><rect x="131" y="71" width="67" height="53" rx="16" fill="white"/><circle cx="81" cy="51" r="19" fill="currentColor" opacity=".5"/><circle cx="164" cy="51" r="19" fill="#ffd96c"/><path d="m102 119 20 15 23-17M116 70l8 8 9-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
  };
  let image=icons[id]||icons.math;
  if(id==='geometry'&&/четыр|параллелограмм|трапец|прямоугольник|ромб|квадрат/i.test(title)){
   const shape=/трапец/i.test(title)?'M80 40h85l35 85H45L80 40Z':/ромб/i.test(title)?'M120 25 190 80 120 135 50 80 120 25Z':/квадрат/i.test(title)?'M70 35h95v95H70V35Z':/прямоугольник/i.test(title)?'M50 40h145v85H50V40Z':'M80 35h120l-30 90H50l30-90Z';
   image=`<path d="${shape}" fill="white" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M56 143h145" stroke="currentColor" opacity=".15" stroke-width="2"/><circle cx="203" cy="31" r="10" fill="#efb67a"/>`;
  }
  return `<svg ${attrs}>${base}${image}</svg>`;
 }
 function status(t,i){const r=result(t.id).cards?.[i];return r?.status==='reviewed'?'Проверено по критериям':r?.status==='studied'?'Разбор изучен':r?.done?'Решено':r?.submitted?'Ждёт проверки':drafts[C.questions(t.id)[i].id]?'Есть черновик':'Начать';}
 topicCard=t=>`<button class="card poster-card curriculum-poster" style="${subjectStyle(t.subject)}" data-open="${esc(t.id)}"><span class="poster-art">${illustration(t.subject,false,t.title)}<span class="poster-length">${countWord(total(t),'карточка','карточки','карточек')}</span></span><span class="poster-info"><small>${esc(subject(t.subject).name)} · ${t.grade} класс</small><strong>${esc(t.title)}</strong><span class="poster-progress" role="progressbar" aria-label="Пройдено карточек темы" aria-valuenow="${percent(t)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${percent(t)}%"></i></span><em>${cardCount(t.id)} из ${total(t)} пройдено <span aria-hidden="true">↗</span></em></span></button>`;
 subjectCard=s=>{const a=C.topics.filter(t=>t.subject===s.id&&t.grade===state.grade);return `<button class="card subject-card new-subject" style="${subjectStyle(s.id)}" data-subject="${s.id}"><span class="subject-mini">${illustration(s.id)}</span><h3>${esc(s.name)}</h3><small>${a.length?`${countWord(a.length,'тема','темы','тем')} · ${countWord(a.reduce((n,t)=>n+total(t),0),'карточка','карточки','карточек')}`:'Материалы пока не добавлены'}</small><span class="subject-foot">Открыть предмет <span>↗</span></span></button>`};
 const originalHome=home;
 home=()=>originalHome().replace('Разбери работу, найди трудную тему и открой короткие карточки. Решай прямо здесь и возвращайся к основе, когда нужно.','Выбирай тему, исследуй, пробуй и разбирайся. Рядом будут понятные подсказки и енот, который учится вместе с тобой.').replace('<div class="quick-grid home-quick">',`<div class="library-ribbon"><span><b>${num(Object.values(M.cards).reduce((n,a)=>n+a.length,0))}</b> карточек для 5–9 классов</span><span><b>${num(M.topics.length)}</b> маршрутов</span></div><div class="quick-grid home-quick">`);
 catalog=()=>{
  const subjects=C.subjects.filter(s=>s.grades.includes(state.grade));
  let a=C.topics.filter(t=>t.grade===state.grade&&(state.subject==='all'||t.subject===state.subject)&&(!(state.subject==='english'&&window.SCHOOL_ENGLISH_FILTER&&window.SCHOOL_ENGLISH_FILTER!=='all')||t.course===window.SCHOOL_ENGLISH_FILTER));
  const gradeTotal=a.length;
  const search=query.toLocaleLowerCase('ru').trim();
  if(search)a=a.filter(t=>`${t.title} ${t.unit} ${subject(t.subject).name} ${t.id}`.toLocaleLowerCase('ru').includes(search));
  if(progressFilter==='new')a=a.filter(t=>!cardCount(t.id));
  if(progressFilter==='started')a=a.filter(t=>cardCount(t.id)>0&&cardCount(t.id)<total(t));
  if(progressFilter==='done')a=a.filter(t=>cardCount(t.id)===total(t));
  pageNumber=Math.max(0,Math.min(pageNumber,Math.ceil(a.length/PAGE_SIZE)-1));
  const visible=a.slice(pageNumber*PAGE_SIZE,(pageNumber+1)*PAGE_SIZE);
  const selected=subject(state.subject);
  return `${head('МАСТЕРСКАЯ ЗНАНИЙ',selected?esc(selected.name):'Что исследуем сегодня?',`${state.grade} класс · ${num(gradeTotal)} тем. Выбери свой маршрут и двигайся в удобном темпе.`,'')}${gradeButtons()}<div class="library-layout"><aside class="library-sidebar"><div class="sidebar-label">ПРЕДМЕТЫ</div><button class="subject-tab ${state.subject==='all'?'active':''}" data-filter="all"><span>Все предметы</span><b>${C.topics.filter(t=>t.grade===state.grade).length}</b></button>${subjects.map(s=>`<button class="subject-tab ${state.subject===s.id?'active':''}" data-filter="${s.id}"><span class="tab-icon" style="${subjectStyle(s.id)}">${s.id==='history'?s.icon:esc(s.icon)}</span><span>${esc(s.name)}</span><b>${C.topics.filter(t=>t.grade===state.grade&&t.subject===s.id).length}</b></button>`).join('')}<div class="sidebar-note"><img src="raccoon.svg" alt=""><p>Большая тема начинается с маленького шага.</p></div></aside><div class="library-content"><div class="library-tools"><label class="search-field"><span aria-hidden="true">⌕</span><input id="topicSearch" type="search" placeholder="Найти тему или раздел" aria-label="Найти тему или раздел" value="${esc(query)}"></label><div class="progress-filters" role="group" aria-label="Показать темы">${[['all','Все'],['new','Не начаты'],['started','В процессе'],['done','Пройдены']].map(([id,label])=>`<button type="button" data-progress-filter="${id}" aria-pressed="${progressFilter===id}">${label}</button>`).join('')}</div></div><div id="libraryResults"><div class="library-results-line"><span>${search?'Найдено':'В библиотеке'}: ${topicCountText(a.length)}</span><span>Страница ${pageNumber+1} из ${Math.max(1,Math.ceil(a.length/PAGE_SIZE))}</span></div>${visible.length?`<div class="poster-grid library-posters">${visible.map(topicCard).join('')}</div>`:`<div class="empty"><h2>Здесь пока пусто</h2><p>Измени запрос или фильтр прогресса.</p><button class="btn btn-light" data-reset-search>Сбросить фильтры</button></div>`}<div class="library-pagination"><button class="btn btn-light" data-page="${pageNumber-1}" ${pageNumber===0?'disabled':''}>← Назад</button><span>${pageNumber+1} / ${Math.max(1,Math.ceil(a.length/PAGE_SIZE))}</span><button class="btn btn-light" data-page="${pageNumber+1}" ${(pageNumber+1)*PAGE_SIZE>=a.length?'disabled':''}>Дальше →</button></div></div></div></div>`;
 };
 topicPage=()=>{
  const t=topic(state.topic);if(!t)return catalog();const s=subject(t.subject);const qs=C.questions(t.id);const first=qs.findIndex((_,i)=>!finished(t.id,i)&&!result(t.id).cards?.[i]?.submitted);
  return `<div class="crumb"><button data-go="catalog">Предметы</button><span>›</span><button data-subject="${t.subject}">${esc(s.name)}</button><span>›</span><span>${esc(t.unit)}</span></div><section class="topic-hero new-topic-hero" style="${subjectStyle(t.subject)}"><div><span class="eyebrow">${esc(s.name)} · ${t.grade} КЛАСС</span><h1>${esc(t.title)}</h1><p>${countWord(qs.length,'шаг','шага','шагов')}: от первого открытия до собственной работы.</p><button class="btn btn-orange" data-card="${first<0?0:first}">${cardCount(t.id)?'Продолжить':'Начать маршрут'} <span>→</span></button><div class="topic-hero-progress"><span>${cardCount(t.id)} из ${qs.length} пройдено</span><span class="poster-progress"><i style="width:${percent(t)}%"></i></span></div></div>${illustration(t.subject,true,t.title)}</section><div class="section-title"><h2>Твой маршрут</h2><span class="muted">Можно вернуться к любому шагу</span></div><div class="lesson-route">${qs.map((q,i)=>`<button class="lesson-step ${finished(t.id,i)?'completed':''}" style="${subjectStyle(t.subject)}" data-card="${i}"><span class="step-number">${finished(t.id,i)?'✓':i+1}</span><span class="step-copy"><strong>${esc(q.stage||cardNames[i]||'Задание')}</strong><small>${status(t,i)}</small></span><span class="step-arrow">→</span></button>`).join('')}</div><details class="lesson-reference"><summary>Справочник темы <span>＋</span></summary><div>${rich(t.learn)}</div></details><div class="topic-source"><span>${esc(t.unit)}</span></div>`;
 };
 const legacyStart=startCard;
 startCard=(id,index)=>{
  const t=topic(id),q=C.questions(id)?.[index];if(!t||!q)return;
  if(!q.id){legacyStart(id,index);return;}
  const d=drafts[q.id]||{};const r=result(id).cards?.[index]||{};
  state.topic=id;state.grade=t.grade;state.card=index;
  state.practice={topic:id,card:index,question:q,text:d.text??r.text??'',numeric:d.text??r.text??'',strokes:d.strokes??r.strokes??[],hintLevel:d.hintLevel??r.hintLevel??0,solutionSeen:d.solutionSeen||r.solutionSeen||false,everSolution:d.everSolution||d.solutionSeen||r.solutionSeen||false,answered:false,attempts:d.attempts??r.attempts??0,firstTry:false,feedback:null,selected:null,order:d.order||[],choices:d.choices||{},reviewed:false,guideAssisted:!!result(id).guideOpenedAt&&index<3};
  save();go('practice');
 };
 function qStructured(q){return q.kind==='sequence'||q.kind==='group';}
 function numberValue(s){
  s=s.trim().replace(/−|–/g,'-').replace(/,/g,'.').replace(/\s+/g,'');
  if(!/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?:\/[+-]?\d+(?:\.\d+)?)?$/i.test(s))return NaN;
  const a=s.split('/').map(Number);return a.length===2?(a[1]===0?NaN:a[0]/a[1]):a[0];
 }
 function scalarCheck(value,q){
  let v=value.trim();if(q.unit&&v.endsWith(q.unit))v=v.slice(0,-q.unit.length).trim();
  const a=numberValue(v),b=numberValue(q.value);return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b));
 }
 // The checker is deliberately exposed for content/integration regression tests.
 window.SCHOOL_CHECK_SCALAR=scalarCheck;
 function artBoard(t,q){
  const root=/^Найди √(\d+)\.$/.exec(q.prompt);
  if(root&&Number(root[1])<=100&&Number.isInteger(Math.sqrt(Number(root[1])))){
   const n=Math.sqrt(Number(root[1]));return `<div class="concept-board square-model"><svg viewBox="0 0 240 170" role="img" aria-label="Квадрат площадью ${root[1]}. Найди неотрицательную длину стороны."><rect x="50" y="20" width="130" height="130" rx="5" fill="var(--wash)" stroke="var(--ink)" stroke-width="2"/>${Array.from({length:n-1},(_,i)=>`<path d="M${50+130*(i+1)/n} 20v130M50 ${20+130*(i+1)/n}h130" stroke="var(--ink)" opacity=".2"/>`).join('')}<text x="115" y="93" text-anchor="middle" fill="var(--ink)" font-size="26">S = ${root[1]}</text><text x="202" y="91" fill="var(--ink)" font-size="24">?</text></svg><span>Площадь известна. Как найти сторону?</span></div>`;
  }
  return window.SCHOOL_VISUAL_BOARD?window.SCHOOL_VISUAL_BOARD(t,q):'';
 }
 function contextPanel(t,q){
 const scene=q.notes?.['Сцена']||t.scene;
 const needed=!!q.notes?.['Сцена']||/исходн|данн.{0,6}(?:схем|текст|рисунк)|по схеме|по рисунку|этих|этого текста|предложенн|подготовленн/i.test(q.prompt);
 const quotes=scene?.match(/«[^»]+»/g)||[];
 const excerpts=quotes.filter(x=>x.length>70);
 if(excerpts.length)return `<section class="source-context"><span>Материал для задания</span><p>${excerpts.map(rich).join('<br>')}</p></section>`;
 return `<details class="scene-context" ${needed?'open':''}><summary>Ситуация и объекты темы</summary><p>${rich(scene)}</p></details>`;
 }
 function answerPanel(t,p){const q=p.question;
  if(q.kind==='sequence')return `<div class="sequence-work"><span class="field-label">Твой порядок</span><div class="sequence-slots">${q.items.map((_,i)=>`<button class="sequence-slot ${p.order[i]!==undefined?'filled':''}" data-sequence-remove="${i}" ${p.answered?'disabled':''}><b>${i+1}</b><span>${p.order[i]!==undefined?esc(q.items[p.order[i]]):'Поставь сюда'}</span></button>`).join('')}</div><span class="field-label">Нажимай на элементы по порядку</span><div class="sequence-pool">${q.items.map((x,i)=>({x,i})).sort((a,b)=>b.i-a.i).filter(x=>!p.order.includes(x.i)).map(x=>`<button data-sequence-add="${x.i}" ${p.answered?'disabled':''}>${esc(x.x)} <span>＋</span></button>`).join('')}</div></div>`;
  if(q.kind==='group')return `<div class="group-work ${q.singleChoice?'single-choice':''}"><p class="response-note">${q.singleChoice?'Выбери один вариант ответа.':`Для каждого объекта выбери ${q.correct.some(Array.isArray)?'все подходящие группы':'подходящую группу'}.`}</p>${q.items.map((x,i)=>`<div class="group-row"><span class="group-object">${esc(x)}</span><div class="group-targets">${q.targets.map((target,j)=>`<button data-group-item="${i}" data-group-target="${j}" aria-pressed="${(p.choices[i]||[]).includes(j)}" class="${(p.choices[i]||[]).includes(j)?'selected':''}" ${p.answered?'disabled':''}>${(p.choices[i]||[]).includes(j)?'<span aria-hidden="true">✓ </span>':''}${esc(target)}</button>`).join('')}</div></div>`).join('')}</div>`;

  if(q.kind==='choice'||q.kind==='multi')return choiceOptions(q,p);
  if(q.kind==='order')return orderOptions(q,p);
  if(q.kind==='scalar')return `<label class="field-label" for="cardResponse">Твой ответ</label><div class="scalar-field"><input id="cardResponse" class="input" inputmode="text" autocomplete="off" value="${esc(p.text)}" placeholder="Введи число или дробь" ${p.answered?'disabled':''}>${q.unit?`<span>${esc(q.unit)}</span>`:''}</div><p class="response-note">Можно записать число с запятой или обыкновенную дробь.</p>`;
  return `<label class="field-label" for="cardResponse">Твоя работа</label><textarea id="cardResponse" class="textarea written-response" placeholder="Запиши ответ и объясни, как ты рассуждал. Для исследования добавь наблюдения и источники." ${p.answered?'disabled':''}>${esc(p.text)}</textarea><div class="response-meta"><span>Черновик сохраняется в этом браузере</span><span>${(p.text||'').length} знаков</span></div>`;
 }
 const legacyPractice=practice;
 practice=()=>{
  const p=state.practice;if(!p)return catalog();const q=p.question;if(!q.id)return legacyPractice();
  const t=topic(p.topic),qs=C.questions(t.id),s=subject(t.subject);const shown=p.solutionSeen;
  const guided=p.hintLevel>0;
  const hints=[`Сначала выдели, что известно и что требуется. ${q.action||'Выбери способ ответа и объясни существенный шаг.'}`,t.learn,q.hint];
  return `<section class="learning-shell" style="${subjectStyle(t.subject)}"><header class="learning-header"><button class="game-back" data-open="${esc(t.id)}">← К теме</button><div class="learning-stepper" aria-label="Шаг ${p.card+1} из ${qs.length}">${qs.map((x,i)=>`<button class="step-dot ${p.card===i?'current':finished(t.id,i)?'complete':''}" data-jump-card="${i}" aria-label="Карточка ${i+1}: ${esc(x.stage)}" ${p.card===i?'aria-current="step"':''}>${finished(t.id,i)?'✓':''}</button>`).join('')}</div><span class="learning-counter">${p.card+1} <span>/ ${qs.length}</span></span></header><div class="learning-body"><div class="learning-title"><span class="eyebrow">${esc(s.name)} · ${t.grade} КЛАСС</span><div class="stage-badge">${esc(q.stage)}</div><h1>${esc(t.title)}</h1></div><div class="learning-workspace"><aside class="learning-companion">${illustration(t.subject,true,t.title)}<div class="companion-talk"><img src="raccoon.svg" alt="Енот-помощник"><p>${q.stage==='Исправь енота'?'Я мог ошибиться. Проверь моё рассуждение!':p.card===3?'Сначала попробуй сам. Я рядом, если нужна помощь.':'Здесь можно пробовать, ошибаться и находить свой способ.'}</p></div><button class="reference-button" data-rule>Открыть справочник <span>↗</span></button><span class="card-id">${esc(q.id)}</span></aside><div class="student-desk"><div class="task-paper"><span class="task-kicker">${q.stage==='Исправь енота'?'НАЙДИ И ИСПРАВЬ ОШИБКУ':'ТВОЁ ЗАДАНИЕ'}</span><div class="task-prompt">${rich(q.prompt)}</div>${artBoard(t,q)}${contextPanel(t,q)}${answerPanel(t,p)}${!qStructured(q)&&['math','algebra','geometry','physics','chemistry','statistics'].includes(t.subject)?`<div class="math-keyboard" aria-label="Символы для ответа">${['−','/','²','³','√','π','°','≤','≥','→'].map(x=>`<button data-symbol="${esc(x)}" ${p.answered?'disabled':''}>${x}</button>`).join('')}</div>`:''}<details class="scratch-details" ${p.strokes.length?'open':''}><summary>Черновик для рисунка и схемы</summary><div class="scratch-toolbar"><span>Мышь или палец · свободный рисунок</span><button data-clear-sketch>Очистить рисунок</button></div><svg id="scratchBoard" viewBox="0 0 600 260" role="img" aria-label="Черновик: свободный рисунок без автоматической проверки"><defs><pattern id="scratchGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#e4e9e7" stroke-width=".7"/></pattern></defs><rect width="600" height="260" fill="url(#scratchGrid)"/>${p.strokes.map(points=>`<polyline points="${esc(points.map(a=>a.join(',')).join(' '))}" fill="none" stroke="#446d72" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg></details></div>${guided?`<div class="hint-panel" role="status"><span class="hint-label">Подсказка ${p.hintLevel} из 3</span><p>${rich(hints[Math.min(2,p.hintLevel-1)]||q.hint)}</p></div>`:''}${p.showRule?`<div class="hint-panel reference-panel"><span class="hint-label">Справочник</span><p>${rich(t.learn)}</p></div>`:''}${p.feedback?`<div class="feedback ${p.feedback.good?'good':'try'}" role="status"><strong>${esc(p.feedback.title)}</strong><span>${rich(p.feedback.text)}</span></div>`:''}${shown?`<section class="answer-review"><span class="hint-label">Сверка после твоей попытки</span><h2>${q.kind==='written'?'Ответ и критерии':'Разбор решения'}</h2><p>${rich(q.answer)}</p><div class="review-explanation">${rich(q.hint)}</div>${q.kind==='written'&&!p.answered?`<label class="review-check"><input type="checkbox" id="reviewAgreement" ${p.reviewed?'checked':''}>Я сравнил свою работу с ответом и критериями</label><div class="review-buttons"><button class="btn btn-mint" data-review-result="reviewed" ${p.reviewed?'':'disabled'}>Соответствует критериям</button><button class="btn btn-light" data-revise>Доработать ответ</button><button class="btn btn-light" data-review-result="pending">Оставить для проверки учителем</button></div><p class="response-note">Это самостоятельная сверка. Учитель сможет оценить содержание и полноту ответа.</p>`:''}</section>`:''}<div class="learning-actions">${p.answered?`<button class="btn btn-orange" id="finishCard">Сохранить и продолжить →</button>`:shown&&q.kind!=='written'?`<button class="btn btn-light" data-revise>Попробовать ещё</button><button class="btn btn-orange" data-study-only>Отметить разбор изученным</button>`:shown&&q.kind==='written'?'':`<button class="btn btn-orange" id="checkAnswer">${q.kind==='written'?'Сохранить и сверить':'Проверить ответ'} <span>→</span></button><button class="btn btn-light" id="hintButton">Подсказка${guided?` ${p.hintLevel}/3`:''}</button>${p.attempts>0?'<button class="btn-link" id="showSolution">Открыть разбор</button>':''}`}</div></div></div></div><footer class="learning-footer"><span>${esc(t.unit)}</span><span>${shown?'Разбор открыт':p.guideAssisted?'Со справочником':guided||p.showRule?'С помощью':'Самостоятельная попытка'}</span></footer></section>`;
 };
 const legacyCheck=checkAnswer;
 checkAnswer=()=>{
  const p=state.practice;if(!p?.question.id){legacyCheck();return;}if(p.answered)return;
  if(qStructured(p.question)){
   const q=p.question,complete=q.kind==='sequence'?p.order.length===q.items.length:q.items.every((_,i)=>(p.choices[i]||[]).length);
   if(!complete){toast(q.kind==='sequence'?'Расположи все элементы.':'Выбери группы для каждого объекта.');return;}
   p.attempts++;
   const correct=q.kind==='sequence'?p.order.every((x,i)=>x===q.correct[i]):q.items.every((_,i)=>JSON.stringify([...(p.choices[i]||[])].sort())===JSON.stringify((Array.isArray(q.correct[i])?[...q.correct[i]]:[q.correct[i]]).sort()));
   p.text=q.kind==='sequence'?p.order.map(i=>q.items[i]).join(' → '):q.items.map((x,i)=>x+': '+(p.choices[i]||[]).map(j=>q.targets[j]).join(', ')).join('; ');
   if(correct){p.answered=true;p.firstTry=p.attempts===1&&!p.hintLevel&&!p.everSolution&&!p.guideAssisted;p.feedback={good:true,title:'Получилось!',text:q.hint};}
   else p.feedback={good:false,title:q.singleChoice?'Пока нет. Попробуй ещё.':'Есть несовпадение. Проверь ещё раз.',text:q.singleChoice?q.hint:'Подумай о признаке каждой группы или порядке элементов. Можно открыть подсказку.'};
   saveDraft();render();return;
  }
  p.text=document.getElementById('cardResponse')?.value??p.text;
  if(!p.text.trim()){toast('Сначала запиши свой ответ.');document.getElementById('cardResponse')?.focus();return;}
  p.attempts++;
  if(p.question.kind==='written'){
   p.solutionSeen=true;p.everSolution=true;p.reviewed=false;p.feedback=null;saveDraft();render();return;
  }
  if(scalarCheck(p.text,p.question)){
   p.firstTry=p.attempts===1&&!p.hintLevel&&!p.showRule&&!p.everSolution&&!p.guideAssisted;p.answered=true;
   p.feedback={good:true,title:'Верно! Шаг пройден.',text:p.question.hint};
  }else p.feedback={good:false,title:'Пока не совпало. Попробуй ещё.',text:'Проверь вычисления, знак и единицы. Можно открыть подсказку или разобрать решение.'};
  saveDraft();render();
 };
 const legacyFinish=finishCard;
 finishCard=()=>{
  const p=state.practice;if(!p?.question.id){legacyFinish();return;}if(!p.answered)return;
  const r=result(p.topic),before=r.cards?.[p.card]||{};
  const entry={done:p.reviewStatus!=='pending',firstTry:!!(before.firstTry||p.firstTry),attempts:p.attempts,text:p.text,strokes:p.strokes,order:p.order,choices:p.choices,hintLevel:p.hintLevel,solutionSeen:p.solutionSeen,status:p.reviewStatus||'solved',submitted:p.reviewStatus==='pending',updated:Date.now()};
  // Repeating a previously completed task must not erase its best result.
  if(before.done&&!entry.done){entry.done=true;entry.status=before.status||'solved';}
  state.results[p.topic]={...r,cards:{...r.cards,[p.card]:entry},updated:Date.now()};
  save();saveDraft();storeDraft();go('done');
 };
 const legacyDone=done;
 done=()=>{
  const p=state.practice;if(!p?.question.id)return legacyDone();const t=topic(p.topic),pending=p.reviewStatus==='pending',studied=p.reviewStatus==='studied';
  return `<section class="lesson-done" style="${subjectStyle(t.subject)}"><div class="done-art">${illustration(t.subject,true,t.title)}<span>${pending?'…':'✓'}</span></div><div class="eyebrow">${esc(t.title)}</div><h1>${pending?'Работа сохранена':studied?'Разбор изучен':'Ещё один шаг вперёд'}</h1><p>${pending?'Ответ сохранён в этом браузере и ждёт проверки. К нему можно вернуться в разделе «Мой прогресс».':studied?'Попробуй следующую задачу самостоятельно. Просмотр решения отмечен отдельно.':p.reviewStatus==='reviewed'?'Ты сверил ответ с критериями. Содержательную оценку может дополнить учитель.':'Ответ проверен. Можно переходить к следующей карточке.'}</p><div class="done-progress"><span>${cardCount(t.id)} из ${total(t)} пройдено</span><span class="poster-progress"><i style="width:${percent(t)}%"></i></span></div><div class="task-actions">${p.card+1<total(t)?`<button class="btn btn-orange" data-nextcard="${p.card+1}">Следующий шаг →</button>`:`<button class="btn btn-orange" data-go="catalog">Выбрать новую тему →</button>`}<button class="btn btn-light" data-open="${esc(t.id)}">К маршруту</button></div></section>`;
 };
 const oldProfile=profile;
 profile=()=>oldProfile()+`<section class="card review-inbox"><h2>Сохранённые работы</h2><p>«Решено», «Проверено по критериям» и «Разбор изучен» сохраняются раздельно. Открытые работы ждут содержательной проверки учителем.</p><div class="task-actions"><button class="btn btn-light" data-export-progress>Скачать прогресс и ответы</button><label class="btn btn-light import-label">Восстановить из файла<input type="file" id="importProgress" accept="application/json,.json" hidden></label></div>${C.topics.flatMap(t=>Object.entries(result(t.id).cards||{}).filter(([,v])=>v.submitted).map(([i])=>`<button class="pending-work" data-resume-topic="${esc(t.id)}" data-resume-card="${i}"><span>${esc(t.title)} · ${Number(i)+1}</span><small>Ждёт проверки →</small></button>`)).join('')}</section>`;
 const originalRender=render;
 render=()=>{
  if(state.page==='materials')state.page='catalog';
  originalRender();
  document.body.classList.toggle('in-lesson',state.page==='practice');
 };
 function download(name,text,type='text/plain;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 function responseDownload(){const p=state.practice;if(!p)return;const t=topic(p.topic);download(`${p.question.id||t.id}_работа.txt`,`${subject(t.subject).name}, ${t.grade} класс\n${t.title}\n${p.question.id||''}\n\nЗАДАНИЕ\n${p.question.prompt}\n\nМОЯ РАБОТА\n${p.text||p.numeric||''}\n\nПомощь: ${p.hintLevel||0}/3. Разбор: ${p.solutionSeen?'открыт':'не открыт'}.\nСтатус: ${p.reviewStatus||'черновик'}`);if(p.strokes?.length)download(`${p.question.id}_рисунок.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 260"><rect width="600" height="260" fill="white"/>${p.strokes.map(a=>`<polyline points="${a.map(b=>b.join(',')).join(' ')}" fill="none" stroke="#446d72" stroke-width="2.5"/>`).join('')}</svg>`,'image/svg+xml');}
 document.addEventListener('click',e=>{
  const b=e.target.closest('button,[data-materials]');if(!b)return;
  const p=state.practice;
  function handled(){e.preventDefault();e.stopImmediatePropagation();}
  if(b.matches('[data-filter],[data-grade],[data-subject]')){pageNumber=0;query='';progressFilter='all';window.SCHOOL_ENGLISH_FILTER='all';return;}
  if(b.matches('[data-materials]')){handled();go('catalog');return;}
  if(b.hasAttribute('data-progress-filter')){handled();progressFilter=b.dataset.progressFilter;pageNumber=0;render();document.querySelector('[data-progress-filter="'+progressFilter+'"]').focus({preventScroll:true});return;}
  if(b.matches('[data-page]')){handled();pageNumber=Number(b.dataset.page);render();document.querySelector('.library-tools')?.scrollIntoView({block:'start',behavior:'smooth'});return;}
  if(b.matches('[data-reset-search]')){handled();query='';progressFilter='all';pageNumber=0;window.SCHOOL_ENGLISH_FILTER='all';render();return;}
  if(b.matches('[data-resume-topic]')){handled();startCard(b.dataset.resumeTopic,Number(b.dataset.resumeCard));return;}
  if(b.matches('[data-export-progress]')){handled();storeDraft();download('понятно-прогресс.json',JSON.stringify({version:4,grade:state.grade,results:state.results,drafts},null,2),'application/json');return;}
  if(!p?.question.id)return;
  if(b.matches('[data-jump-card]')){handled();saveDraft();storeDraft();startCard(p.topic,Number(b.dataset.jumpCard));return;}
  if(b.matches('[data-sequence-add]')){handled();if(p.answered)return;const i=Number(b.dataset.sequenceAdd);if(!p.order.includes(i))p.order.push(i);saveDraft();render();return;}
  if(b.matches('[data-sequence-remove]')){handled();if(p.answered)return;p.order.splice(Number(b.dataset.sequenceRemove),1);saveDraft();render();return;}
  if(b.matches('[data-group-item]')){handled();if(p.answered)return;const i=Number(b.dataset.groupItem),j=Number(b.dataset.groupTarget);const a=p.choices[i]||[];p.choices[i]=p.question.correct.some(Array.isArray)?a.includes(j)?a.filter(x=>x!==j):[...a,j]:[j];saveDraft();render();return;}
  if(b.id==='hintButton'){handled();p.hintLevel=Math.min(3,p.hintLevel+1);p.firstTry=false;saveDraft();render();return;}
  if(b.id==='showSolution'){handled();p.solutionSeen=true;p.everSolution=true;p.firstTry=false;saveDraft();render();return;}
  if(b.matches('[data-rule]')){handled();p.showRule=!p.showRule;if(p.showRule){p.hintLevel=Math.max(1,p.hintLevel);p.firstTry=false;}saveDraft();render();return;}
  if(b.matches('[data-revise]')){handled();p.solutionSeen=false;p.reviewed=false;p.feedback=null;render();document.getElementById('cardResponse')?.focus();return;}
  if(b.matches('[data-review-result]')){handled();if(b.dataset.reviewResult==='reviewed'&&!p.reviewed)return;p.reviewStatus=b.dataset.reviewResult;p.answered=true;p.firstTry=false;finishCard();return;}
  if(b.matches('[data-study-only]')){handled();p.reviewStatus='studied';p.answered=true;p.firstTry=false;finishCard();return;}
  if(b.matches('[data-symbol]')){handled();const x=document.getElementById('cardResponse');if(!x||x.disabled)return;const pos=x.selectionStart||0,end=x.selectionEnd||pos;x.value=x.value.slice(0,pos)+b.dataset.symbol+x.value.slice(end);p.text=x.value;saveDraft();x.focus();x.setSelectionRange(pos+b.dataset.symbol.length,pos+b.dataset.symbol.length);return;}
  if(b.matches('[data-clear-sketch]')){handled();p.strokes=[];saveDraft();render();return;}
  if(b.matches('[data-download-answer]')){handled();responseDownload();}
 },true);
 document.addEventListener('input',e=>{
  if(e.target.id==='cardResponse'&&state.practice){state.practice.text=e.target.value;state.practice.numeric=e.target.value;saveDraft();const count=document.querySelector('.response-meta span:last-child');if(count)count.textContent=e.target.value.length+' знаков';}
  if(e.target.id==='topicSearch'){
   query=e.target.value;pageNumber=0;const start=e.target.selectionStart;
   // Keep the input node in place while updating results, avoiding focus loss/IME resets.
   const holder=document.createElement('div');holder.innerHTML=catalog();const next=holder.querySelector('#libraryResults');document.getElementById('libraryResults').replaceWith(next);
  }
 });
 document.addEventListener('change',async e=>{
  if(e.target.id==='progressFilter'){progressFilter=e.target.value;pageNumber=0;render();}
  
  if(e.target.id==='reviewAgreement'){
   state.practice.reviewed=e.target.checked;const b=document.querySelector('[data-review-result="reviewed"]');if(b)b.disabled=!e.target.checked;
  }
  if(e.target.id==='importProgress'){
   try{
    const f=e.target.files[0];if(!f)return;if(f.size>20*1024*1024)throw new Error('Слишком большой файл');
    const d=JSON.parse(await f.text());if(d.version!==4||typeof d.results!=='object'||!d.results||Array.isArray(d.results))throw new Error('Неверный формат');
    for(const [id,r] of Object.entries(d.results)){
     if(!topic(id)||!r?.cards||typeof r.cards!=='object')continue;
     const current=result(id);const entries={...current.cards};
     for(const [i,v] of Object.entries(r.cards)){
      if(!/^\d+$/.test(i)||Number(i)>=total(topic(id))||!v||typeof v!=='object')continue;
      const strokes=Array.isArray(v.strokes)?v.strokes.filter(a=>Array.isArray(a)&&a.every(b=>Array.isArray(b)&&b.length===2&&b.every(Number.isFinite))).slice(0,1000):[];
      if(entries[i]?.done&&!v.done)continue;
      entries[i]={done:v.done===true,firstTry:v.firstTry===true,attempts:Number.isFinite(v.attempts)?v.attempts:0,text:typeof v.text==='string'?v.text.slice(0,200000):'',strokes,status:['solved','reviewed','studied','pending'].includes(v.status)?v.status:'pending',submitted:v.submitted===true,updated:Date.now()};
     }
     state.results[id]={cards:entries,updated:Date.now()};
    }
    // Drafts are untrusted imports; only known IDs, plain text and safe coordinates.
    const known=new Set(Object.values(M.cards).flat().map(q=>q.id));
    for(const [id,draft] of Object.entries(d.drafts||{}))if(known.has(id)&&draft&&typeof draft==='object')drafts[id]={text:typeof draft.text==='string'?draft.text.slice(0,200000):'',strokes:Array.isArray(draft.strokes)?draft.strokes.filter(a=>Array.isArray(a)&&a.every(b=>Array.isArray(b)&&b.length===2&&b.every(Number.isFinite))).slice(0,1000):[],hintLevel:Math.max(0,Math.min(3,Number(draft.hintLevel)||0)),solutionSeen:draft.solutionSeen===true,everSolution:draft.everSolution===true||draft.solutionSeen===true,attempts:Number.isInteger(draft.attempts)?Math.max(0,draft.attempts):0};
    save();storeDraft();render();toast('Работы и прогресс восстановлены.');
   }catch{toast('Не удалось прочитать файл прогресса. Выбери экспорт этого приложения.');}
  }
 });
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='cardResponse'&&state.practice?.question.kind==='scalar'){e.preventDefault();checkAnswer();}});
 let drawing=null;
 document.addEventListener('pointerdown',e=>{
  const svg=e.target.closest('#scratchBoard');if(!svg||!state.practice||state.practice.answered)return;
  const point=coordinate(svg,e);state.practice.strokes.push([point]);drawing={svg,index:state.practice.strokes.length-1};svg.setPointerCapture(e.pointerId);
  const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('fill','none');line.setAttribute('stroke','#446d72');line.setAttribute('stroke-width','2.5');line.setAttribute('stroke-linecap','round');svg.appendChild(line);drawing.line=line;
 });
 function coordinate(svg,e){const r=svg.getBoundingClientRect();return [Math.round(Math.max(0,Math.min(600,(e.clientX-r.left)/r.width*600))),Math.round(Math.max(0,Math.min(260,(e.clientY-r.top)/r.height*260)))];}
 document.addEventListener('pointermove',e=>{if(!drawing)return;const a=state.practice.strokes[drawing.index];a.push(coordinate(drawing.svg,e));drawing.line.setAttribute('points',a.map(p=>p.join(',')).join(' '));});
 for(const name of ['pointerup','pointercancel'])document.addEventListener(name,()=>{if(drawing){drawing=null;saveDraft();}});
 window.addEventListener('pagehide',()=>{saveDraft();storeDraft();});
 window.addEventListener('hashchange',()=>{
  saveDraft();storeDraft();
  let value;try{value=decodeURIComponent(location.hash.slice(1));}catch{return;}
  if(value.startsWith('topic=')&&topic(value.slice(6))){openTopic(value.slice(6));return;}
  if(value.startsWith('card=')){
   const cut=value.lastIndexOf(':'),id=value.slice(5,cut),i=Number(value.slice(cut+1));
   if(topic(id)&&Number.isInteger(i)&&i>=0&&C.questions(id)?.[i])startCard(id,i);
   return;
  }
  const page=value.replace(/^page=/,'');if(['home','catalog','scan','profile','materials'].includes(page))go(page);
 });
 if(location.hash==='#page=materials'){state.page='catalog';history.replaceState(null,'','#page=catalog');}
 if(state.page==='practice'&&state.practice?.question.id)startCard(state.topic,state.card);else render();
})();
