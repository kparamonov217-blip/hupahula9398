/* Доразбор XLSX: скрытые листы, сводные таблицы (оформление + сведения), срезы, модель данных */
(function(root){

function cands(x){const o=[];if(!x)return o;const m=x.m,v=x.v;if(m!=null&&m!=='')o.push(String(m));if(v!=null&&v!==''){o.push(String(v));
 if(typeof v==='number'&&v>20000&&v<80000){const d=new Date(Math.round((v-25569)*864e5));const p=n=>String(n).padStart(2,'0');o.push(p(d.getUTCDate())+'.'+p(d.getUTCMonth()+1)+'.'+d.getUTCFullYear());}}return o;}
const isNum=x=>!!x&&x.v!==''&&x.v!=null&&typeof x.v!=='boolean'&&isFinite(Number(x.v));
function hiddenFor(p,cell,off){
 const rows=[],cols=[];const dc0=p.c1+p.fdc;
 const rowHas=r=>{for(let c=dc0;c<=p.c2;c++)if(isNum(cell(r,c)))return true;return false;};
 let grpHidden=false;
 for(let r=p.r1+p.hdr;r<=p.r2;r++){if(r===p.totalRow)continue;
  let hit=false;for(let c=p.c1;c<dc0&&!hit;c++)hit=cands(cell(r,c)).some(t=>off.has(t));
  if(!rowHas(r)){grpHidden=hit;}
  if(hit||(grpHidden&&rowHas(r)))rows.push(r);}
 for(let c=dc0;c<=p.c2;c++){if(c===p.totalCol)continue;
  let hit=false;for(let r=p.r1;r<p.r1+p.hdr&&!hit;r++)hit=cands(cell(r,c)).some(t=>off.has(t));if(hit)cols.push(c);}
 return {rows,cols};}
function totalsFor(p,cell,hr,hc){
 if(!p.sum)return [];const out=[],H=new Set(hr),Hc=new Set(hc),dc0=p.c1+p.fdc,colSum={};let grand=0,any=false;
 for(let r=p.r1+p.hdr;r<=p.r2;r++){if(r===p.totalRow||H.has(r))continue;let rs=0,has=false;
  for(let c=dc0;c<=p.c2;c++){if(c===p.totalCol||Hc.has(c))continue;const x=cell(r,c);if(isNum(x)){rs+=Number(x.v);has=true;colSum[c]=(colSum[c]||0)+Number(x.v);}}
  if(has){any=true;grand+=rs;if(p.totalCol>=0)out.push([r,p.totalCol,rs]);}}
 if(p.totalRow>=0){for(let c=dc0;c<=p.c2;c++){if(c===p.totalCol||Hc.has(c))continue;out.push([p.totalRow,c,colSum[c]||0]);}
  if(p.totalCol>=0)out.push([p.totalRow,p.totalCol,grand]);}
 return out;}
async function enhance(JSZip,DP,buf,json){
 const z=await JSZip.loadAsync(buf),rd=async p=>{const f=z.file(p);return f?f.async('string'):null};
 const P=s=>new DP().parseFromString(s,'text/xml');
 const info={pivots:[],slicers:0,model:!!z.file('xl/model/item.data'),hidden:[],we:{pivots:{},slicers:{}}};
 const caches={};
 for(const f of Object.keys(z.files).filter(n=>/^xl\/slicerCaches\/[^/]+\.xml$/.test(n))){const d=P(await z.file(f).async('string')).documentElement;caches[d.getAttribute('name')]=[...d.getElementsByTagName('i')].map(i=>i.getAttribute('c')).filter(x=>x!=null);}
 const wbx=await rd('xl/workbook.xml');if(!wbx)return info;
 const wb=P(wbx),rl=P(await rd('xl/_rels/workbook.xml.rels')),tg={};
 [...rl.getElementsByTagName('Relationship')].forEach(r=>tg[r.getAttribute('Id')]=r.getAttribute('Target'));
 const norm=t=>t.replace(/^\//,'').replace(/^xl\//,'');
 for(const sh of [...wb.getElementsByTagName('sheet')]){
  const name=sh.getAttribute('name'),t=tg[sh.getAttribute('r:id')];if(!t)continue;
  const js=json.sheets.find(s=>s.name===name);if(!js)continue;
  if(sh.getAttribute('state')==='hidden'||sh.getAttribute('state')==='veryHidden'){js.hide=1;js.status=0;info.hidden.push(name);}
  const sp='xl/'+norm(t),rp=sp.replace(/([^/]+)$/,'_rels/$1.rels'),rx=await rd(rp);if(!rx)continue;
  const rels=[...P(rx).getElementsByTagName('Relationship')].map(r=>r.getAttribute('Target'));
  info.slicers+=rels.filter(x=>/slicers\//.test(x)).length;
  const slx=[];for(const sl of rels.filter(x=>/slicers\//.test(x))){const t2=await rd('xl/slicers/'+sl.split('/').pop());if(t2)slx.push(...[...P(t2).getElementsByTagName('slicer')].map(e=>({name:e.getAttribute('name'),caption:e.getAttribute('caption'),cache:e.getAttribute('cache')})));}
  const anc={},cl=js.config&&js.config.columnlen||{},rl=js.config&&js.config.rowlen||{},dw=js.defaultColWidth||73,dh=js.defaultRowHeight||19;
  const X=(c,o)=>{let x=0;for(let i=0;i<c;i++)x+=cl[i]!=null?cl[i]:dw;return x+o/9525;},Y=(r,o)=>{let y=0;for(let i=0;i<r;i++)y+=rl[i]!=null?rl[i]:dh;return y+o/9525;};
  for(const dr of rels.filter(x=>/drawings\//.test(x))){const dx=await rd('xl/drawings/'+dr.split('/').pop());if(!dx)continue;
   for(const a of [...P(dx).getElementsByTagName('xdr:twoCellAnchor')]){const nv=a.getElementsByTagName('xdr:cNvPr')[0],f=a.getElementsByTagName('xdr:from')[0],t=a.getElementsByTagName('xdr:to')[0];if(!nv||!f||!t)continue;
    const g=(e,k)=>+(e.getElementsByTagName('xdr:'+k)[0]||{textContent:0}).textContent;const nm=nv.getAttribute('name');if(anc[nm])continue;
    const x1=X(g(f,'col'),g(f,'colOff')),y1=Y(g(f,'row'),g(f,'rowOff')),x2=X(g(t,'col'),g(t,'colOff')),y2=Y(g(t,'row'),g(t,'rowOff'));anc[nm]={x:Math.round(x1),y:Math.round(y1),w:Math.max(120,Math.round(x2-x1)),h:Math.max(90,Math.round(y2-y1))};}}
  info._anc=info._anc||{};info._anc[name]=anc;
  info._slx=info._slx||{};info._slx[name]=slx;
  for(const pt of rels.filter(x=>/pivotTables\//.test(x))){
   const px=await rd('xl/pivotTables/'+pt.split('/').pop());if(!px)continue;
   const d=P(px).documentElement,loc=d.getElementsByTagName('location')[0];if(!loc)continue;
   const m=loc.getAttribute('ref').match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);if(!m)continue;
   const cn=s=>s.split('').reduce((a,c)=>a*26+c.charCodeAt(0)-64,0)-1;
   const c1=cn(m[1]),r1=+m[2]-1,c2=cn(m[3]||m[1]),r2=+(m[4]||m[2])-1;
   const hdr=+(loc.getAttribute('firstDataRow')||1),fdc=+(loc.getAttribute('firstDataCol')||1);
   const gt=a=>d.getAttribute(a)!=='0';
   js.celldata=js.celldata||[];const idx={};js.celldata.forEach(x=>idx[x.r+'_'+x.c]=x);
   for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++){
    const x=idx[r+'_'+c];if(!x||!x.v)continue;const v=x.v;
    const head=r<r1+hdr||c<c1+0&&false,tot=(gt('colGrandTotals')&&r===r2)||(gt('rowGrandTotals')&&c===c2);
    if(r<r1+hdr){v.bl=1;if(!v.bg)v.bg='#DDEBF7';}
    else if(tot){v.bl=1;if(!v.bg)v.bg='#F2F2F2';}
    else if(c<c1+fdc){v.bl=v.bl||1;}
   }
   const dfs=[...d.getElementsByTagName('dataField')].map(x=>x.getAttribute('name')||'').filter(Boolean);
   info.pivots.push({sheet:name,name:d.getAttribute('name'),ref:loc.getAttribute('ref'),fields:dfs});
   const dfl=[...d.getElementsByTagName('dataField')];
   (info.we.pivots[name]=info.we.pivots[name]||[]).push({name:d.getAttribute('name'),r1,c1,r2,c2,hdr,fdc,totalRow:gt('colGrandTotals')?r2:-1,totalCol:gt('rowGrandTotals')?c2:-1,sum:dfl.length>0&&dfl.every(x=>!x.getAttribute('subtotal')||x.getAttribute('subtotal')==='sum'),hidR:[],hidC:[]});
  }
 }
 for(const name of Object.keys(info._slx||{})){const ps=info.we.pivots[name]||[];if(!ps.length)continue;
  const js=json.sheets.find(s=>s.name===name),idx={};(js.celldata||[]).forEach(x=>idx[x.r+'_'+x.c]=x.v);const cell=(r,c)=>idx[r+'_'+c];
  const seen=new Set();ps.forEach(p=>{for(let r=p.r1;r<=p.r2;r++)for(let c=p.c1;c<=p.c2;c++){if(r>=p.r1+p.hdr&&c>=p.c1+p.fdc)continue;cands(cell(r,c)).forEach(t=>seen.add(t));}});
  info.we.slicers[name]=info._slx[name].map((s,k)=>{const all=caches[s.cache]||[],a=(info._anc[name]||{})[s.name]||{x:620+(k%2)*190,y:10+Math.floor(k/2)*220,w:180,h:210};return Object.assign({caption:s.caption,pivot:0,total:all.length,all:all,items:all.filter(i=>seen.has(i)),off:[]},a);});}
 delete info._slx;delete info._anc;
 return info;
}
if(typeof module!=='undefined')module.exports={enhance,cands,hiddenFor,totalsFor};else root.WEExtras={enhance,cands,hiddenFor,totalsFor};
})(typeof window!=='undefined'?window:globalThis);
