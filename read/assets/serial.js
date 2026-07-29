
(function(){
  var K='awb:';
  function th(t){ t==='dark'?document.documentElement.setAttribute('data-theme','dark')
    :document.documentElement.removeAttribute('data-theme'); }
  var s=null; try{s=localStorage.getItem(K+'theme');}catch(e){}
  if(!s&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches) s='dark';
  th(s);
  var b=document.getElementById('tgl');
  if(b) b.onclick=function(){var n=document.documentElement.getAttribute('data-theme')==='dark'
    ?'light':'dark'; th(n); try{localStorage.setItem(K+'theme',n);}catch(e){}};
  var p=document.getElementById('pb');
  if(p){ var t=function(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;
    p.style.width=(m>0?h.scrollTop/m*100:0).toFixed(1)+'%';};
    addEventListener('scroll',t,{passive:true}); addEventListener('resize',t); t(); }
  document.querySelectorAll('.ckx').forEach(function(x,i){
    var k=K+'ck'+location.pathname.split('/').pop()+i;
    try{x.checked=localStorage.getItem(k)==='1';}catch(e){}
    x.onchange=function(){try{localStorage.setItem(k,x.checked?'1':'0');}catch(e){}};
  });
  addEventListener('keydown',function(e){
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    var a=e.key==='ArrowRight'?document.querySelector('[data-next]')
      :e.key==='ArrowLeft'?document.querySelector('[data-prev]'):null;
    if(a) location.href=a.getAttribute('href');
  });
}());
