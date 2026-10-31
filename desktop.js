/* WebExcel Desktop (Electron): коррекция относительных путей при загрузке из file://  */
/* index.html находится в resources\app, а luckysheet ищет свои ресурсы от resources\ */
(function(){
  if(!window.weDesktop) return; // только в десктоп-режиме
  var fix=function(p){return p&&p.indexOf('vendor/luckysheet/')===0?'../vendor/luckysheet/'+p.slice('vendor/luckysheet/'.length):p;};
  [].forEach.call(document.querySelectorAll('link[rel=stylesheet]'),function(l){var h=fix(l.getAttribute('href'));if(h!==l.getAttribute('href')){l.setAttribute('href',h);l.href=h;}});
  document.addEventListener('DOMContentLoaded',function(){
    [].forEach.call(document.querySelectorAll('script[src]'),function(s){var a=s.getAttribute('src'),f=fix(a);if(f!==a)s.src=f;});
  });
})();
