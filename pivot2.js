/* Полноценные сводные таблицы: панель полей (drag&drop), иерархия строк с раскрытием (+/−),
   срезы, промежуточные итоги, пересчёт из источника. Результат — обычные ячейки листа + кнопки-оверлей. */
(function(root){
'use strict';
const L=()=>window.luckysheet;
const key=v=>v==null||v===''?'(пусто)':String(v);
const cmp=(a,b)=>{const x=+a,y=+b;return(!isNaN(x)&&!isNaN(y))?x-y:String(a).localeCompare(String(b),'ru');};
function agg(fn,a){const n=a.filter(x=>typeof x==='number'&&isFinite(x));
 if(fn==='count')return a.length;if(fn==='countNum')return n.length;if(!n.length)return fn==='sum'?0:null;
 if(fn==='sum')return n.reduce((s,x)=>s+x,0);if(fn==='avg')return n.reduce((s,x)=>s+x,0)/n.length;
 if(fn==='max')return Math.max(...n);if(fn==='min')return Math.min(...n);}
const FL={sum:'Сумма',count:'Количество',countNum:'Число',avg:'Среднее',max:'Максимум',min:'Минимум'};
function esc(x){return String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

let PIV=null,SLICERS=[],nextId=1;
function markD(){try{root.__weMarkDirty&&root.__weMarkDirty();}catch(e){}}
function setStatus(t){const q=document.querySelector('#status');if(q)q.textContent=t;}

/* ---------- источник ---------- */
function readSource(s){const d=L().getSheetData()||[];const val=(r,c)=>{const x=d[r]&&d[r][c];return x?(x.v!=null?x.v:null):null;};
 const rowFull=r=>{for(let c=0;c<(d[r]||[]).length;c++)if(val(r,c)!=null&&val(r,c)!=='')return true;return false;};
 let r1=s.r1,r2=s.r2,c1=s.c1,c2=s.c2;
 if(r1===r2&&c1===c2){while(r1>0&&rowFull(r1-1))r1--;r2=s.r1;while(r2+1<d.length&&rowFull(r2+1))r2++;
  c1=1e9;c2=-1;for(let r=r1;r<=r2;r++)for(let c=0;c<(d[r]||[]).length;c++)if(val(r,c)!=null&&val(r,c)!==''){c1=Math.min(c1,c);c2=Math.max(c2,c);}}
 if(c2<0||r2<=r1)return null;
 const labels=[];for(let c=c1;c<=c2;c++){const h=val(r1,c);labels.push(h!=null&&h!==''?String(h):'Столбец '+(c-c1+1));}
 const rows=[];for(let r=r1+1;r<=r2;r++){const a=[];for(let c=c1;c<=c2;c++)a.push(val(r,c));if(a.some(x=>x!=null&&x!==''))rows.push(a);}
 return {r1,r2,c1,c2,labels,rows};}
function filteredRows(src){if(!SLICERS.length)return src.rows.slice();
 return src.rows.filter(r=>SLICERS.every(s=>{const i=src.labels.indexOf(s.field);if(i<0)return true;return !s.off.includes(key(r[i]));}));}

/* ---------- вычисление ---------- */
function compute(pv,src){
 const ri=pv.rows.map(f=>src.labels.indexOf(f)),ci=pv.cols.map(f=>src.labels.indexOf(f));
 const vi=pv.vals.map(o=>({i:src.labels.indexOf(o.f),fn:o.fn,nm:FL[o.fn]+' по «'+o.f+'»'}));
 const rows=filteredRows(src);
 const rowKids=new Map(),colKids=new Map(),vals=new Map();
 const bump=(mp,par,k)=>{if(!mp.has(par))mp.set(par,new Set());mp.get(par).add(k);};
 const put=(k,vr)=>{if(!vals.has(k))vals.set(k,vi.map(()=>[]));const a=vals.get(k);vr.forEach((v,i)=>a[i].push(v));};
 rows.forEach(r=>{const rp=ri.map(i=>key(r[i])),cp=ci.map(i=>key(r[i])),vr=vi.map(o=>r[o.i]);
  for(let lr=1;lr<=rp.length;lr++)bump(rowKids,rp.slice(0,lr-1).join('\u0001'),rp[lr-1]);
  for(let lc=1;lc<=cp.length;lc++)bump(colKids,cp.slice(0,lc-1).join('\u0001'),cp[lc-1]);
  for(let lr=0;lr<=rp.length;lr++){const pr=rp.slice(0,lr).join('\u0001');
   for(let lc=0;lc<=cp.length;lc++)put(pr+'\u0002'+cp.slice(0,lc).join('\u0001'),vr);}});
 /* итоги по колонкам (без строковой размерности): ключ G\u0002<colPrefix> */
 rows.forEach(r=>{const cp=ci.map(i=>key(r[i])),vr=vi.map(o=>r[o.i]);
  for(let lc=0;lc<=cp.length;lc++){const k='G\u0002'+cp.slice(0,lc).join('\u0001');
   if(!vals.has(k))vals.set(k,vi.map(()=>[]));const a=vals.get(k);vr.forEach((v,i)=>a[i].push(v));}});
 return {rowKids,colKids,vals,ri,ci,vi};}

/* ---------- сетка результата ---------- */
function cellPut(r,c,v,s){const num=typeof v==='number';
 const o=num?{v:v,m:String(Math.round(v*1e6)/1e6),ct:{fa:'#,##0.###',t:'n'}}:{v:v==null?'':String(v),m:v==null?'':String(v),ct:{fa:'General',t:'g'}};
 if(s==='hh')Object.assign(o,{bl:1,bg:'#8ea0db',fc:'#fff'});
 if(s==='h')Object.assign(o,{bl:1,bg:'#dbe5f1'});
 if(s==='sub')Object.assign(o,{bl:1,bg:'#edf2f9'});
 if(s==='tot')Object.assign(o,{bl:1,bg:'#c6d9f1'});
 if(s==='lbl')Object.assign(o,{bg:'#f7f7f7'});
 try{L().setCellValue(r,c,o);}catch(e){}}
function clearRect(r1,c1,r2,c2){const d=L().getSheetData()||[];for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++){const x=d[r]&&d[r][c];if(x)try{L().setCellValue(r,c,null);}catch(e){}}}

function buildGrid(pv,res){
 const {rowKids,colKids,vals,ri,ci,vi}=res;const nv=vi.length||1;
 const kidsOf=(mp,par)=>[...(mp.get(par)||[])].sort(pv.sortVal?cmpRev:cmp);
 function cmpRev(a,b){const ka=a,kb=b;const va=(vals.get(ka+'\u0002')||[[]])[0].filter(x=>typeof x==='number').reduce((s,x)=>s+x,0);
  const vb=(vals.get(kb+'\u0002')||[[]])[0].filter(x=>typeof x==='number').reduce((s,x)=>s+x,0);return vb-va||cmp(a,b);}
 const leaves=[];const headRows=[];
 function measure(prefix){if(prefix.length>=ci.length)return nv;let s=0;kidsOf(colKids,prefix.join('\u0001')).forEach(k=>s+=measure(prefix.concat([k])));return s||nv;}
 (function flat(prefix,depth){if(depth>=ci.length)return;headRows[depth]=headRows[depth]||[];
  kidsOf(colKids,prefix.join('\u0001')).forEach(k=>{headRows[depth].push({v:k,span:measure(prefix.concat([k]))});flat(prefix.concat([k]),depth+1);leaves.push(prefix.concat([k]));});})([],0);
 if(!ci.length)leaves.push([]);
 const multi=nv>1&&ci.length;
 const body=[];
 (function walkRows(prefix,depth){kidsOf(rowKids,prefix.join('\u0001')).forEach(k=>{const path=prefix.concat([k]);
  body.push({type:'row',path,depth,label:k});
  if(ri.length>1&&!pv.hideTotals&&depth<ri.length-1)body.push({type:'sub',path,depth,label:k});
  walkRows(path,depth+1);});})([],0);
 const totalCols=1+leaves.length*nv+(pv.hideTotals?0:nv);
 const grid=[];
 const hdrN=Math.max(headRows.length,(multi?1:0),1);
 for(let hd=0;hd<hdrN;hd++){const row=new Array(totalCols).fill(null);
  if(hd===0)row[0]={v:pv.rows.join('\u2009▾\u2009')||'Значения',s:'hh'};
  let c=1;
  if(multi&&hd===headRows.length){leaves.forEach(lf=>vi.forEach(o=>{row[c]={v:o.nm,s:'h'};c++;}));}
  else{(headRows[hd]||[]).forEach(h=>{row[c]={v:h.v,s:'h'};c+=h.span;});
   if(!ci.length&&hd===0){row[1]={v:pv.vals.map(o=>o.nm).join(', ')||'Значения',s:'h'};}}
  if(!pv.hideTotals&&hd===hdrN-1){row[totalCols-nv]={v:nv>1?'Итоги':'Итог',s:'hh'};}
  grid.push(row);}
 const dataStart=grid.length;
 body.forEach(b=>{const row=new Array(totalCols).fill(null);
  row[0]={v:b.type==='sub'?b.label+' — итог':b.label,s:b.type==='sub'?'sub':(b.depth===0?'lbl':'')};
  let c=1;const pref=b.path.join('\u0001');
  leaves.forEach(lf=>{const arr=vals.get(pref+'\u0002'+lf.join('\u0001'))||vi.map(()=>[]);
   vi.forEach((vo,oi)=>{row[c]={v:agg(vo.fn,arr[oi]||[]),s:''};c++;});});
  if(!pv.hideTotals){const at=vals.get(pref+'\u0002')||vi.map(()=>[]);
   vi.forEach((vo,oi)=>{row[c]={v:agg(vo.fn,at[oi]||[]),s:'tot'};c++;});}
  grid.push(row);});
 if(!pv.hideTotals){const row=new Array(totalCols).fill(null);row[0]={v:'Общий итог',s:'tot'};let c=1;
  leaves.forEach(lf=>{const arr=vals.get('G\u0002'+lf.join('\u0001'))||vi.map(()=>[]);
   vi.forEach((vo,oi)=>{row[c]={v:agg(vo.fn,arr[oi]||[]),s:'tot'};c++;});});
  const grand=vals.get('G\u0002')||vi.map(()=>[]);
  vi.forEach((vo,oi)=>{row[c]={v:agg(vo.fn,grand[oi]||[]),s:'tot'};c++;});
  grid.push(row);}
 return {grid,body,headRows,leaves,totalCols,dataStart,res,hdrN};}

/* ---------- запись на лист ---------- */
function render(pv,src){root.WEStore=root.WEStore||{pv:{},sl:{}};const nm=L().getSheet().name;
 const old=(WEStore.pv[nm]||{})[pv.id];if(old&&old.pos)clearRect(old.pos.r,old.pos.c,old.pos.r+(old.h||40)-1,old.pos.c+(old.w||30)-1);
 const res=compute(pv,src);const g=buildGrid(pv,res);
 if(!pv.pos||pv.autoPos)pv.pos={r:src.r1,c:src.c2+2};
 g.grid.forEach((row,i)=>{row.forEach((cell,j)=>{if(!cell)return;
  if(cell.v!=null&&cell.v!=='')cellPut(pv.pos.r+i,pv.pos.c+j,cell.v,cell.s);
  else if(cell.s)cellPut(pv.pos.r+i,pv.pos.c+j,'',cell.s);});});
 pv.grid=g;pv.dim={w:g.totalCols,h:g.grid.length,pos:pv.pos};
 try{L().refreshFormula();}catch(e){}
 return pv.dim;}

/* ---------- скрытие строк при сворачивании ---------- */
function subtreeEnd(body,i){const d=body[i].depth;let j=i+1;while(j<body.length&&!(body[j].type==='row'&&body[j].depth<=d))j++;return j-1;}
function applyCollapse(pv){const st=L().getSheet();const cfg=st.config||(st.config={});const hid=cfg.rowhidden||(cfg.rowhidden={});
 cfg.__pvHid=cfg.__pvHid||{};Object.keys(cfg.__pvHid).forEach(r=>delete hid[r]);cfg.__pvHid={};
 const g=pv.grid;if(!g)return;
 g.body.forEach((b,i)=>{if(b.type==='row'&&pv.collapsed.has(b.path.join('\u0001'))){const e=subtreeEnd(g.body,i);
  for(let j=i+1;j<=e;j++){const rr=pv.dim.pos.r+g.dataStart+j;hid[rr]=19;cfg.__pvHid[rr]=1;}}});
 try{L().refreshFormula();}catch(e){}}

/* ---------- оверлей кнопок +/− ---------- */
let ovRaf=0;
function ensureOv(){let o=document.querySelector('#pvov');if(o)return o;o=document.createElement('div');o.id='pvov';
 o.style.cssText='position:fixed;z-index:59;left:0;top:0;width:0;height:0';document.body.appendChild(o);
 o.addEventListener('mousedown',e=>{const b=e.target.closest('.pvbtn');if(!b)return;e.preventDefault();e.stopPropagation();
  const pk=decodeURIComponent(b.dataset.k);PIV.collapsed.has(pk)?PIV.collapsed.delete(pk):PIV.collapsed.add(pk);
  rebuild();drawOv();},true);
 return o;}
function geom(){const cm=document.querySelector('#luckysheet-cell-main');if(!cm)return null;const cb=cm.getBoundingClientRect();
 const st=L().getSheet();if(!st)return null;const cfg=st.config||{};const z=(cfg.zoom||100)/100;
 const sy=(document.querySelector('#luckysheet-scrollbar-y')||{}).scrollTop||0;
 const sx=(document.querySelector('#luckysheet-scrollbar-x')||{}).scrollLeft||0;
 const hid=cfg.rowhidden||{},rl=cfg.rowlen||{},ch=cfg.colhidden||{},cl=cfg.columnlen||{};
 const top=cb.top+20-sy*z,left=cb.left-sx*z;
 const yAt=r=>{let y=top;for(let k=0;k<r;k++)if(!(k in hid))y+=(rl[k]||19)*z;return y;};
 const xAt=c=>{let x=left;for(let k=0;k<c;k++)if(!(k in ch))x+=(cl[k]||73)*z;return x;};
 return {yAt,xAt,z,cb};}
function drawOv(){const o=ensureOv();if(!PIV||!PIV.grid||!PIV.dim||!L()){if(o)o.innerHTML='';return;}
 const gm=geom();if(!gm){o.innerHTML='';return;}
 const g=PIV.grid,pos=PIV.dim.pos;let h='';
 const maxD=Math.max(0,...g.body.filter(b=>b.type==='row').map(b=>b.depth));
 g.body.forEach((b,i)=>{if(b.type!=='row')return;const pk=b.path.join('\u0001');
  const isParent=g.body.slice(i+1).some(o2=>o2.type==='row'&&o2.depth===b.depth+1&&o2.path.slice(0,b.depth+1).join('\u0001')===pk);
  if(!isParent)return;
  const y=gm.yAt(pos.r+g.dataStart+i),x=gm.xAt(pos.c)-(maxD-b.depth)*14-16;
  if(x<gm.cb.left-60||x>gm.cb.right||y<gm.cb.top-20||y>gm.cb.bottom)return;
  h+=`<div class="pvbtn ${PIV.collapsed.has(pk)?'pl':'mi'}" data-k="${encodeURIComponent(pk)}" style="left:${x}px;top:${y+1}px">${PIV.collapsed.has(pk)?'+':'−'}</div>`;});
 o.innerHTML=h;}
function ovLoop(){cancelAnimationFrame(ovRaf);const f=()=>{drawOv();ovRaf=requestAnimationFrame(f);};ovRaf=requestAnimationFrame(f);}

/* ---------- панель полей ---------- */
function fieldsPanel(force){let p=document.querySelector('#pvfp');
 if(p&&force===undefined){p.remove();return;}
 if(!PIV)return alert('Сначала создайте сводную таблицу (Вставка → Сводная таблица)');
 if(p)return;
 p=document.createElement('div');p.id='pvfp';
 p.innerHTML=`<div class="fphead">Поля сводной таблицы<span class="fpx" title="Закрыть">✕</span></div>
 <div class="fpzones">
 <div class="fz" data-z="f"><i>Поля</i><div class="fzl"></div></div>
 <div class="fz fz4" data-z="flt"><i>Фильтры</i><div class="fzl"></div></div>
 <div class="fz" data-z="col"><i>Столбцы</i><div class="fzl"></div></div>
 <div class="fz" data-z="row"><i>Строки</i><div class="fzl"></div></div>
 <div class="fz" data-z="dat"><i>Значения</i><div class="fzl"></div></div></div>
 <div class="fpfoot"><button id="fpRefresh" title="Пересчитать из источника">↻ Обновить</button>
 <button id="fpSlicer">Срез</button><button id="fpDel">Удалить</button></div>`;
 document.body.appendChild(p);
 p.querySelector('.fpx').onclick=()=>p.remove();
 p.querySelector('#fpRefresh').onclick=rebuild;
 p.querySelector('#fpSlicer').onclick=slicerDialog;
 p.querySelector('#fpDel').onclick=()=>{if(!confirm('Удалить сводную таблицу с листа?'))return;
  const nm=L().getSheet().name;const old=(root.WEStore.pv[nm]||{})[PIV.id];
  if(old&&old.pos)clearRect(old.pos.r,old.pos.c,old.pos.r+(old.h||40)-1,old.pos.c+(old.w||30)-1);
  delete root.WEStore.pv[nm][PIV.id];PIV=null;p.remove();const o=document.querySelector('#pvov');if(o)o.innerHTML='';markD();};
 p.addEventListener('dragstart',e=>{const it=e.target.closest('[data-f]');if(!it)return;
  e.dataTransfer.setData('text/plain',JSON.stringify({f:it.dataset.f,z:it.dataset.z}));});
 p.addEventListener('dragover',e=>{const z=e.target.closest('.fz');if(z){e.preventDefault();z.classList.add('hot');}});
 p.addEventListener('dragleave',e=>{const z=e.target.closest('.fz');if(z)z.classList.remove('hot');});
 p.addEventListener('drop',e=>{const z=e.target.closest('.fz');if(!z)return;e.preventDefault();z.classList.remove('hot');
  let d;try{d=JSON.parse(e.dataTransfer.getData('text/plain'));}catch(er){return;}moveField(d.f,d.z,z.dataset.z);});
 drawFields(p);}
function moveField(f,from,to){if(!PIV)return;
 if(to==='f'){PIV.rows=PIV.rows.filter(x=>x!==f);PIV.cols=PIV.cols.filter(x=>x!==f);PIV.vals=PIV.vals.filter(o=>o.f!==f);
  SLICERS=SLICERS.filter(s=>s.field!==f);}
 else if(from===to)return;
 else if(to==='row'){PIV.rows=PIV.rows.filter(x=>x!==f);PIV.rows.push(f);}
 else if(to==='col'){PIV.cols=PIV.cols.filter(x=>x!==f);PIV.cols.push(f);}
 else if(to==='dat'){PIV.vals.push({f,fn:/кол|шт|колич/i.test(f)?'count':'sum'});}
 else if(to==='flt'){SLICERS.push({field:f,off:[],x:20+SLICERS.length*190,y:20,w:170,h:190});renderSlicers();}
 PIV.collapsed.clear();rebuild();drawFields(document.querySelector('#pvfp'));}
function drawFields(p){if(!p||!PIV||!PIV.src)return;
 const used=new Set([...PIV.rows,...PIV.cols,...PIV.vals.map(o=>o.f),...SLICERS.map(s=>s.field)]);
 const set=(z,html)=>{const el=p.querySelector('[data-z='+z+'] .fzl');if(el)el.innerHTML=html;};
 set('f',PIV.src.labels.map(l=>`<div class="fitem" draggable="true" data-f="${esc(l)}" data-z="f"><span class="fic">${used.has(l)?'☑':'☐'}</span>${esc(l)}</div>`).join(''));
 set('row',PIV.rows.map(f=>chip(f,'row')).join(''));
 set('col',PIV.cols.map(f=>chip(f,'col')).join(''));
 set('dat',PIV.vals.map(o=>`<span class="fchip" draggable="true" data-f="${esc(o.f)}" data-z="dat" title="ПКМ — изменить операцию">${esc(FL[o.fn]+' по «'+o.f+'»')}</span>`).join(''));
 set('flt',SLICERS.map(s=>chip(s.field,'flt')).join(''));
 p.querySelectorAll('.fitem').forEach(it=>it.onclick=()=>moveField(it.dataset.f,'f','dat'));
 p.querySelectorAll('.fchip').forEach(c=>c.oncontextmenu=e=>{e.preventDefault();const f=c.dataset.f,z=c.dataset.z;
  if(z==='dat'){const oi=PIV.vals.findIndex(o=>o.f===f);const next=['sum','count','avg','max','min','countNum'];
   PIV.vals[oi].fn=next[(next.indexOf(PIV.vals[oi].fn)+1)%next.length];rebuild();drawFields(p);}
  else moveField(f,z,'f');});}
function chip(f,z){return `<span class="fchip" draggable="true" data-f="${esc(f)}" data-z="${z}">${esc(f)}</span>`;}

/* ---------- срезы ---------- */
function slicerDialog(){if(!PIV)return alert('Сначала создайте сводную таблицу');
 const f=prompt('Поле для среза:\n'+PIV.src.labels.map((l,i)=>(i+1)+'. '+l).join('\n'),'1');if(!f)return;
 const idx=/^\d+$/.test(f)?+f-1:PIV.src.labels.indexOf(f);
 if(idx<0||idx>=PIV.src.labels.length)return alert('Неверное поле');
 SLICERS.push({field:PIV.src.labels[idx],off:[],x:20+SLICERS.length*190,y:20,w:170,h:190});renderSlicers();rebuild();}
let slVisible=true;
function renderSlicers(){let box=document.querySelector('#slbox2');
 if(!box){box=document.createElement('div');box.id='slbox2';document.body.appendChild(box);
  box.addEventListener('click',e=>{const w=e.target.closest('.wesl');if(!w)return;const s=SLICERS[+w.dataset.i];if(!s)return;
   if(e.target.closest('.slx')){s.off=[];rebuild();renderSlicers();return;}
   const it=e.target.closest('.sli');if(!it)return;const v=s.all[+it.dataset.j];
   if(e.ctrlKey||e.metaKey)s.off=s.off.includes(v)?s.off.filter(x=>x!==v):s.off.concat([v]);
   else{const only=s.items.filter(x=>x!==v);s.off=(s.off.length===only.length&&only.every(x=>s.off.includes(x)))?[]:only;}
   rebuild();renderSlicers();});
  box.addEventListener('mousedown',e=>{const rz=e.target.closest('.slrz'),h=e.target.closest('.slh'),w=e.target.closest('.wesl');
   if(!w||(!h&&!rz)||e.target.closest('.slx'))return;const s=SLICERS[+w.dataset.i];if(!s)return;e.preventDefault();
   const x0=e.clientX,y0=e.clientY,sx=s.x,sy=s.y,sw=s.w,sh=s.h;
   const mv=ev=>{if(rz){s.w=Math.max(120,sw+ev.clientX-x0);s.h=Math.max(80,sh+ev.clientY-y0);}
    else{s.x=Math.max(0,sx+ev.clientX-x0);s.y=Math.max(0,sy+ev.clientY-y0);}renderSlicers();},
   up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);store();};
   document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});}
 if(!PIV||!PIV.src||!SLICERS.length||!slVisible){if(box){box.innerHTML='';box.style.display='none';}return;}
 box.style.display='';
 const rows=PIV.src.rows;
 box.innerHTML=SLICERS.map((s,i)=>{const fi=PIV.src.labels.indexOf(s.field);if(fi<0)return '';const cnt=new Map();
  const otherOff=SLICERS.filter(x=>x!==s);
  rows.forEach(r=>{if(otherOff.every(o=>{const oi=PIV.src.labels.indexOf(o.field);return oi<0||!o.off.includes(key(r[oi]));}))
   {const v=key(r[fi]);cnt.set(v,(cnt.get(v)||0)+1);}});
  s.all=[...cnt.keys()].sort(cmp);s.items=s.all.slice();
  return `<div class="wesl" data-i="${i}" style="left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px"><div class="slh"><span>${esc(s.field)}</span><span class="slx" title="Сбросить фильтр">⛒</span></div><div class="slb">`+
   s.all.map((v,j)=>`<div class="sli ${s.off.includes(v)?'':'on'}" data-j="${j}">${esc(v)} <small style="color:#888">${cnt.get(v)}</small></div>`).join('')+
   '</div><div class="slrz" title="Изменить размер"></div></div>';}).join('');
 const cm=document.querySelector('#luckysheet-cell-main');if(cm){const b=cm.getBoundingClientRect();
  Object.assign(box.style,{position:'fixed',left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px',pointerEvents:'none',zIndex:57,overflow:'hidden'});
  box.querySelectorAll('.wesl').forEach(w=>{w.style.pointerEvents='auto';});}}

/* ---------- мастер создания ---------- */
function pivotMaster(){const s0=L().getRange()[0];if(!s0)return alert('Выделите диапазон данных');
 const srcS={r1:s0.row[0],r2:s0.row[1],c1:s0.column[0],c2:s0.column[1]};
 const src=readSource(srcS);if(!src)return alert('Нужен диапазон с заголовками (минимум 2 строки) или курсор внутри таблицы');
 const defR=src.labels.find(l=>/категор|товар|продукт|менеджер|город|регион|отдел|тип|год|месяц|продавц/i.test(l))||src.labels[0];
 const defV=src.labels.filter(l=>l!==defR).find(l=>{const i=src.labels.indexOf(l);return src.rows.some(r=>typeof r[i]==='number');})||src.labels[src.labels.length-1];
 PIV={id:'pv'+(nextId++),name:'Сводная',srcS,src,rows:[defR],cols:[],vals:[{f:defV,fn:'sum'}],collapsed:new Set(),hideTotals:false,pos:null,autoPos:true};
 rebuild();fieldsPanel(true);renderSlicers();ovLoop();
 setStatus('Сводная таблица создана — перетаскивайте поля в зоны на панели.');}

function store(){root.WEStore=root.WEStore||{pv:{},sl:{}};const nm=L().getSheet().name;
 root.WEStore.pv[nm]=root.WEStore.pv[nm]||{};
 if(PIV)root.WEStore.pv[nm][PIV.id]={id:PIV.id,name:PIV.name,src:PIV.srcS,rows:PIV.rows,cols:PIV.cols,vals:PIV.vals,
  collapsed:[...PIV.collapsed],hideTotals:PIV.hideTotals,pos:PIV.pos,sortVal:!!PIV.sortVal,
  dim:PIV.dim?{w:PIV.dim.w,h:PIV.dim.h}:null};
 root.WEStore.sl[nm]=SLICERS.map(s=>({field:s.field,off:s.off,x:s.x,y:s.y,w:s.w,h:s.h}));}
function rebuild(){if(!PIV||!PIV.srcS)return;const src=readSource(PIV.srcS);
 if(!src)return alert('Источник сводной недоступен (данные удалены?)');
 PIV.src=src;render(PIV,src);applyCollapse(PIV);store();markD();renderSlicers();}

function activateSheet(name){const map=(root.WEStore&&root.WEStore.pv[name])||{};const arr=Object.values(map);
 SLICERS=((root.WEStore&&root.WEStore.sl[name])||[]).map(s=>Object.assign({},s));
 const fp=document.querySelector('#pvfp');if(fp)fp.remove();
 if(arr.length){const p=arr[arr.length-1];
  PIV=Object.assign({collapsed:new Set()},p,{collapsed:new Set(p.collapsed||[])});
  try{PIV.src=readSource(PIV.srcS);}catch(e){PIV.src=null;}
  if(PIV.src){PIV.autoPos=false;render(PIV,PIV.src);applyCollapse(PIV);}
  renderSlicers();ovLoop();}
 else{PIV=null;const o=document.querySelector('#pvov');if(o)o.innerHTML='';const b=document.querySelector('#slbox2');if(b)b.innerHTML='';}}

function toggleSlicers(){slVisible=!slVisible;renderSlicers();return slVisible;}

root.WEPivot2={master:pivotMaster,rebuild,fieldsPanel,slicerDialog,activateSheet,store,toggleSlicers,
 isActive:()=>!!PIV,get piv(){return PIV;},
 expandAll(){if(PIV){PIV.collapsed.clear();rebuild();}},
 collapseAll(){if(PIV&&PIV.grid){PIV.collapsed.clear();PIV.grid.body.forEach(b=>{if(b.type==='row'&&b.depth===0)PIV.collapsed.add(b.path.join('\u0001'));});rebuild();}},
 sortToggle(){if(!PIV)return;PIV.sortVal=!PIV.sortVal;rebuild();},
 totalsToggle(){if(!PIV)return;PIV.hideTotals=!PIV.hideTotals;rebuild();},
 moveHere(){if(!PIV)return;const r=L().getRange()[0];if(!r)return;PIV.pos={r:r.row[0],c:r.column[0]};PIV.autoPos=false;rebuild();},
 snapshot(){return JSON.parse(JSON.stringify(root.WEStore||{pv:{},sl:{}}));}};
})(window);
