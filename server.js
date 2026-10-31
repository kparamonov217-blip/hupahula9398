const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname,DATA=path.join(ROOT,'..','data'),PORT=+process.env.PORT||8765;
const T={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.gif':'image/gif','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.ico':'image/x-icon','.xlsx':'application/octet-stream'};
http.createServer((req,res)=>{
  const u=decodeURIComponent(req.url.split('?')[0]);
  if(u==='/api/autosave'){
    const f=path.join(DATA,'autosave.json');
    if(req.method==='GET'){fs.readFile(f,(e,d)=>{res.writeHead(e?404:200,{'Content-Type':'application/json'});res.end(e?'':d);});}
    else{const b=[];req.on('data',c=>b.push(c));req.on('end',()=>{fs.mkdirSync(DATA,{recursive:true});fs.writeFile(f,Buffer.concat(b),()=>{res.writeHead(200);res.end('ok');});});}
    return;
  }
  if(u==='/api/exit'&&req.method==='POST'){res.end('bye');setTimeout(()=>process.exit(0),200);return;}
  const p=path.normalize(path.join(ROOT,u==='/'?'index.html':u));
  if(!p.startsWith(ROOT)||p===path.join(ROOT,'server.js')){res.writeHead(403);return res.end('403');}
  fs.readFile(p,(e,d)=>{if(e){res.writeHead(404);return res.end('404');}res.writeHead(200,{'Content-Type':T[path.extname(p)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(d);});
}).on('error',e=>{console.log('Не удалось запустить сервер (возможно, уже запущен): '+e.message);process.exit(1);})
.listen(PORT,'127.0.0.1',()=>console.log('WebExcel Local: http://127.0.0.1:'+PORT));
