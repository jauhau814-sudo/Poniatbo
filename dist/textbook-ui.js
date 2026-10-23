/* Source attribution and honest review of open textbook questions. */
(()=>{
 'use strict';
 const attribution=source=>`${esc(source.title)}${source.paragraph?` · § ${source.paragraph}`:''}${source.label?` · ${esc(source.label)}`:''}${source.work?` · работа ${source.work}`:''}${source.number?` · вопрос ${source.number}`:''}${source.printedPages?.length?` · с. ${esc(source.printedPages.join(source.pageRange?'–':', '))}`:''}`;
 function pictures(images){return images.map((p,i)=>`<figure class="source-page"><button type="button" class="source-zoom" data-source-zoom aria-expanded="false">Увеличить</button><div class="source-image-frame" tabindex="0" aria-label="Изображение страницы. После увеличения можно прокручивать"><img src="${esc(p.url)}" alt="Исходное задание из учебника, страница ${p.printedPage}" loading="lazy" decoding="async"></div><figcaption>Страница ${p.printedPage}${images.length>1?` · фрагмент ${i+1} из ${images.length}`:''}</figcaption></figure>`).join('')}
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-source-zoom]');if(!button)return;
  const figure=button.closest('.source-page');const expanded=figure.classList.toggle('zoomed');
  button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'Уменьшить':'Увеличить';
 });
 const oldPractice=practice;
 practice=()=>{
  const q=state.practice?.question;
  let html=oldPractice();if(!q?.source)return html;
  const start=html.indexOf('<div class="task-prompt">'),end=html.indexOf('</div>',start);
  const original=`<div class="textbook-attribution"><span>ИЗ ВАШЕГО УЧЕБНИКА</span><p>${attribution(q.source)}</p></div><details class="source-original" ${q.source.imageAuthoritative||q.source.work||/рисун|рис\.|таблиц|схем|черт[её]ж|координат|диаграмм/i.test(q.prompt)?'open':''}><summary>Оригинал задания${q.sourceImages?.length>1?' и продолжение':''}</summary>${pictures(q.sourceImages||[])}</details>${q.teacherOnly?'<p class="teacher-review-note">Ответ сохранится для проверки учителем. Программа не оценивает развёрнутую работу автоматически.</p>':''}`;
  if(end>=0)html=html.slice(0,end+6)+original+html.slice(end+6);
  if(q.teacherOnly)html=html.replace('Сохранить и сверить','Подготовить к проверке');
  return html.replace('class="learning-shell"','class="learning-shell textbook-task"');
 };
 const oldCheck=checkAnswer;
 checkAnswer=()=>{
  const p=state.practice,q=p?.question;if(!q?.teacherOnly)return oldCheck();if(p.answered)return;
  p.text=document.getElementById('cardResponse')?.value??p.text;
  if(!p.text?.trim()){toast('Сначала запиши ответ или опиши результат работы.');return;}
  p.attempts++;p.answered=true;p.firstTry=false;p.reviewStatus='pending';
  p.feedback={good:false,title:'Работа готова к проверке',text:'Нажми «Сохранить и продолжить». Работа останется в разделе «Мой прогресс» со статусом ожидания проверки.'};
  render();
 };
 const oldRender=render;
 render=()=>{
  oldRender();
  if(state.page!=='guide')return;
  const g=window.SCHOOL_GUIDES[state.topic];if(!g?.source||!g.referenceImages?.length)return;
  const app=document.getElementById('app');
  const reading=`<section class="guide-section source-reading"><span class="eyebrow">ПО ПРИЛОЖЕННОМУ УЧЕБНИКУ</span><h2>${g.source.work?'Исходная инструкция':'Страницы параграфа'}</h2><p>${attribution(g.source)}</p><p>Здесь можно найти исходный текст, рисунки и таблицы, на которые ссылаются вопросы.</p><details class="source-original"><summary>Прочитать страницы ${g.source.printedPages?.join('–')||g.referenceImages[0].printedPage}${g.referenceImages.some(p=>p.printedPage>(g.source.printedPages?.at(-1)||Infinity))?' и приложение':''}</summary>${pictures(g.referenceImages)}</details></section>`;
  app.innerHTML=app.innerHTML.replace('<section id="guideSteps"',reading+'<section id="guideSteps"');
  if(!g.examples.length)app.innerHTML=app.innerHTML.replace(/<section id="guideExamples"[\s\S]*?<\/section>/,'').replace(/<button data-guide-section="guideExamples">[\s\S]*?<\/button>/,'');
 };
 render();
})();
