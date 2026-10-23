/* Hand-mapped interactions preserve the original question and its complete criterion. */
(() => {
 const cards=Object.values(window.SCHOOL_MATERIALS.cards).flat();
 const byId=new Map(cards.map(q=>[q.id,q]));
 const group=(id,items,targets,answers)=>{
  const q=byId.get(id);if(!q)throw Error('Missing interaction: '+id);
  if(items.length!==answers.length||answers.some(x=>x<0||x>=targets.length))throw Error('Invalid grouping: '+id);
  Object.assign(q,{kind:'group',items,targets,correct:answers});
 };
 const sequence=(id,items)=>{
  const q=byId.get(id);if(!q)throw Error('Missing sequence: '+id);
  Object.assign(q,{kind:'sequence',items,correct:items.map((_,i)=>i)});
 };
 group('М6-012-1',['125','138','240','307'],['На 2','На 5','На 10','Ни в одну'],[[1],[0],[0,1,2],[3]]);
 group('М6-015-1',['1','2','9','13','15'],['Простые','Составные','Отдельная группа'],[2,0,1,0,1]);
 group('М6-024-1',['3/7','7/7','10/7'],['Правильные','Неправильные'],[0,1,1]);
 group('М6-058-1',['−4','0','2,5','−1/2','7'],['Отрицательные','Ноль','Положительные'],[0,1,2,0,2]);
 group('М6-095-1',['Два отмеченных конца','Один конец и стрелка','Две стрелки'],['Отрезок','Луч','Прямая'],[0,1,2]);
 group('М6-116-1',['Идеализированная банка','Мяч как объёмное тело','Кубик','Конус дорожного ограждения'],['Куб','Конус','Цилиндр','Шар'],[2,3,0,1]);
 sequence('М6-028-4',['3/5','2/3','7/10']);
 sequence('М6-039-2',['2,09','2,109','2,9']);
 sequence('М6-059-4',['−1,5','−0,5','1/2']);
 sequence('М6-062-2',['−1,2','−0,7','0','0,5']);
 sequence('Р6-005-1',['Определение','Примеры','Вывод']);
 group('Р6-039-1',['полчаса','пол-лимона','пол-яблока'],['Слитно','Через дефис'],[0,1,1]);
 group('Р6-041-1',['добрый человек','деревянный стол','лисий хвост'],['Качественное','Относительное','Притяжательное'],[0,1,2]);
 group('Р6-050-1',['пять','двое','две третьих','пятый'],['Целое количественное','Собирательное','Дробное количественное','Порядковое'],[0,1,2,3]);
 sequence('Б6-001-1',['Клетка','Ткань','Лист','Растение']);
 sequence('Б6-017-1',['Кора','Камбий','Древесина','Сердцевина']);
 group('Б6-002-4',['Мох','Папоротник','Фасоль'],['Споровые','Семенные'],[0,0,1]);
 group('Б6-006-1',['Корень','Лист','Цветок','Плод'],['Вегетативные','Генеративные'],[0,0,1,1]);
 group('Б6-007-1',['Вода','Соль','Крахмал','Масло'],['Неорганические','Органические'],[0,0,1,1]);
 group('Б6-025-2',['Томат','Вишня'],['Ягода','Костянка'],[0,1]);
 group('Б6-044-1',['Томат','Мак','Вишня'],['Сухой околоплодник','Сочный околоплодник'],[1,0,1]);
 group('Г6-001-1',['Река','Ледник','Водяной пар'],['Жидкое','Твёрдое','Газообразное'],[0,1,2]);
 group('Г6-029-4',['Дождь','Снег','Град'],['Жидкое','Твёрдое'],[0,1,1]);
 group('И6-023-1',['Парламент','Генеральные штаты'],['Англия','Франция'],[0,1]);
 group('И6-030-1',['Жакерия','Восстание Уота Тайлера'],['Франция','Англия'],[0,1]);
 sequence('И6-001-2',['476','800','1453']);
 sequence('А7-001-4',['−3/4','−0,7','0','2/3']);
 // Additional exact chronological questions: use only dates already present in
 // both the question and the answer, with no hidden event/era interpretation.
 for(const q of cards){
  if(q.kind!=='written'||!/^Расположи|^Упорядочи/i.test(q.prompt)||!/по времени|хронолог|по возрастанию/i.test(q.prompt))continue;
  const clean=q.answer.replace(/[.!]$/,'').trim();const parts=clean.split(/;\s*|,\s+/);
  if(parts.length>=3&&parts.length<=7&&parts.every(x=>/^\d{3,4}$/.test(x)&&q.prompt.includes(x))&&parts.every((x,i)=>i===0||Number(x)>Number(parts[i-1])))sequence(q.id,parts);
 }
 window.SCHOOL_INTERACTION_COUNTS={group:cards.filter(q=>q.kind==='group').length,sequence:cards.filter(q=>q.kind==='sequence').length};
})();
