(function(){
'use strict';
const L=()=>window.luckysheet, J=()=>window.$, q=s=>document.querySelector(s);
let docName='Книга1',dirty=false,filterOn=false;
const FONTS=['Arial','Calibri','Times New Roman','Courier New','Verdana','Tahoma','Segoe UI','Comic Sans MS'];
const SIZES=[8,9,10,11,12,14,16,18,20,24,28,36];
const NUMF={'Общий':['General','g'],'Число 0,00':['0.00','n'],'С разделителем':['#,##0.00','n'],'Денежный ₽':['#,##0.00"₽"','n'],'Процент':['0.00%','n'],'Дата':['yyyy-mm-dd','d'],'Время':['hh:mm:ss','d'],'Текст':['@','s']};
const setStatus=t=>{q('#status').textContent=t;};
const markDirty=()=>{dirty=true;};

/* ---------- Лента ---------- */
const B=(l,a,i,big)=>({k:'b',l,a,i,big:big!==false});
const S=(a,opts,w,title)=>({k:'s',a,opts,w,title});
const C=(a,l,v,title)=>({k:'c',a,l,v,title});
const G=(n,items)=>({n,items});
const BR={k:'br'};
const TABS={
'Файл':[G('Книга',[B('Создать','new','🗋'),B('Открыть…','open','📂'),B('Сохранить .xlsx','saveX','💾'),B('Экспорт .csv','saveCsv','📄')]),
 G('Сеанс',[B('Сохранить сейчас','saveNow','⟳'),B('Справка','help','❓'),B('Выход','exit','⏻')])],
'Главная':[
 G('Отмена',[B('Назад','undo','↶'),B('Вперёд','redo','↷')]),
 G('Шрифт',[S('ff',FONTS,110,'Шрифт'),S('fs',SIZES,48,'Размер'),BR,
  B('Ж','bold','',false),B('К','italic','',false),B('Ч','under','',false),B('S̶','strike','',false),C('fc','A','#000000','Цвет текста'),C('bg','🖌','#ffff00','Заливка'),
  S('border',['Границы…','Все границы','Внешние','Без границ'],80,'Границы')]),
 G('Выравнивание',[B('⇤','alL','',false),B('↔','alC','',false),B('⇥','alR','',false),B('⤒','vT','',false),B('⇳','vM','',false),B('⤓','vB','',false),BR,
  B('Перенос','wrap','',false),B('Объединить','merge','',false),B('Разъединить','unmerge','',false)]),
 G('Число',[S('numf',Object.keys(NUMF),110,'Формат числа'),BR,B('₽','cur','',false),B('%','pct','',false),B('.0←','decD','',false),B('.00→','decI','',false)]),
 G('Ячейки',[B('+Строка','insR','',false),B('+Столбец','insC','',false),BR,B('−Строка','delR','',false),B('−Столбец','delC','',false),B('Очистить','clear','',false)]),
 G('Правка',[S('fn',['Σ Функция…','СУММ','СРЗНАЧ','СЧЁТ','МАКС','МИН'],90,'Автофункция'),BR,B('А→Я','sortA','',false),B('Я→А','sortD','',false),B('Фильтр','filter','',false),B('Найти','find','',false)])],
'Вставка':[
 G('Таблицы',[B('Сводная таблица','pivot','▦')]),
 G('Иллюстрации',[B('Диаграмма','chart','📊'),B('Рисунок','img','🖼'),B('Ссылка','link','🔗')]),
 G('Комментарии',[B('Примечание','note','💬')]),
 G('Строки/столбцы',[B('+Строка','insR','↧'),B('+Столбец','insC','↦'),B('Новый лист','addSheet','➕')])],
'Данные':[
 G('Сортировка и фильтр',[B('А→Я','sortA','⇣'),B('Я→А','sortD','⇡'),B('Фильтр','filter','⛛')]),
 G('Группа',[B('Группировать','grp','⊞'),B('Разгрупп.','ungrp','⊟'),BR,
  S('lvl',['Уровень…','1','2','3','Все'],70,'Уровень детализации')]),
 G('Инструменты',[B('Текст по столбцам','split','⫼'),B('Проверка данных','valid','✔'),B('Анализ данных','analyze','📈')]),
 G('Сводные',[B('Сводная таблица','pivot','▦'),B('Поля сводной','pvfields','☰'),B('Срез','pvslicer','🎚'),B('Раскрыть все','pvexpand','⊞'),B('Свернуть все','pvcollapse','⊟'),BR,B('К курсору','pvmove','',false),B('Сорт. по знач.','pvsort','',false),B('Итоги +/-','pvtotals','',false),B('Срезы вкл/выкл','slicers','🎛')])],
'Формулы':[
 G('Проверка',[B('Ввести функцию','fx','ƒx'),B('Найти зависимости','dep','🔍')]),
 G('Параметры Excel (как в MS Excel)',[B('Точность как в Excel','xlPrec','✓'),B('Ручной пересчёт','xlManual','⟳'),B('Обновить все','xlCalcAll','▶')])],
'Вид':[
 G('Закрепление',[B('Первая строка','frR','⤒'),B('Первый столбец','frC','⇤'),B('Области','frB','▣'),B('Снять','frN','✖')]),
 G('Отображение',[B('Строки и столбцы','showHide','👁'),B('Скрыть/показать срезы','slicers','🎛')]),
 G('Масштаб',[S('zoom',['100%','50%','75%','125%','150%','200%'],70,'Масштаб')]),
 G('Листы',[B('Новый лист','addSheet','➕'),B('Удалить лист','delSheet','🗑')])]
};
function renderItem(it){
 if(it.k==='br')return '<div style="flex-basis:100%;height:0"></div>';
 if(it.k==='b')return `<button class="b ${it.big?'big':''}" data-a="${it.a}" title="${it.l}">${it.big?`<span class="i">${it.i}</span><span class="l">${it.l}</span>`:it.l}</button>`;
 if(it.k==='s')return `<select class="s" data-a="${it.a}" title="${it.title||''}" style="width:${it.w}px">${it.opts.map(o=>`<option>${o}</option>`).join('')}</select>`;
 if(it.k==='c')return `<label class="c" title="${it.title}"><span>${it.l}</span><input type="color" data-a="${it.a}" value="${it.v}"></label>`;
}
function showTab(n){
 q('#ribbon').innerHTML=TABS[n].map(g=>`<div class="grp"><div class="gi">${g.items.map(renderItem).join('')}</div><div class="gn">${g.n}</div></div>`).join('');
 document.querySelectorAll('#tabs div').forEach(d=>d.classList.toggle('on',d.textContent===n));
}
q('#tabs').innerHTML=Object.keys(TABS).map(n=>`<div>${n}</div>`).join('');
q('#tabs').onclick=e=>{if(e.target.tagName==='DIV')showTab(e.target.textContent);};
q('#ribbon').addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault();});
q('#ribbon').addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(b)run(b.dataset.a);});
q('#ribbon').addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.a)run(t.dataset.a,t.value);});

/* ---------- Действия ---------- */
const sel=()=>L().getRange()[0];
const fmt=(a,v)=>{L().setRangeFormat(a,v);markDirty();};
const tog=a=>{const r=sel();const cur=L().getCellValue(r.row[0],r.column[0],{type:a});fmt(a,cur==1?0:1);};
const clk=id=>{const e=J()('#'+id);if(e.length)e.trigger('click');else alert('Функция недоступна');markDirty();};
const colL=n=>{let s='';n++;while(n){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26);}return s;};
function autoFn(fn){
 const r=sel(),[r1,r2]=r.row,[c1,c2]=r.column;
 if(r1===r2&&c1===c2){let t=r1-1;while(t>=0){const v=L().getCellValue(t,c1);if(v!==null&&v!==undefined&&v!==''&&!isNaN(v))t--;else break;}t++;
  if(t>=r1)return alert('Выделите диапазон чисел или ячейку под столбцом чисел');
  L().setCellValue(r1,c1,`=${fn}(${colL(c1)}${t+1}:${colL(c1)}${r1})`);}
 else for(let c=c1;c<=c2;c++)L().setCellValue(r2+1,c,`=${fn}(${colL(c)}${r1+1}:${colL(c)}${r2+1})`);
 markDirty();
}
const ACT={
 new(){if(confirm('Создать новую книгу? Несохранённые изменения будут потеряны (автосохранение будет перезаписано).')){WE={pivots:{},slicers:{}};window.WEStore={pv:{},sl:{}};setName('Книга1');boot(blank());}},
 open(){q('#fileinp').click();},saveX:exportXlsx,saveCsv:exportCsv,saveNow(){dirty=true;autosave();},
 help(){alert('Горячие клавиши:\nCtrl+S — сохранить .xlsx\nCtrl+O — открыть файл\nCtrl+Z / Ctrl+Y — отмена / повтор\nCtrl+C / X / V — копировать / вырезать / вставить\nCtrl+B / I / U — жирный / курсив / подчёркнутый\nCtrl+F — поиск и замена\nF2 / Enter — редактирование ячейки\nDelete — очистить\n\nПКМ по ячейке, строке, столбцу, вкладке листа — контекстное меню.');},
 exit(){if(confirm('Остановить сервер WebExcel Local?'))fetch('/api/exit',{method:'POST'}).finally(()=>{document.body.innerHTML='<p style="padding:30px;font:16px sans-serif">Сервер остановлен. Эту вкладку можно закрыть.</p>';});},
 undo(){L().undo();},redo(){L().redo();},
 bold(){tog('bl');},italic(){tog('it');},under(){tog('un');},strike(){tog('cl');},
 ff(v){fmt('ff',v);},fs(v){fmt('fs',+v);},fc(v){fmt('fc',v);},bg(v){fmt('bg',v);},
 border(v){const m={'Все границы':'border-all','Внешние':'border-outside','Без границ':'border-none'}[v];if(m)clk('luckysheet-icon-'+m);q('#ribbon select[data-a=border]').selectedIndex=0;},
 alL(){fmt('ht',1);},alC(){fmt('ht',0);},alR(){fmt('ht',2);},vT(){fmt('vt',1);},vM(){fmt('vt',0);},vB(){fmt('vt',2);},
 wrap(){const r=sel();const cur=L().getCellValue(r.row[0],r.column[0],{type:'tb'});fmt('tb',String(cur)==='2'?'0':'2');},
 merge(){L().setRangeMerge('all');markDirty();},unmerge(){L().cancelRangeMerge();markDirty();},
 numf(v){const f=NUMF[v];if(f)fmt('ct',{fa:f[0],t:f[1]});},
 cur(){clk('luckysheet-icon-currency');},pct(){clk('luckysheet-icon-percent');},decD(){clk('luckysheet-icon-fmt-decimal-decrease');},decI(){clk('luckysheet-icon-fmt-decimal-increase');},
 insR(){const r=sel();L().insertRow(r.row[0]);markDirty();},insC(){const r=sel();L().insertColumn(r.column[0]);markDirty();},
 delR(){const r=sel();L().deleteRow(r.row[0],r.row[1]);markDirty();},delC(){const r=sel();L().deleteColumn(r.column[0],r.column[1]);markDirty();},
 clear(){L().clearRange();markDirty();},
 fn(v){const m={'СУММ':'SUM','СРЗНАЧ':'AVERAGE','СЧЁТ':'COUNT','МАКС':'MAX','МИН':'MIN'}[v];if(m)autoFn(m);q('#ribbon select[data-a=fn]').selectedIndex=0;},
 sortA(){L().setRangeSort('asc');markDirty();},sortD(){L().setRangeSort('desc');markDirty();},
 filter(){filterOn=!filterOn;L().setRangeFilter(filterOn?'open':'close');markDirty();},
 find(){clk('luckysheet-icon-seachmore');},
 pivot(){WEPivot2.master();},pvfields(){WEPivot2.fieldsPanel(true);},pvslicer(){WEPivot2.slicerDialog();},
 pvexpand(){WEPivot2.expandAll();},pvcollapse(){WEPivot2.collapseAll();},pvmove(){WEPivot2.moveHere();},
 pvsort(){WEPivot2.sortToggle();},pvtotals(){WEPivot2.totalsToggle();},
 grp(){const r=sel();if(!r)return;const G=window.WEGroups;if(!G)return alert('Модуль групп не загружен');
  if(r.row[1]>r.row[0]&&r.column[1]>r.column[0]){alert('Выделите целиком строки или столбцы (для кнопок строк/столбцов — выделяйте по отдельности).');return;}
  if(r.row[1]>r.row[0])G.groupRows();else if(r.column[1]>r.column[0])G.groupCols();else alert('Выделите диапазон строк или столбцов для группировки.');},
 ungrp(){const G=window.WEGroups;if(G)G.ungroupSel();},
 lvl(v){const G=window.WEGroups;if(!G)return;const sel0=q('#ribbon select[data-a=lvl]');if(sel0)sel0.selectedIndex=0;
  if(v==='Все'){const md=Math.max(G.maxDepth(G.getGroups().row),G.maxDepth(G.getGroups().col));G.setLevel('row',md||1);G.setLevel('col',md||1);setStatus('Уровень детализации: все');return;}
  const l=+v;if(!l)return;G.setLevel('row',l);G.setLevel('col',l);setStatus('Уровень детализации: '+l);},
 analyze(){const A=window.WEGroups&&window.WEGroups.openAnalyze;if(A)A();else alert('Модуль анализа не загружен');},
 fx(){clk('luckysheet-wa-functionbox-fx');},dep(){alert('Поиск зависимостей: выделите ячейку с формулой — ссылки в ней подсвечиваются при редактировании (F2). Полная трассировка как в Excel здесь недоступна.');},
 xlPrec(){L().setAllowEdit?null:null;try{localStorage.setItem('we_xlPrecision','1');}catch(e){}try{L().refreshFormula();}catch(e){}setStatus('Режим точности «как в Excel» включён (сопоставление результатов до 15 значащих цифр).');},
 xlManual(){try{localStorage.setItem('we_manualCalc','1');}catch(e){}setStatus('Ручной пересчёт включён. Нажмите «Обновить все» для пересчёта формул.');},
 xlCalcAll(){try{L().refreshFormula();}catch(e){}setStatus('Формулы пересчитаны.');},
 showHide(){let d=q('#weShowDlg');if(d){d.remove();return;}
  const st=L().getSheet(),c=st.config||{};d=document.createElement('div');d.id='weShowDlg';d.className='wemodal';
  d.innerHTML=`<div class="wecard"><h3>Показать скрытые строки/столбцы</h3><p style="color:#666;margin:0 0 8px">Скрыто строк: ${Object.keys(c.rowhidden||{}).length}, столбцов: ${Object.keys(c.colhidden||{}).length}</p>
  <button id="shR">Показать все строки</button> <button id="shC">Показать все столбцы</button> <button id="shX" style="margin-left:14px">Закрыть</button></div>`;
  document.body.appendChild(d);
  d.querySelector('#shR').onclick=()=>{for(let i=0;i<(st.row||100);i++)try{L().showRow(i,i);}catch(e){}markDirty();d.remove();};
  d.querySelector('#shC').onclick=()=>{for(let i=0;i<(st.column||26);i++)try{L().showColumn(i,i);}catch(e){}markDirty();d.remove();};
  d.querySelector('#shX').onclick=()=>d.remove();},
 note(){clk('luckysheet-icon-postil');},split(){clk('luckysheet-splitColumn-btn-title');},valid(){clk('luckysheet-dataVerification-btn-title');},cond(){clk('luckysheet-icon-conditionformat');},
 slicers(){const v=WEPivot2.toggleSlicers();setStatus(v?'Срезы показаны':'Срезы скрыты');},
 frR(){L().setHorizontalFrozen(false);},frC(){L().setVerticalFrozen(false);},frB(){L().setBothFrozen(true);},frN(){L().cancelFrozen();},
 zoom(v){if(L().setSheetZoom)L().setSheetZoom(parseInt(v)/100);},
 addSheet(){L().setSheetAdd();markDirty();},delSheet(){if(confirm('Удалить текущий лист?')){L().deleteSheet();markDirty();}}
};
function run(a,v){try{ACT[a](v);}catch(e){console.error(e);alert('Ошибка действия: '+e.message);}}


/* ---------- Сводная таблица: старый диалог удалён, используется WEPivot2 (pivot2.js) ---------- */
/* ---------- Срезы (фильтры сводных таблиц, импортированных из XLSX) ---------- */
let WE={pivots:{},slicers:{}},slicersOpen=true;
const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const spans=a=>{const r=[];[...a].sort((x,y)=>x-y).forEach(i=>{const l=r[r.length-1];if(l&&l[1]+1===i)l[1]=i;else r.push([i,i]);});return r;};
function applySlicers(){
 const nm=L().getSheet().name,P=WE.pivots[nm]||[],S=WE.slicers[nm]||[];if(!P.length)return;
 const data=L().getSheetData()||[],cell=(r,c)=>data[r]&&data[r][c];
 const off=new Set();S.forEach(s=>s.off.forEach(x=>off.add(x)));
 P.forEach(p=>{
  spans(p.hidR||[]).forEach(([a,b])=>L().showRow(a,b));spans(p.hidC||[]).forEach(([a,b])=>L().showColumn(a,b));
  const h=WEExtras.hiddenFor(p,cell,off);p.hidR=h.rows;p.hidC=h.cols;
  spans(h.rows).forEach(([a,b])=>L().hideRow(a,b));spans(h.cols).forEach(([a,b])=>L().hideColumn(a,b));
  WEExtras.totalsFor(p,cell,h.rows,h.cols).forEach(([r,c,v])=>L().setCellValue(r,c,v));
 });
 markDirty();
}
let slRaf=0;
function slOrigin(){
 const rh=q('#luckysheet-rows-h'),ch=q('#luckysheet-cols-h-c'),cm=q('#luckysheet-cell-main');if(!cm)return null;
 const b=cm.getBoundingClientRect(),r=rh?rh.getBoundingClientRect():null,c=ch?ch.getBoundingClientRect():null;
 return {x:r?r.right:b.left+46,y:c?c.bottom:b.top+20,r:b.right-14,b:b.bottom-14};}
function layoutSlicers(){
 const box=q('#slbox');if(!box)return;const o=slOrigin();if(!o)return;
 const sx=(q('#luckysheet-scrollbar-x')||{}).scrollLeft||0,sy=(q('#luckysheet-scrollbar-y')||{}).scrollTop||0;
 Object.assign(box.style,{left:o.x+'px',top:o.y+'px',width:Math.max(0,o.r-o.x)+'px',height:Math.max(0,o.b-o.y)+'px'});
 const S=WE.slicers[(()=>{try{return L().getSheet().name;}catch(e){return '';}})()]||[];
 box.querySelectorAll('.wesl').forEach(w=>{const s=S[+w.dataset.i];if(!s)return;w.style.left=(s.x-sx)+'px';w.style.top=(s.y-sy)+'px';w.style.width=s.w+'px';w.style.height=s.h+'px';});
 slRaf=requestAnimationFrame(layoutSlicers);}
function renderSlicers(){
 cancelAnimationFrame(slRaf);let box=q('#slbox');
 const nm=(()=>{try{return L().getSheet().name;}catch(e){return '';}})(),S=WE.slicers[nm]||[];
 if(!S.length||!slicersOpen){if(box)box.remove();return;}
 if(!box){box=document.createElement('div');box.id='slbox';document.body.appendChild(box);
  box.addEventListener('click',e=>{const w=e.target.closest('.wesl');if(!w)return;const s=(WE.slicers[L().getSheet().name]||[])[+w.dataset.i];if(!s)return;
   if(e.target.closest('.slx')){s.off=[];applySlicers();renderSlicers();return;}
   const it=e.target.closest('.sli');if(!it||it.classList.contains('na'))return;const v=s.all[+it.dataset.j];
   if(e.ctrlKey||e.metaKey){s.off=s.off.includes(v)?s.off.filter(x=>x!==v):s.off.concat([v]);}
   else{const only=s.items.filter(x=>x!==v);s.off=(s.off.length===only.length&&only.every(x=>s.off.includes(x)))?[]:only;}
   applySlicers();renderSlicers();});
  box.addEventListener('mousedown',e=>{const h=e.target.closest('.slh');if(!h||e.target.closest('.slx'))return;const w=h.parentNode,s=(WE.slicers[L().getSheet().name]||[])[+w.dataset.i];if(!s)return;
   const x0=e.clientX,y0=e.clientY,sx=s.x,sy=s.y;e.preventDefault();
   const mv=ev=>{s.x=Math.max(0,sx+ev.clientX-x0);s.y=Math.max(0,sy+ev.clientY-y0);},up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);markDirty();};
   document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});}
 box.innerHTML=S.map((s,i)=>{const has=new Set(s.items);return `<div class="wesl" data-i="${i}"><div class="slh"><span>${esc(s.caption)}</span><span class="slx" title="Очистить фильтр">⛒</span></div><div class="slb">`+
  s.all.map((v,j)=>`<div class="sli ${!has.has(v)?'na':s.off.includes(v)?'':'on'}" data-j="${j}" title="${has.has(v)?esc(v):esc(v)+' — нет в данных сводной (данные в модели Excel недоступны)'}">${esc(v)}</div>`).join('')+'</div></div>';}).join('');
 layoutSlicers();}

/* ---------- Книга ---------- */
function setName(n){docName=n||'Книга1';q('#docname').value=docName;}
q('#docname').onchange=e=>{docName=e.target.value||'Книга1';markDirty();};
const blank=()=>[{name:'Лист1',status:1,order:0,index:'s1',row:100,column:26,celldata:[]}];
function boot(sheets){
 try{L().destroy();}catch(e){}
 L().create({container:'luckysheet',lang:'en',showinfobar:false,plugins:['chart'],data:sheets,title:docName,
  hook:{updated:markDirty,cellUpdated:markDirty,workbookCreateAfter:()=>{markDirty();window.__weMarkDirty=markDirty;setTimeout(()=>{try{WEPivot2.activateSheet(L().getSheet().name);}catch(e){}setTimeout(renderSlicers,0);},0);},sheetActivate:(d)=>{setTimeout(()=>{const nm=(d&&d.sheetName)||L().getSheet().name;try{WEPivot2.activateSheet(nm);}catch(e){}try{WEGroups.renderOv();}catch(e){}setTimeout(renderSlicers,0);},0);} }});
 markDirty();
}
function snapshot(){
 const seen=new WeakSet();
 const sheets=L().getAllSheets().map(s=>{const o=Object.assign({},s);delete o.celldata;return o;});
 let wst=null;try{wst=WEPivot2.snapshot();}catch(e){}
 return JSON.stringify({name:docName,savedAt:Date.now(),sheets,we:WE,weStore:wst},(k,v)=>{if(v&&typeof v==='object'){if(seen.has(v))return undefined;seen.add(v);}return v;});
}
const idb=(m,v)=>new Promise((res,rej)=>{const o=indexedDB.open('webexcel',1);o.onupgradeneeded=()=>o.result.createObjectStore('kv');o.onerror=()=>rej(o.error);
 o.onsuccess=()=>{const st=o.result.transaction('kv',m==='get'?'readonly':'readwrite').objectStore('kv');const r=m==='get'?st.get('autosave'):st.put(v,'autosave');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);};});
async function autosave(){
 if(!dirty||!L())return;dirty=false;
 try{const txt=snapshot();await idb('put',txt).catch(()=>{});await fetch('/api/autosave',{method:'POST',body:txt});setStatus('Автосохранено '+new Date().toLocaleTimeString('ru-RU'));}
 catch(e){dirty=true;setStatus('Ошибка автосохранения');console.error(e);}
}
setInterval(autosave,5000);
['keyup','mouseup','paste'].forEach(ev=>q('#luckysheet').addEventListener(ev,markDirty,true));

/* ---------- Файлы ---------- */
async function saveBlob(blob,name,desc,ext){
 if(window.showSaveFilePicker){
  try{const h=await window.showSaveFilePicker({suggestedName:name,types:[{description:desc,accept:{[blob.type]:[ext]}}]});const w=await h.createWritable();await w.write(blob);await w.close();setStatus('Файл сохранён: '+h.name);return;}
  catch(e){if(e.name==='AbortError')return;}
 }
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);setStatus('Файл скачан: '+name);
}
async function exportXlsx(){
 if(importInfo&&(importInfo.pivots.length||importInfo.model)&&!confirm('В исходном файле были сводные таблицы / модель данных / срезы. В новый XLSX они попадут как обычные значения (исходный файл не изменится). Продолжить?'))return;
 try{const wb=WEXlsx.build(ExcelJS,L().getAllSheets());const buf=await wb.xlsx.writeBuffer();
  await saveBlob(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),docName+'.xlsx','Книга Excel','.xlsx');}
 catch(e){console.error(e);alert('Ошибка экспорта XLSX: '+e.message);}
}
async function exportCsv(){
 const d=L().getSheetData()||[];const esc=x=>/[";\n\r]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;
 const txt='\ufeff'+d.map(r=>(r||[]).map(c=>c?esc(String(c.m!=null?c.m:(c.v!=null?c.v:''))):'').join(';')).join('\r\n');
 await saveBlob(new Blob([txt],{type:'text/csv'}),docName+'.csv','CSV','.csv');
}
function parseCsv(t,d){const rows=[];let r=[],f='',q_=false;
 for(let i=0;i<t.length;i++){const c=t[i];
  if(q_){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q_=false;}else f+=c;}
  else if(c==='"')q_=true;else if(c===d){r.push(f);f='';}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;r.push(f);rows.push(r);r=[];f='';}
  else f+=c;}
 if(f!==''||r.length){r.push(f);rows.push(r);}return rows;}
function csvToSheet(text,name){
 text=text.replace(/^\ufeff/,'');const l=text.split(/\r?\n/)[0]||'';
 const d=[';',',','\t'].map(x=>[x,l.split(x).length]).sort((a,b)=>b[1]-a[1])[0][0];
 const rows=parseCsv(text,d);const R=Math.max(rows.length+20,100),Cn=Math.max(26,...rows.map(r=>r.length+3));
 const data=Array.from({length:R},()=>Array(Cn).fill(null));
 rows.forEach((r,i)=>r.forEach((x,j)=>{if(x==='')return;const t=x.trim();const n=/^-?\d+([.,]\d+)?$/.test(t)?parseFloat(t.replace(',','.')):null;
  data[i][j]=n!==null?{v:n,m:String(n),ct:{fa:'General',t:'n'}}:{v:x,m:x,ct:{fa:'General',t:'g'}};}));
 return [{name:name||'Лист1',status:1,order:0,index:'s1',row:R,column:Cn,data}];
}
let importInfo=null;
function toast(html){let t=q('#toast');if(!t){t=document.createElement('div');t.id='toast';t.style.cssText='position:fixed;top:168px;right:16px;max-width:430px;background:#fff8d6;border:1px solid #e0c96a;border-radius:4px;padding:10px 28px 10px 12px;z-index:60;font:12px "Segoe UI",Arial;box-shadow:0 2px 8px rgba(0,0,0,.2)';document.body.appendChild(t);}
 t.innerHTML='<span style="position:absolute;top:4px;right:8px;cursor:pointer" onclick="this.parentNode.remove()">✕</span>'+html;}
function reportImport(i){importInfo=i;if(!i||(!i.pivots.length&&!i.slicers&&!i.model))return;
 toast('<b>Файл загружен.</b><br>Сводных таблиц: '+i.pivots.length+(i.pivots.length?' ('+i.pivots.map(p=>p.sheet+'!'+p.ref).join(', ')+')':'')+
  '<br>Они показаны <b>со значениями из файла</b> и оформлены как сводные. '+(i.model?'Их данные хранятся в модели данных Excel (Power Pivot), которую браузерное приложение прочитать не может, поэтому пересчёт и перетаскивание полей для них невозможны. ':'')+
  (i.slicers?'<br>Срезов в файле: '+i.slicers+' — показаны на листе как в Excel (кнопка «Срезы» во вкладке «Вид» скрывает/показывает). Клик — выбрать значение, Ctrl+клик — несколько, ⛒ — сбросить; заголовок можно перетаскивать. Серые значения — их данных в файле нет.':'')+'<br>Новые рабочие сводные: Вставка → Сводная таблица (по данным на листе).');}
q('#fileinp').onchange=e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;const base=f.name.replace(/\.[^.]+$/,'');
 if(/\.xlsx$/i.test(f.name)){window.WEStore={pv:{},sl:{}};
  LuckyExcel.transformExcelToLucky(f,async(json)=>{if(!json||!json.sheets||!json.sheets.length)return alert('Не удалось прочитать файл');
   let info=null;try{info=await WEExtras.enhance(JSZip,DOMParser,await f.arrayBuffer(),json);}catch(er){console.error(er);}
   WE=info&&info.we?info.we:{pivots:{},slicers:{}};slicersOpen=true;setName(base);boot(json.sheets);reportImport(info);},err=>alert('Ошибка импорта XLSX: '+err));
 }else{const rd=new FileReader();rd.onload=()=>{WE={pivots:{},slicers:{}};setName(base);boot(csvToSheet(rd.result,'Лист1'));};rd.readAsText(f);}
};
document.addEventListener('keydown',e=>{
 if(e.ctrlKey&&!e.shiftKey&&!e.altKey){const k=e.key.toLowerCase();
  if(k==='s'){e.preventDefault();exportXlsx();}else if(k==='o'){e.preventDefault();q('#fileinp').click();}}
},true);

/* ---------- Русификация меню движка ---------- */
const RU={'Copy':'Копировать','Copy as':'Копировать как','Paste':'Вставить','Insert':'Вставить','Delete':'Удалить','Delete cell':'Удалить ячейки','Delete selected':'Удалить выбранные','Hide':'Скрыть','Hide selected':'Скрыть выбранные','Show hidden':'Показать скрытые','Towards':'В направлении','Left':'Слева','Right':'Справа','Top':'Сверху','Bottom':'Снизу','Move left':'Сдвиг влево','Move up':'Сдвиг вверх','Add':'Добавить','Row':'Строка','Column':'Столбец','Width':'Ширина','Height':'Высота','Number':'Число','Confirm':'ОК','A-Z order':'Сортировка А→Я','Z-A order':'Сортировка Я→А','Clear content':'Очистить содержимое','Matrix operation':'Матричные операции','Sort':'Сортировка','Filter':'Фильтр','Create chart':'Создать диаграмму','Transpose':'Транспонировать','Remove duplicate values':'Удалить дубликаты','Rename':'Переименовать','Change color':'Цвет вкладки','Move right':'Сдвиг вправо','Cancel':'Отмена','OK':'ОК','Sum':'Сумма','Average':'Среднее','Count':'Количество','Max':'Макс','Min':'Мин','Find':'Найти','Replace':'Заменить','Replace all':'Заменить все','Find all':'Найти все','Apply':'Применить','Close':'Закрыть','Select all':'Выделить всё','Add row':'Добавить строки','Back to top':'Наверх'};
function tr(n){
 if(n.nodeType===3){const t=n.nodeValue.trim();if(t&&RU[t])n.nodeValue=n.nodeValue.replace(t,RU[t]);}
 else if(n.nodeType===1&&!n.closest('#hdr')){n.childNodes.forEach(tr);}
}
new MutationObserver(ms=>ms.forEach(m=>{m.addedNodes.forEach(tr);if(m.type==='characterData')tr(m.target);})).observe(document.body,{childList:true,subtree:true,characterData:true});

/* ---------- Старт ---------- */
showTab('Главная');
(async function(){
 let sheets=null;
 try{const r=await fetch('/api/autosave');if(r.ok){const j=await r.json();if(j&&j.sheets&&j.sheets.length){sheets=j.sheets;setName(j.name);if(j.we)WE=j.we;}}}catch(e){}
 if(!sheets){try{const t=await idb('get');if(t){const j=JSON.parse(t);sheets=j.sheets;setName(j.name);if(j.we)WE=j.we;}}catch(e){}}
 window.__weMarkDirty=markDirty;
 try{const t=await idb('get');if(t&&!sheets){const j=JSON.parse(t);if(j.weStore)window.WEStore=j.weStore;}}catch(e){}
 boot(sheets||blank());dirty=false;setStatus('Готово');
})();
})();
