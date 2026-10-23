(() => {
  'use strict';

  const USERS_KEY = 'schoolSimulatorLocalUsersV1';
  const SESSION_KEY = 'schoolSimulatorLocalSessionV1';
  const dialog = document.getElementById('authDialog');
  const form = document.getElementById('authForm');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const nameField = document.getElementById('nameField');
  const confirmField = document.getElementById('confirmField');
  const displayName = document.getElementById('displayName');
  const login = document.getElementById('login');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  const error = document.getElementById('formError');
  const submitButton = document.getElementById('submitButton');
  const switchPrompt = document.getElementById('switchPrompt');
  const switchMode = document.getElementById('switchMode');
  let mode = 'login';

  function setMode(nextMode) {
    mode = nextMode;
    const registering = mode === 'register';
    form.reset();
    error.textContent = '';
    nameField.hidden = !registering;
    confirmField.hidden = !registering;
    displayName.required = registering;
    confirmPassword.required = registering;
    password.type='password';document.getElementById('togglePassword').textContent='Показать';
    password.autocomplete = registering ? 'new-password' : 'current-password';
    title.textContent = registering ? 'Начнём знакомство.' : 'С возвращением.';
    subtitle.textContent = registering ? 'Придумай логин и пароль. Прогресс будет сохраняться в профиле.' : 'Введи логин и пароль, чтобы продолжить.';
    submitButton.firstChild.textContent = registering ? 'Зарегистрироваться ' : 'Войти ';
    switchPrompt.textContent = registering ? 'Уже есть учётная запись?' : 'Нет учётной записи?';
    switchMode.textContent = registering ? 'Войти' : 'Зарегистрироваться';
    login.focus();
  }

  function readUsers() {
    let value;try{value = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');}catch{throw new Error('Не удалось прочитать профили');}
    return Array.isArray(value) ? value : [];
  }

  function toHex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function hashPassword(secret, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt.match(/.{2}/g), pair => parseInt(pair, 16)), iterations: 150000, hash: 'SHA-256' }, key, 256);
    return toHex(new Uint8Array(bits));
  }

  function showError(message) {
    error.textContent = message;
    submitButton.disabled = false;
  }

  for (const trigger of document.querySelectorAll('[data-open]')) {
    trigger.addEventListener('click', () => {
      setMode(trigger.dataset.open);
      dialog.showModal();document.body.classList.add('dialog-open');login.focus();
    });
  }
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');form.reset();});
  document.getElementById('togglePassword').addEventListener('click',e=>{const show=password.type==='password';password.type=show?'text':'password';e.target.textContent=show?'Скрыть':'Показать';e.target.setAttribute('aria-label',show?'Скрыть пароль':'Показать пароль');});
  document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
  switchMode.addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    const username = login.value.trim().toLocaleLowerCase('ru-RU');
    const secret = password.value;
    if (!/^[\p{L}\p{N}_.-]{3,32}$/u.test(username)) {
      return showError('Логин: от 3 до 32 букв, цифр, точек, дефисов или знаков подчёркивания.');
    }
    if(secret.length>128)return showError('Пароль должен быть не длиннее 128 символов.');
    if (mode === 'register') {
      if (displayName.value.trim().length < 2) return showError('Напиши имя длиной не менее 2 символов.');
      if (secret.length < 8) return showError('Пароль должен содержать не менее 8 символов.');
      if (secret !== confirmPassword.value) return showError('Пароли не совпадают.');
    }
    submitButton.disabled = true;
    try {
      const response = await fetch('/api/auth/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password:secret,name:displayName.value.trim()||undefined})});
      const user = await response.json();
      if(!response.ok) return showError(user.error||'Не удалось войти.');      window.location.assign('app.html?grade='+selectedGrade+'#page=catalog');
    } catch (caught) {
      showError('Сервер недоступен. Проверь подключение и попробуй ещё раз.');
    } finally {
      submitButton.disabled = false;
    }
  });
  if(location.hash==='#register'||location.hash==='#login'){setMode(location.hash.slice(1));dialog.showModal();document.body.classList.add('dialog-open');login.focus();}
  const nav=document.getElementById('mainNav'),navToggle=document.getElementById('navToggle');
  const closeNav=()=>{nav.classList.remove('open');navToggle.setAttribute('aria-expanded','false');navToggle.setAttribute('aria-label','Открыть меню');};
  navToggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(open));navToggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))closeNav();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav();});
  let selectedGrade=6,library=null;
  const html=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plural=(n,a,b,c)=>n%100>=11&&n%100<=14?c:n%10===1?a:n%10>=2&&n%10<=4?b:c;
  function renderSubjects(){
    const rows=library?.grades?.[selectedGrade];
    if(rows)document.getElementById('subjectList').innerHTML=rows.map(s=>`<a class="subject-link" href="app.html?grade=${selectedGrade}&subject=${encodeURIComponent(s.id)}#page=catalog"><span class="subject-name">${html(s.name)}</span><small>${s.topics} ${plural(s.topics,'тема','темы','тем')} · ${s.cards} ${plural(s.cards,'карточка','карточки','карточек')}</small><span class="subject-arrow" aria-hidden="true">↗</span></a>`).join('');
    document.getElementById('classCaption').textContent=selectedGrade+' класс';document.getElementById('libraryCount').textContent='ПРЕДМЕТЫ '+selectedGrade+' КЛАССА';
    for(const b of document.querySelectorAll('[data-class]')){const active=Number(b.dataset.class)===selectedGrade;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  }
  for(const b of document.querySelectorAll('[data-class]'))b.addEventListener('click',()=>{selectedGrade=Number(b.dataset.class);renderSubjects();});
  fetch('entry-library.json').then(r=>{if(!r.ok)throw 0;return r.json();}).then(data=>{library=data;renderSubjects();if(data.guideTopic)document.getElementById('openGuide').href='app.html#guide='+encodeURIComponent(data.guideTopic);}).catch(()=>{document.getElementById('libraryCount').textContent='ОТКРОЙ ПРОГРАММУ ЧЕРЕЗ ЛОКАЛЬНЫЙ СЕРВЕР';});
  const feedback=document.getElementById('demoFeedback'),reset=document.getElementById('demoReset'),hint=document.getElementById('demoHint'),hintText=document.getElementById('demoHintText');
  for(const b of document.querySelectorAll('[data-demo-answer]'))b.addEventListener('click',()=>{
    for(const x of document.querySelectorAll('[data-demo-answer]')){x.classList.remove('selected','correct');x.setAttribute('aria-pressed','false');}
    const correct=b.dataset.demoAnswer==='3/4';b.classList.add(correct?'correct':'selected');b.setAttribute('aria-pressed','true');feedback.className='demo-feedback '+(correct?'good':'try');feedback.textContent=correct?'Получилось: две четверти и ещё одна четверть дают три четверти.':'Попробуй ещё. Сначала представь половину в четвертях, затем сложи части.';reset.hidden=false;
  });
  hint.addEventListener('click',()=>{const open=hintText.hidden;hintText.hidden=!open;hint.setAttribute('aria-expanded',String(open));});
  reset.addEventListener('click',()=>{for(const b of document.querySelectorAll('[data-demo-answer]')){b.classList.remove('selected','correct');b.setAttribute('aria-pressed','false');}feedback.className='demo-feedback';feedback.textContent='Выбери ответ. Это пример, он не влияет на прогресс.';reset.hidden=true;hintText.hidden=true;hint.setAttribute('aria-expanded','false');});
  document.getElementById('tryDemo').addEventListener('click',()=>{document.querySelector('.demo-sheet').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});document.querySelector('[data-demo-answer]').focus({preventScroll:true});});
})();

