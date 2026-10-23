/* Exact rational/affine mathematics and evidence-based local skill assessment. */
(function(root){
 'use strict';
 const abs=a=>a<0n?-a:a,gcd=(a,b)=>{a=abs(a);b=abs(b);while(b){const r=a%b;a=b;b=r;}return a||1n;};
 function Q(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw new Error('division_by_zero');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
 const add=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d),neg=a=>Q(-a.n,a.d),sub=(a,b)=>add(a,neg(b)),mul=(a,b)=>Q(a.n*b.n,a.d*b.d),div=(a,b)=>Q(a.n*b.d,a.d*b.n),eq=(a,b)=>a.n===b.n&&a.d===b.d,zero=a=>a.n===0n;
 const textQ=q=>q.d===1n?String(q.n):q.n+'/'+q.d;
 const numberQ=s=>{const [a,b='']=s.split('.');return Q(BigInt(a+b),10n**BigInt(b.length));};
 const clean=s=>String(s||'').replace(/²/g,'^2').replace(/³/g,'^3').normalize('NFKC').replace(/[хХX]/g,'x').replace(/[,]/g,'.').replace(/[−–—]/g,'-').replace(/[×·]/g,'*').replace(/[÷:]/g,'/');
 const constant=q=>({a:Q(0),b:q});
 function parse(input){
  const s=clean(input).replace(/\s/g,'');if(s.length>250||!/^[\dx.+*/^()-]+$/.test(s))throw new Error('unsupported_expression');
  const raw=s.match(/\d+(?:\.\d+)?|x|[()+*/^.-]/g)||[];if(raw.join('')!==s)throw new Error('unknown_symbol');
  const ts=[];for(const token of raw){const prev=ts.at(-1);if(prev&&(prev==='x'||prev===')'||/^\d/.test(prev))&&(token==='x'||token==='('||(/^\d/.test(token)&&(prev==='x'||prev===')'))))ts.push('*');ts.push(token);}
  let at=0,depth=0;const flags={decimal:s.includes('.'),fraction:s.includes('/'),negative:/(?:^|[(*+/])-\d/.test(s),operations:new Set(),parentheses:s.includes('(')};
  function atom(){if(++depth>24)throw new Error('expression_too_deep');let v;if(ts[at]==='('){at++;v=expr();if(ts[at++]!==')')throw new Error('unclosed_parenthesis');}else if(ts[at]==='x'){at++;v={a:Q(1),b:Q(0)};}else{if(!/^\d/.test(ts[at]||''))throw new Error('missing_operand');if(ts[at].replace('.','').length>60)throw new Error('number_too_large');v=constant(numberQ(ts[at++]));}depth--;return v;}
  function unary(){if(ts[at]==='+'){at++;return unary();}if(ts[at]==='-'){at++;const v=unary();return {a:neg(v.a),b:neg(v.b)};}return power();}
  function power(){let a=atom();if(ts[at]==='^'){at++;flags.operations.add('^');const b=unary();if(!zero(b.a)||b.b.d!==1n||abs(b.b.n)>30n)throw new Error('unsupported_power');const e=b.b.n;if(!zero(a.a)){if(e===1n)return a;throw new Error('nonlinear_expression');}if(zero(a.b)&&e===0n)throw new Error('undefined_power');let out=Q(1);for(let i=0n;i<abs(e);i++)out=mul(out,a.b);a=constant(e<0n?div(Q(1),out):out);}return a;}
  function product(){let a=unary();while(ts[at]==='*'||ts[at]==='/'){const op=ts[at++],b=unary();flags.operations.add(op);if(op==='/'){if(!zero(b.a))throw new Error('variable_denominator');a={a:div(a.a,b.b),b:div(a.b,b.b)};}else{if(!zero(a.a)&&!zero(b.a))throw new Error('nonlinear_expression');a={a:add(mul(a.a,b.b),mul(b.a,a.b)),b:mul(a.b,b.b)};}}return a;}
  function expr(){let a=product();while(ts[at]==='+'||ts[at]==='-'){const op=ts[at++],b=product();flags.operations.add(op);a={a:op==='+'?add(a.a,b.a):sub(a.a,b.a),b:op==='+'?add(a.b,b.b):sub(a.b,b.b)};}return a;}
  const value=expr();if(at!==ts.length)throw new Error('unexpected_token');return {...value,flags,source:s};
 }
 function equation(line){const sides=clean(line).split('=');if(sides.length!==2)throw new Error('not_an_equation');const left=parse(sides[0]),right=parse(sides[1]),a=sub(left.a,right.a),b=sub(left.b,right.b);return {left,right,a,b,kind:zero(a)?zero(b)?'all':'none':'one',root:zero(a)?null:div(neg(b),a)};}
 const equivalent=(a,b)=>a.kind===b.kind&&(a.kind!=='one'||eq(a.root,b.root));
 const definitions=[];
 function def(code,name,skill,rule,prerequisites=[]){const d={error_code:code,subject:'mathematics',grades:[5,6,7],topic:name,subtopic:name,skill_id:skill,error_type:code.toLowerCase(),description:name,diagnostic_rule:rule,prerequisite_skills:prerequisites,recommendation:'Повтори правило, затем проверь себя на другом задании.'};definitions.push(d);return d;}
 const labels={ADD:'Сложение',SUB:'Вычитание',MUL:'Умножение',DIV:'Деление',POWER:'Степени'};
 for(const [op,label] of Object.entries(labels))for(const [kind,suffix] of [['INT','целых чисел'],['DECIMAL','десятичных дробей'],['FRACTION','обыкновенных дробей'],['NEGATIVE','отрицательных чисел']])def('ARITH_'+op+'_'+kind,label+' '+suffix,'arith_'+op.toLowerCase()+'_'+kind.toLowerCase(),'Левая и правая части числового равенства должны иметь одинаковое значение.',['basic_arithmetic']);
 def('ARITH_ORDER','Порядок действий','operation_order','Сначала выполняют степени, затем умножение и деление, затем сложение и вычитание.');
 def('ARITH_PARENTHESES','Действия со скобками','parentheses','Проверь вычисления внутри скобок и действие после них.');
 def('EQ_TRANSFER_SIGN','Перенос слагаемого','equation_sign_change','Одинаковое число вычитают из обеих частей; перенос слагаемого меняет его знак.',['signed_numbers','basic_equations']);
 def('EQ_DIVIDE_COEFFICIENT','Деление обеих частей уравнения','equation_division','Чтобы перейти от ax=b к x, обе части делят на ненулевое a.',['division','basic_equations']);
 def('EQ_DROP_COEFFICIENT','Пропущенный коэффициент','equation_coefficient','Коэффициент нельзя просто убрать: нужно разделить обе части на него.',['division']);
 def('EQ_MULTIPLY_ZERO','Потеря равносильности при умножении на ноль','equation_zero','Умножение обеих частей на ноль может превратить уравнение в тождество и потерять исходное условие.');
 def('EQ_NON_EQUIVALENT','Неравносильный переход','equation_equivalence','Допустимые преобразования должны сохранять множество решений уравнения.',['basic_equations']);
 def('EQ_FIRST_REWRITE','Изменено исходное уравнение','copy_condition','Сверь первую строку решения с цифровым условием.');
 def('MATH_DIV_ZERO','Деление на ноль','division_domain','На ноль делить нельзя. Сначала проверь, верно ли распознан знаменатель.');
 def('KNOWN_SCALAR_WRONG','Итоговый ответ не совпал с эталоном','known_answer','Для указанного задания итог не совпадает с проверенным ответом. Причина по одному итогу не устанавливается.');
 def('FINAL_ROOT_WRONG','Итоговый корень не удовлетворяет условию','equation_root','Подставь найденное значение в исходное уравнение.');
 def('FRACTION_ADD_DENOMINATORS','Сложены знаменатели дробей','fraction_common_denominator','При сложении дроби приводят к общему знаменателю; складывать знаменатели нельзя.',['fraction_equivalence']);
 const kb=Object.fromEntries(definitions.map(d=>[d.error_code,d]));
 function evidence(code,line,index,explanation,correction,extra={}){return {code,definition:kb[code],line,index,explanation,correction,verificationReliability:1,causeReliability:code.startsWith('ARITH_')?.6:.9,...extra};}
 function arithmeticCode(p){
  const f=p.flags,op=f.operations.has('+')?'ADD':f.operations.has('-')?'SUB':f.operations.has('*')?'MUL':f.operations.has('/')?'DIV':'POWER';
  const kind=f.fraction?'FRACTION':f.decimal?'DECIMAL':f.negative?'NEGATIVE':'INT';return 'ARITH_'+op+'_'+kind;
 }
 function normalizeLines(text){return String(text||'').split(/\r?\n/).map((raw,index)=>({raw,index,line:raw.trim().replace(/^\s*(?:№\s*)?\d+[.)]\s+/,'').replace(/^(?:ответ|решение|реши(?:те)?(?: уравнение)?|вычисли(?:те)?)\s*[:：]?\s*/i,'').trim()})).filter(x=>x.line);}
 function verify(text,{confirmed=false,assignment=null,ocrConfidence=1}={}){
  if(!confirmed)return {status:'confirmation_required',message:'Сначала подтверди или исправь распознанный текст.',events:[]};
  if((String(text).match(/^\s*(?:№\s*)?\d+[.)]\s+/gm)||[]).length>1)return {status:'teacher_required',message:'В записи несколько нумерованных пунктов. Для проверки переходов оставь одно решение: отдельные задачи нельзя считать шагами одной цепочки.',events:[]};
  const rows=normalizeLines(text);if(!rows.length)return {status:'insufficient_data',message:'Решение не добавлено.',events:[]};
  let condition=null,first=null,previous=null,checked=0,unsupported=[],errors=[],equations=[];const skills=new Set();
  if(assignment?.prompt){const q=clean(assignment.prompt).match(/([\dx\s.+*/^()-]+=[\dx\s.+*/^()-]+)/);if(q)try{condition=equation(q[1].replace(/[.\s]+$/,''));}catch{}}
  for(const row of rows){
   if(!row.line.includes('=')){if(/[xх]|[<>≤≥√]/.test(row.line))unsupported.push(row);continue;}
   if(row.line.split('=').length!==2){unsupported.push(row);continue;}
   let current;
   try{current=equation(row.line);}catch(e){if(e.message==='division_by_zero')errors.push(evidence('MATH_DIV_ZERO',row.raw,row.index,'В этой строке есть деление на ноль.','Проверь знаменатель по фотографии.'));else unsupported.push(row);break;}
   checked++;
   if(zero(current.left.a)&&zero(current.right.a)){
    if(!eq(current.left.b,current.right.b)){
     let code=arithmeticCode(current.left),reason='Левая часть равна '+textQ(current.left.b)+', правая — '+textQ(current.right.b)+'.';
     const m=clean(row.line).replace(/\s/g,'').match(/^(\d+)\/(\d+)\+(\d+)\/(\d+)=(.+)$/);
     if(m){const wrong=Q(BigInt(m[1])+BigInt(m[3]),BigInt(m[2])+BigInt(m[4]));if(eq(wrong,current.right.b)){code='FRACTION_ADD_DENOMINATORS';reason='Результат совпадает со сложением числителей и знаменателей. Проверь приведение дробей к общему знаменателю.';}}
     errors.push(evidence(code,row.raw,row.index,reason,current.left.source+' = '+textQ(current.left.b)));break;
    }else if(current.left.flags.operations.size)skills.add(kb[arithmeticCode(current.left)].skill_id);continue;
   }
   if(!first){first=condition||current;if(condition&&!equivalent(condition,current)){errors.push(evidence('EQ_FIRST_REWRITE',row.raw,row.index,'Первая записанная строка имеет другое множество решений, чем цифровое условие.','Сверь её с исходным условием.'));break;}}
   if(previous&&!equivalent(previous.eq,current)){
    const before=previous.eq;let code='EQ_NON_EQUIVALENT';
    if(current.kind==='all'&&before.kind!=='all')code='EQ_MULTIPLY_ZERO';
    else if(zero(before.right.a)&&zero(current.right.a)&&eq(before.left.a,current.left.a)&&!zero(before.left.b)&&zero(current.left.b)&&eq(current.right.b,add(before.right.b,before.left.b)))code='EQ_TRANSFER_SIGN';
    else if(zero(before.right.a)&&zero(before.left.b)&&zero(current.left.b)&&zero(current.right.a)&&eq(current.left.a,Q(1))){code=eq(current.right.b,before.right.b)?'EQ_DROP_COEFFICIENT':'EQ_DIVIDE_COEFFICIENT';}
    const correct=before.kind==='one'?'Исходное уравнение имеет корень x = '+textQ(before.root)+'.':'Сохрани исходное множество решений.';
    errors.push(evidence(code,row.raw,row.index,'Переход от строки «'+previous.raw+'» изменил множество решений.',correct,{previousLine:previous.raw}));break;
   }
   if(previous){skills.add('equation_equivalence');if(!zero(previous.eq.left.b)&&zero(current.left.b)&&zero(previous.eq.right.a)&&zero(current.right.a))skills.add('equation_sign_change');}
   previous={eq:current,raw:row.raw};equations.push(current);
  }
  const last=rows.at(-1);let answerChecked=false;
  if(!errors.length&&assignment?.kind==='scalar'){
   let answer=last.line;if(assignment.unit&&answer.endsWith(assignment.unit))answer=answer.slice(0,-assignment.unit.length).trim();
   if(!answer.includes('='))try{const a=parse(answer),b=parse(String(assignment.value).replace(',','.'));if(zero(a.a)&&zero(b.a)){answerChecked=true;if(!eq(a.b,b.b))errors.push(evidence('KNOWN_SCALAR_WRONG',last.raw,last.index,'Ответ не совпадает с эталоном задания.','Эталон: '+assignment.value+(assignment.unit?' '+assignment.unit:''),{causeReliability:0}));}}catch{}
  }
  if(errors.length)return {status:'error',errors,checked,unsupported:unsupported.map(x=>x.raw),firstError:errors[0],message:'Найдена проверяемая ошибка. Это наблюдение по работе, а не вывод о незнании всей темы.',events:[],condition:condition?assignment.prompt:first?rows.find(x=>x.line.includes('='))?.line:null};
  if(unsupported.length)return {status:'teacher_required',message:'Часть записи выходит за поддерживаемую арифметику и линейные уравнения. Нужна ручная проверка.',checked,unsupported:unsupported.map(x=>x.raw),events:[]};
  if(equations.length){const final=equations.at(-1),isolated=eq(final.left.a,Q(1))&&zero(final.left.b)&&zero(final.right.a);if(equations.length===1&&isolated&&!condition)return {status:'insufficient_data',message:'Одного записанного корня недостаточно: добавь исходное уравнение или код цифрового задания.',events:[]};if(!isolated&&final.kind==='one')return {status:'incomplete',message:'Записанные уравнения равносильны, но итоговый корень ещё не выделен.',checked,events:[]};if(final.kind!=='one')return {status:'teacher_required',message:'Уравнение не имеет единственного корня. Итог о множестве решений требует отдельной проверки.',checked,events:[]};}
  if(!checked&&!answerChecked)return {status:'teacher_required',message:'Автоматически проверить эту запись не удалось. Исправь текст или передай работу учителю.',events:[]};
  return {status:'correct',message:answerChecked?'Итог сверён с цифровым заданием. Все поддерживаемые записанные переходы проверены.':'Проверенные числовые равенства и линейные переходы корректны. Это проверка записанных строк, а не полноты исходного задания.',checked,skillsChecked:[...skills],condition:first?rows.find(x=>x.line.includes('='))?.line:null,events:[]};
 }
 const config={minimumIndependent:3,repeatThreshold:3,masteryMinimum:5,masteryScore:80,halfLifeDays:90,evidenceWindowDays:180};
 function assess(events,now=Date.now(),options={}){
  const cfg={...config,...options},unique=new Map();
  for(const e of events)if(e.confirmed&&Number.isFinite(e.at)&&e.at<=now+86400000&&now-e.at<=cfg.evidenceWindowDays*86400000&&e.reliability>=.8&&e.reliability<=1&&e.assignmentKey)unique.set(e.assignmentKey,e);
  const rows=[...unique.values()];if(!rows.length)return {status:'insufficient_data',label:'Недостаточно данных',score:null,count:0};
  let weight=0,passed=0;const errors={},difficulties=new Set();
  for(const e of rows){const age=Math.max(0,(now-e.at)/86400000),w=e.reliability*(.5+Math.max(1,Math.min(3,e.difficulty||1))/3)*Math.pow(.5,age/cfg.halfLifeDays);weight+=w;if(e.correct)passed+=w;else errors[e.code||'unknown']=(errors[e.code||'unknown']||0)+1;difficulties.add(e.difficulty||1);}
  const score=Math.round(100*passed/weight),correct=rows.filter(e=>e.correct).length,maxRepeated=Math.max(0,...Object.values(errors));let status='insufficient_data',label='Недостаточно данных';
  if(rows.length>=cfg.minimumIndependent&&maxRepeated>=cfg.repeatThreshold){status='repeated_error';label='Есть повторяющиеся ошибки';}
  else if(rows.length>=cfg.masteryMinimum&&score>=cfg.masteryScore&&difficulties.size>=2&&rows.sort((a,b)=>b.at-a.at).slice(0,2).every(e=>e.correct)){status='mastered';label='Освоено по проверенным заданиям';}
  else if(rows.some(e=>!e.correct)){status=rows.length===1?'single_error':'needs_diagnosis';label=rows.length===1?'Единичная ошибка':'Требуется дополнительная диагностика';}
  return {status,label,score,count:rows.length,correct,errors,lastChecked:Math.max(...rows.map(e=>e.at)),reliability:rows.length>=5?'больше данных':'предварительная оценка',next:status==='repeated_error'?'Повтори конкретное правило и реши новое диагностическое задание.':status==='mastered'?'Проверь навык позже на новом задании.':'Реши несколько независимых заданий; одной работы недостаточно.',note:'Индекс 0–100 вычисляется по весам проверок и не является вероятностью владения навыком.'};
 }
 const api={parse,equation,equivalent,verify,assess,definitions,config,textQ,clean};root.SCHOOL_DIAGNOSTICS=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
