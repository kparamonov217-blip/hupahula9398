(function(root){
function agg(fn,a){const n=a.filter(x=>typeof x==='number'&&isFinite(x));
 if(fn==='count')return a.length;if(!n.length)return fn==='sum'?0:null;
 if(fn==='sum')return n.reduce((s,x)=>s+x,0);if(fn==='avg')return n.reduce((s,x)=>s+x,0)/n.length;
 if(fn==='max')return Math.max(...n);if(fn==='min')return Math.min(...n);}
const key=v=>v==null||v===''?'(пусто)':String(v);
const cmp=(a,b)=>{const x=+a,y=+b;return(!isNaN(x)&&!isNaN(y))?x-y:a.localeCompare(b,'ru');};
function pivot(rows,ri,ci,vi,fn,labels){
 const R=new Map(),Cs=new Set(),cell={},rowAll={},colAll={},all=[];
 rows.forEach(r=>{const rk=key(r[ri]),ck=ci>=0?key(r[ci]):'',v=r[vi];if(r.every(x=>x==null||x===''))return;
  R.set(rk,1);Cs.add(ck);(cell[rk+'\u0001'+ck]=cell[rk+'\u0001'+ck]||[]).push(v);(rowAll[rk]=rowAll[rk]||[]).push(v);(colAll[ck]=colAll[ck]||[]).push(v);all.push(v);});
 const rk=[...R.keys()].sort(cmp),ck=[...Cs].sort(cmp),fl={sum:'Сумма',count:'Количество',avg:'Среднее',max:'Макс',min:'Мин'}[fn];
 const out=[];
 if(ci<0){out.push([labels[ri],fl+' по полю '+labels[vi]]);rk.forEach(k=>out.push([k,agg(fn,rowAll[k])]));out.push(['Общий итог',agg(fn,all)]);}
 else{out.push([fl+' по полю '+labels[vi]+' / '+labels[ci]].concat([]));out[0]=[labels[ri]+' \\ '+labels[ci]].concat(ck,['Общий итог']);
  rk.forEach(k=>out.push([k].concat(ck.map(c=>{const a=cell[k+'\u0001'+c];return a?agg(fn,a):null;}),[agg(fn,rowAll[k])])));
  out.push(['Общий итог'].concat(ck.map(c=>agg(fn,colAll[c])),[agg(fn,all)]));}
 return out;}
if(typeof module!=='undefined')module.exports={pivot};else root.WEPivot={pivot};
})(typeof window!=='undefined'?window:globalThis);
