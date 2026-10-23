/* Topic-appropriate visual supports. Never derives pictures from hidden answers. */
(()=>{
 'use strict';
 const E=esc;
 function strips(n,d){return `<svg viewBox="0 0 250 90" role="img" aria-label="${n} из ${d} равных частей">${Array.from({length:d},(_,i)=>`<rect x="${12+i*225/d}" y="16" width="${225/d-3}" height="42" rx="4" fill="${i<n?'var(--ink)':'white'}" opacity="${i<n?'.65':'1'}" stroke="var(--ink)"/>`).join('')}<text x="125" y="82" text-anchor="middle" fill="var(--ink)" font-size="18">${n}/${d}</text></svg>`;}
 window.SCHOOL_VISUAL_BOARD=(t,q)=>{
  if(q.source)return '';
  if(q.visual?.type==='words')return `<div class="concept-board word-garden"><span class="visual-label">${E(q.visual.label)}</span><div>${q.visual.words.map((w,i)=>`<span class="word-flower flower-${i}">${E(w)}</span>`).join('')}</div><small>Найди смысл каждого слова</small></div>`;
  if(t.subject==='english')return `<div class="concept-board language-studio"><div class="language-bubbles" aria-hidden="true"><span>Hello!</span><span>Let's try</span></div><div><span class="visual-label">${E(q.visual?.label||'Language lab')}</span><p>${q.kind==='sequence'?'Кто? → Действие → Остальная фраза':'Прочитай фразу целиком. Проверь конструкцию и смысл.'}</p></div></div>`;
  const fractions=[...q.prompt.matchAll(/\b(\d{1,2})\/(\d{1,2})\b/g)].slice(0,2);
  if(fractions.length&&fractions.every(m=>+m[2]>0&&+m[2]<=12&&+m[1]<=+m[2]))return `<div class="concept-board fraction-studio"><span class="visual-label">Дробь — часть целого</span><div>${fractions.map(m=>strips(+m[1],+m[2])).join('')}</div><small>Каждая полоска разделена на равные части</small></div>`;
  const steps=q.kind==='sequence'?['Посмотри на элементы','Собери порядок','Проверь смысл']:q.kind==='group'?['Сравни объекты','Найди признак','Выбери группу']:q.kind==='scalar'?['Выдели данные','Выполни действие','Проверь ответ']:['Прочитай вопрос','Найди обоснование','Запиши вывод'];
  return `<div class="visual-method" aria-label="Как выполнить задание">${steps.map((s,i)=>`<span><b>${i+1}</b>${s}${i<2?'<i aria-hidden="true">→</i>':''}</span>`).join('')}</div>`;
 };
 const oldCatalog=catalog;
 catalog=()=>{let html=oldCatalog();if(state.subject==='english')html=html.replace('<div class="library-tools">',`<div class="english-course-note"><b>Выбери учебную линию</b><p>Rainbow English: доступны присланные части за 5–9 классы. Starlight: 9 класс, углублённый уровень. Исходные задания идут блоками по страницам, разминки отмечены отдельно. Для слушания нужны аудиозаписи к изданию.</p><label>Учебная линия<select id="englishCourse"><option value="all">Все линии</option><option value="rainbow" ${window.SCHOOL_ENGLISH_FILTER==='rainbow'?'selected':''}>Rainbow English</option><option value="starlight" ${window.SCHOOL_ENGLISH_FILTER==='starlight'?'selected':''}>Starlight</option></select></label></div><div class="library-tools">`);return html;};
 document.addEventListener('change',e=>{if(e.target.id==='englishCourse'){window.SCHOOL_ENGLISH_FILTER=e.target.value;render();}});
 const oldPractice=practice;
 practice=()=>{let html=oldPractice();const q=state.practice?.question;if(q?.mediaWarning)html=html.replace('<p class="teacher-review-note">','<p class="audio-source-note">На странице есть задание на слушание. Для него нужна аудиозапись к учебнику; пока можно выполнить письменные пункты.</p><p class="teacher-review-note">');return html;};
 render();
})();
