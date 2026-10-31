(function(root){
const FF=['Times New Roman','Arial','Tahoma','Verdana'];
const BS=[null,'thin','hair','dotted','dashed','dashDot','dashDotDot','double','medium','mediumDashed','mediumDashDot','mediumDashDotDot','slantDashDot','thick'];
function argb(c){if(!c||typeof c!=='string')return null;c=c.trim();let m;
 if(c[0]==='#'){let h=c.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');return h.length===6?'FF'+h.toUpperCase():null;}
 if((m=c.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)))return 'FF'+[m[1],m[2],m[3]].map(x=>(+x).toString(16).padStart(2,'0')).join('').toUpperCase();return null;}
function eachCell(s,cb){
 if(s.data&&s.data.length){s.data.forEach((row,r)=>{if(row)row.forEach((v,c)=>{if(v)cb(r,c,v);});});}
 else (s.celldata||[]).forEach(x=>{if(x&&x.v)cb(x.r,x.c,x.v);});
}
function build(ExcelJS,sheets){
 const wb=new ExcelJS.Workbook();wb.creator='WebExcel Local';const used={};
 sheets.forEach((s,i)=>{
  let nm=String(s.name||('Лист'+(i+1))).replace(/[\\\/\?\*\[\]:]/g,'_').slice(0,31);while(used[nm.toLowerCase()])nm=nm.slice(0,28)+'_'+i;used[nm.toLowerCase()]=1;
  const ws=wb.addWorksheet(nm);if(s.hide==1)ws.state='hidden';const cfg=s.config||{};
  eachCell(s,(r,c,v)=>{
   const xc=ws.getCell(r+1,c+1);const ct=v.ct||{};
   if(v.f){xc.value={formula:String(v.f).replace(/^=/,''),result:v.v==null?undefined:v.v};}
   else if(v.v!=null&&v.v!==''){let x=v.v;
    if(ct.t==='n'&&typeof x==='string'&&x!==''&&!isNaN(x))x=Number(x);
    else if(ct.t==='d'){const d=new Date(String(x).replace(' ','T')+'Z');if(!isNaN(d))x=d;}
    else if(ct.t==='b')x=(x===true||x==='true'||x==='TRUE'||x===1);
    xc.value=x;}
   if(ct.fa&&ct.fa!=='General')xc.numFmt=ct.fa;
   const f={};if(v.ff!=null)f.name=typeof v.ff==='number'?(FF[v.ff]||'Calibri'):v.ff;
   f.size=Number(v.fs)||10;if(v.bl==1)f.bold=true;if(v.it==1)f.italic=true;if(v.un==1)f.underline=true;if(v.cl==1)f.strike=true;
   const fc=argb(v.fc);if(fc)f.color={argb:fc};xc.font=f;
   const bg=argb(v.bg);if(bg)xc.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}};
   const al={};if(v.ht!=null)al.horizontal={0:'center',1:'left',2:'right'}[v.ht];if(v.vt!=null)al.vertical={0:'middle',1:'top',2:'bottom'}[v.vt];
   if(String(v.tb)==='2')al.wrapText=true;if(Object.keys(al).length)xc.alignment=al;
  });
  const bd=(r,c,side,st,col)=>{const xc=ws.getCell(r+1,c+1);const b=Object.assign({},xc.border||{});const style=BS[+st]||'thin';b[side]={style,color:{argb:argb(col)||'FF000000'}};xc.border=b;};
  (cfg.borderInfo||[]).forEach(bi=>{
   if(bi.rangeType==='cell'&&bi.value){const v=bi.value;[['l','left'],['r','right'],['t','top'],['b','bottom']].forEach(([k,n])=>{if(v[k])bd(v.row_index,v.col_index,n,v[k].style,v[k].color);});}
   else if(bi.rangeType==='range'&&bi.range){bi.range.forEach(rg=>{const [r1,r2]=rg.row,[c1,c2]=rg.column;
    for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++){
     const all=bi.borderType==='border-all',out=bi.borderType==='border-outside';
     const sd=[];if(all||(out&&c===c1)||bi.borderType==='border-left'&&c===c1)sd.push('left');
     if(all||(out&&c===c2)||bi.borderType==='border-right'&&c===c2)sd.push('right');
     if(all||(out&&r===r1)||bi.borderType==='border-top'&&r===r1)sd.push('top');
     if(all||(out&&r===r2)||bi.borderType==='border-bottom'&&r===r2)sd.push('bottom');
     sd.forEach(n=>bd(r,c,n,bi.style,bi.color));}});}
  });
  Object.values(cfg.merge||{}).forEach(m=>{try{ws.mergeCells(m.r+1,m.c+1,m.r+m.rs,m.c+m.cs);}catch(e){}});
  Object.entries(cfg.columnlen||{}).forEach(([c,w])=>{ws.getColumn(+c+1).width=Math.max(2,w/7);});
  Object.entries(cfg.rowlen||{}).forEach(([r,h])=>{ws.getRow(+r+1).height=h*0.75;});
  Object.entries(cfg.rowhidden||{}).forEach(([r])=>{ws.getRow(+r+1).hidden=true;});
  Object.entries(cfg.colhidden||{}).forEach(([c])=>{ws.getColumn(+c+1).hidden=true;});
 });
 return wb;
}
if(typeof module!=='undefined')module.exports={build};else root.WEXlsx={build};
})(typeof window!=='undefined'?window:globalThis);
