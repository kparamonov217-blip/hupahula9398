/* Группы строк/столбцов (как «Группировать» в Excel: уровни 1/2, кнопки +/−) и панель «Анализ данных» */
(function(root){
'use strict';
const L=()=>window.luckysheet;
function sheet(){try{return L().getSheet();}catch(e){return null;}}
function cfg(){const s=sheet();if(!s)return null;if(!s.config)s.config={};return s.config;}
function norm(o){const r={};Object.entries(o||{}).forEach(([k,v])=>r[+k]=v);return r;}
function markD(){try{root.__weMarkDirty&&root.__weMarkDirty();}catch(e){}}
function setStatus(t){const q=document.querySelector('#status');if(q)q.textContent=t;}
function refresh(){try{L().refreshFormula();}catch(e){}}

/* --- скрытие/показ через API движка (config.rowhidden/colhidden пересобирают layout) --- */
function hideRange(t,a,b){const c=cfg();if(!c)return;const key=t==='row'?'rowhidden':'colhidden',m=norm(c[key]),h=(t==='row'?19:73);
 for(let i=a;i<=b;i++)m[i]=h;c[key]=m;refresh();}
function showRange(t,a,b){const c=cfg();if(!c)return;const key=t==='row'?'rowhidden':'colhidden',m=norm(c[key]);let ch=false;
 for(let i=a;i<=b;i++)if(i in m){delete m[i];ch=true;}if(ch)c[key]=m;refresh();}

/* --- операции --- */
function depthOf(g,gr){let d=1;g.forEach(o=>{if(o!==gr&&o.a<=gr.a&&gr.b>=gr.b)d++;});return d;}
function maxDepth(g){let mx=1;g.forEach(gr=>mx=Math.max(mx,depthOf(g,gr)));return mx;}
function group(sel,t){const c=cfg();if(!c||sel.a>sel.b)return;const key=t==='row'?'groupR':'groupC';const g=c[key]||[];
 /* не дублируем точные совпадения */
 if(g.some(x=>x.a===sel.a&&x.b===sel.b)){renderOv();return;}
 g.push({a:sel.a,b:sel.b,collapsed:false});g.sort((x,y)=>x.a-y.a||x.b-y.b);c[key]=g;
 hideRange(t,sel.a,sel.b);markD();renderOv();setStatus('Группа создана ('+(t==='row'?'строки':'столбцы')+' '+(sel.a+1)+'–'+(sel.b+1)+'). Кнопки +/− слева/сверху.');}
function ungroup(sel,t){const c=cfg();if(!c)return;const key=t==='row'?'groupR':'groupC',g=c[key]||[];
 const hid=norm(c[t==='row'?'rowhidden':'colhidden']);
 c[key]=g.filter(gr=>{if(gr.a>=sel.a&&gr.b<=sel.b){
   for(let i=gr.a;i<=gr.b;i++){let inOther=g.some(o=>o!==gr&&o.a<=i&&i<=o.b);if(!inOther)delete hid[i];}return false;}return true;});
 c[t==='row'?'rowhidden':'colhidden']=hid;markD();renderOv();refresh();setStatus('Группы удалены');}
function toggle(gr,t){gr.collapsed=!gr.collapsed;if(gr.collapsed)hideRange(t,gr.a,gr.b);else showRange(t,gr.a,gr.b);markD();renderOv();}
function setLevel(t,lvl){const c=cfg();if(!c)return;const key=t==='row'?'groupR':'groupC',g=c[key]||[];
 const hk=t==='row'?'rowhidden':'colhidden',ms=norm(c[hk]);
 g.forEach(gr=>{for(let i=gr.a;i<=gr.b;i++)delete ms[i];});
 g.forEach(gr=>{const hide=depthOf(g,gr)>lvl;gr.collapsed=hide;
  if(hide)for(let i=gr.a;i<=gr.b;i++)ms[i]=(t==='row'?19:73);});
 c[hk]=ms;markD();renderOv();refresh();}

/* --- оверлей кнопок и линий (позиционируем по геометрии движка) --- */
let ovRaf=0;
function ensureOv(){let o=document.querySelector('#grpv');if(o)return o;o=document.createElement('div');o.id='grpv';
 o.style.cssText='position:fixed;z-index:58;left:0;top:0;width:0;height:0';document.body.appendChild(o);
 o.addEventListener('mousedown',e=>{const b=e.target.closest('.gb');if(!b)return;e.preventDefault();e.stopPropagation();
  const c=cfg();if(!c)return;const t=b.dataset.t,i=+b.dataset.i;
  const g=c[t==='row'?'groupR':'groupC']||[];if(g[i])toggle(g[i],t);},true);
 return o;}
function geom(){const cm=document.querySelector('#luckysheet-cell-main');if(!cm)return null;const cb=cm.getBoundingClientRect();
 const rh=document.querySelector('#luckysheet-rows-h');const rb=rh?rh.getBoundingClientRect():{right:cb.left};
 const st=L().getSheet();if(!st)return null;const c=st.config||{};const z=(c.zoom||100)/100;
 const sy=(document.querySelector('#luckysheet-scrollbar-y')||{}).scrollTop||0;
 const sx=(document.querySelector('#luckysheet-scrollbar-x')||{}).scrollLeft||0;
 const hid=c.rowhidden||{},rl=c.rowlen||{},ch=c.colhidden||{},cl=c.columnlen||{};
 const yAt=r=>{let y=cb.top+20-sy*z;for(let k=0;k<r;k++)if(!(k in hid))y+=(rl[k]||19)*z;return y;};
 const xAt=c2=>{let x=cb.left-sx*z;for(let k=0;k<c2;k++)if(!(k in ch))x+=(cl[k]||73)*z;return x;};
 return {yAt,xAt,z,cb,rb};}
function draw(){const o=ensureOv();const c=cfg();if(!c||!L()){if(o)o.innerHTML='';return;}
 const gR=c.groupR||[],gC=c.groupC||[];if(!gR.length&&!gC.length){o.innerHTML='';return;}
 const gm=geom();if(!gm){o.innerHTML='';return;}
 let h='';
 const mdR=maxDepth(gR),mdC=maxDepth(gC);
 gR.forEach((gr,i)=>{const dep=depthOf(gR,gr);const x=gm.rb.right-(mdR-dep+1)*16+4;
  const y1=gm.yAt(gr.a),y2=gm.yAt(gr.b+1);if(y2<gm.cb.top||y1>gm.cb.bottom)return;
  h+=`<div class="gl" style="left:${x}px;top:${y1}px;height:${Math.max(0,y2-y1)}px;border-left:1px solid #888;border-top:1px solid #888;border-bottom:1px solid #888"></div>`;
  const cy=Math.min(Math.max((y1+y2)/2-8,gm.cb.top+2),gm.cb.bottom-18);
  h+=`<div class="gb" data-t="row" data-i="${i}" style="left:${x-7}px;top:${cy}px">${gr.collapsed?'+':'−'}</div>`;});
 gC.forEach((gr,i)=>{const dep=depthOf(gC,gr);const y=gm.cb.top-(mdC-dep+1)*16+4;
  const x1=gm.xAt(gr.a),x2=gm.xAt(gr.b+1);if(x2<gm.cb.left||x1>gm.cb.right)return;
  h+=`<div class="gl" style="top:${y}px;left:${x1}px;width:${Math.max(0,x2-x1)}px;border-top:1px solid #888;border-left:1px solid #888;border-right:1px solid #888"></div>`;
  const cx=Math.min(Math.max((x1+x2)/2-8,gm.cb.left+2),gm.cb.right-18);
  h+=`<div class="gb" data-t="col" data-i="${i}" style="left:${cx}px;top:${y-7}px">${gr.collapsed?'+':'−'}</div>`;});
 o.innerHTML=h;}
function renderOv(){draw();cancelAnimationFrame(ovRaf);const f=()=>{draw();ovRaf=requestAnimationFrame(f);};ovRaf=requestAnimationFrame(f);}

/* --- выделение --- */
function selRange(){try{const r=L().getRange()[0];return r;}catch(e){return null;}}
function groupRows(){const r=selRange();if(!r)return alert('Выделите строки');group({a:r.row[0],b:r.row[1]},'row');}
function groupCols(){const r=selRange();if(!r)return alert('Выделите столбцы');group({a:r.column[0],b:r.column[1]},'col');}
function ungroupSel(){const r=selRange();if(!r)return;ungroup({a:r.row[0],b:r.row[1]},'row');ungroup({a:r.column[0],b:r.column[1]},'col');}

/* --- панель анализа (как контекстная вкладка «Данные/Анализ» в Excel) --- */
function openAnalyze(){const r=selRange();if(!r)return alert('Выделите диапазон данных');
 const [r1,r2]=[r.row[0],r.row[1]],c1=r.column[0],c2=r.column[1];
 const d=L().getSheetData()||[];const val=(rr,cc)=>{const x=d[rr]&&d[rr][cc];return x?(x.v!=null?x.v:''):'';};
 const labels=[];for(let c=c1;c<=c2;c++)labels.push(String(val(r1,c)||('Столбец '+(c-c1+1))));
 const rows=[];for(let rr=r1;rr<=r2;rr++){const a=[];for(let c=c1;c<=c2;c++)a.push(val(rr,c));rows.push(a);}
 const m=document.createElement('div');m.className='wemodal';
 m.innerHTML=`<div class="wecard"><h3>Анализ данных <span style="color:#888;font-weight:400">(${labels.length} пол. × ${rows.length} строк)</span></h3>
 <table>
 <tr><td>Фильтр по значению:</td><td><select id="an_col">${labels.map((l,i)=>`<option value="${i}">${esc(l)}</option>`).join('')}</select>
 <select id="an_val" style="min-width:150px"></select> <button id="an_go">Применить</button> <button id="an_clr">Показать все</button></td></tr>
 <tr><td>Подытог SUBTOTAL:</td><td><button id="an_sub">Вставить строку подытога снизу выделения</button>
 <button id="an_grp">…и сгруппировать детали</button></td></tr>
 <tr><td>Условное форматирование:</td><td><input id="an_th" type="number" style="width:90px"> <select id="an_op"><option value="gt">больше</option><option value="lt">меньше</option></select>
 <button id="an_cf">Закрасить ячейки</button></td></tr>
 <tr><td>Удалить дубликаты:</td><td><button id="an_dup">Удалить повторяющиеся строки</button></td></tr>
 <tr><td>Текст по столбцам:</td><td>разделитель <input id="an_sep" value="," style="width:50px"> <button id="an_split">Разделить первый столбец</button></td></tr>
 </table><div style="text-align:right;margin-top:10px"><button id="an_x">Закрыть</button></div></div>`;
 document.body.appendChild(m);const g=id=>m.querySelector('#'+id);
 const fillVals=()=>{const ci=+g('an_col').value,set=new Set();rows.forEach(r=>{const v=String(r[ci]);if(v!=='')set.add(v);});
  g('an_val').innerHTML=[...set].sort((a,b)=>a.localeCompare(b,'ru')).map(v=>`<option>${esc(v)}</option>`).join('');};
 g('an_col').onchange=fillVals;fillVals();
 g('an_x').onclick=()=>m.remove();m.addEventListener('mousedown',e=>{if(e.target===m)m.remove();});
 g('an_go').onclick=()=>{const ci=+g('an_col').value,v=g('an_val').value;let n=0;
  rows.forEach((rw,i)=>{if(String(rw[ci])!==v){L().hideRow(r1+i,r1+i);n++;}});markD();m.remove();setStatus('Фильтр применён: скрыто строк — '+n);};
 g('an_clr').onclick=()=>{for(let rr=r1;rr<=r2;rr++)L().showRow(rr,rr);markD();m.remove();setStatus('Скрытые строки показаны');};
 g('an_sub').onclick=()=>{const ci=+g('an_col').value;
  const f='=SUBTOTAL(9,'+cl(c1+ci)+String(r1+2)+':'+cl(c1+ci)+String(r2+1)+')';
  L().insertRow(r2);L().setCellValue(r2+1,c1+ci,{v:f,m:'',bl:1});markD();m.remove();setStatus('Строка подытога добавлена');};
 g('an_grp').onclick=()=>{const ci=+g('an_col').value;
  const f='=SUBTOTAL(9,'+cl(c1+ci)+String(r1+2)+':'+cl(c1+ci)+String(r2+1)+')';
  L().insertRow(r2);L().setCellValue(r2+1,c1+ci,{v:f,m:'',bl:1});
  group({a:r1,b:r2-1},'row');m.remove();};
 g('an_dup').onclick=()=>{const seen=new Set(),del=[];rows.forEach((rw,i)=>{const k=rw.join('\u0001');if(seen.has(k))del.push(r1+i);else seen.add(k);});
  del.reverse().forEach(rr=>{try{L().deleteRow(rr,rr);}catch(e){}});markD();m.remove();setStatus('Удалено дубликатов: '+del.length);};
 g('an_cf').onclick=()=>{const th=+g('an_th').value,op=g('an_op').value;const ranges=[];
  for(let c=c1;c<=c2;c++){const col=cl(c);ranges.push({row:[r1,r2],column:[c,c]});}
  const color=op==='gt'?'#ffb7b7':'#b7f0b7';
  try{L().setConditionalFormat([{type:'cell',value:{operation:'greater'==op?'gt':'lt'},range:ranges,cellformat:{bg:color}}]);}catch(e){
   /* запасной вариант: прямая раскраска числовых ячеек */
   for(let rr=r1;rr<=r2;rr++)for(let c=c1;c<=c2;c++){const x=d[rr]&&d[rr][c];if(x&&typeof x.v==='number'&&((op==='gt'&&x.v>th)||(op==='lt'&&x.v<th)))
    L().setCellFormat(rr,c,'background',color);}}
  markD();m.remove();setStatus('Условное форматирование применено');};
 g('an_split').onclick=()=>{const sep=g('an_sep').value||',';rows.forEach((rw,i)=>{const parts=String(rw[0]).split(sep);
  parts.forEach((p,j)=>L().setCellValue(r1+i,c1+j,p.trim()));});markD();m.remove();};}
function esc(x){return String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function cl(n){let s='';n++;while(n){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26);}return s;}

function getGroups(){const c=cfg();return c?{row:c.groupR||[],col:c.groupC||[]}:{row:[],col:[]};}
function clearMarks(c){if(!c)return;delete c.groupR;delete c.groupC;}

root.WEGroups={groupRows,groupCols,ungroupSel,setLevel,maxDepth,getGroups,openAnalyze,renderOv,clearMarks,
 levelButtons(){return null;},
 canGroup(){const r=selRange();return !!(r&&(r.row[1]>r.row[0]||r.column[1]>r.column[0]));}};
})(window);
