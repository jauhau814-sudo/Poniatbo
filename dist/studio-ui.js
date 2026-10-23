/* Clear separation between the public introduction and the study workspace. */
(()=>{
 'use strict';const u=window.SCHOOL_LOCAL_PROFILE;
 home=()=>`<section class="studio-dashboard"><span class="eyebrow">ТВОЯ ПРАКТИКА · 5–9 КЛАССЫ</span><h1>${u?'С возвращением, '+esc(u.name)+'.':'С чего начнём?'}</h1><p>Выбери тему для занятия или вернись к работе, в которой было трудно.</p><div class="studio-start"><button class="studio-start-item" data-go="catalog"><span>01 / БИБЛИОТЕКА</span><strong>Выбрать предмет<br>и тему</strong><b aria-hidden="true">↗</b></button><button class="studio-start-item" data-go="scan"><span>02 / РАЗБОР РАБОТЫ</span><strong>Разобраться<br>в ошибке</strong><b aria-hidden="true">↗</b></button></div><div class="studio-current"><div><b>${allCards()}</b><span>карточек завершено</span></div><button class="btn btn-light" data-go="profile">Мой прогресс →</button></div></section>`;
 const originalRender=render;
 render=()=>{originalRender();const node=document.querySelector('.profile-dot');if(node&&u)node.textContent=u.name.slice(0,1).toUpperCase();};
 document.addEventListener('click',e=>{if(e.target.closest('[data-local-logout]')){sessionStorage.removeItem('schoolSimulatorLocalSessionV1');location.assign('index.html');}});
 const args=new URLSearchParams(location.search),grade=Number(args.get('grade')),sid=args.get('subject');
 if([5,6,7,8,9].includes(grade)){state.grade=grade;save();}
 if(sid&&C.subjects.some(s=>s.id===sid&&s.grades.includes(state.grade)))state.subject=sid;
 if(grade||sid)window.SCHOOL_ENGLISH_FILTER='all';
 if(args.has('grade')||args.has('subject'))history.replaceState(null,'',location.pathname+location.hash);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelector('.header-nav').classList.remove('open');const b=document.getElementById('menuToggle');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Открыть меню');}});
 document.getElementById('menuToggle').addEventListener('click',e=>e.currentTarget.setAttribute('aria-label',e.currentTarget.getAttribute('aria-expanded')==='true'?'Закрыть меню':'Открыть меню'));
 document.addEventListener('click',e=>{const b=e.target.closest('[data-grade]');if(b)document.querySelector('[data-grade="'+b.dataset.grade+'"]').focus({preventScroll:true});});
 render();
})();

