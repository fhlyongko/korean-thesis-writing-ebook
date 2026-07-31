/* Premium serialized e-book reader — shared behavior (scroll + ePub paged modes) */
(function(){
  "use strict";
  var root=document.documentElement, KEY="ebook-pref", pref={};
  try{pref=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}
  if(pref.theme&&pref.theme!=="light")root.setAttribute("data-theme",pref.theme);
  if(pref.fs)root.style.setProperty("--fs",pref.fs+"px");
  function save(){try{localStorage.setItem(KEY,JSON.stringify(pref))}catch(e){}}
  function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
  function esc(s){return (s==null?"":String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

  var art=document.querySelector(".art"), stage=art&&art.querySelector(".wrap");
  var isEpisode=!!(art&&stage);
  var pb=document.getElementById("pb"), fab;

  /* ---------- bar controls ---------- */
  var barIn=document.querySelector(".bar__in"), barRight=document.querySelector(".bar__right"), tgl=document.getElementById("tgl");
  var tocBtn=el("button","iconbtn","☰");tocBtn.title="목차 (T)";tocBtn.setAttribute("aria-label","목차");
  if(barIn)barIn.insertBefore(tocBtn,barIn.firstChild);
  var modeBtn;
  if(barRight&&tgl){
    var fm=el("button","iconbtn sm","A−");fm.title="글자 작게";
    var fp=el("button","iconbtn sm","A+");fp.title="글자 크게";
    barRight.insertBefore(fm,tgl);barRight.insertBefore(fp,tgl);
    var sizes=[17,19,21,23,25];
    function curFs(){return parseFloat(getComputedStyle(root).getPropertyValue("--fs"))||19;}
    function setFs(v){root.style.setProperty("--fs",v+"px");pref.fs=v;save();if(paged.on)paged.repaginate();}
    fp.addEventListener("click",function(){var c=curFs();for(var i=0;i<sizes.length;i++)if(sizes[i]>c+.5){setFs(sizes[i]);return}});
    fm.addEventListener("click",function(){var c=curFs();for(var i=sizes.length-1;i>=0;i--)if(sizes[i]<c-.5){setFs(sizes[i]);return}});
    if(isEpisode){
      modeBtn=el("button","iconbtn","📖");modeBtn.title="넘김 / 스크롤 전환";modeBtn.setAttribute("aria-label","읽기 모드 전환");
      barRight.insertBefore(modeBtn,tgl);
    }
  }
  var order=["light","sepia","dark"];
  if(tgl)tgl.addEventListener("click",function(){
    var cur=root.getAttribute("data-theme")||"light";
    var nt=order[(order.indexOf(cur)+1)%3];
    if(nt==="light")root.removeAttribute("data-theme");else root.setAttribute("data-theme",nt);
    pref.theme=nt;save();
  });

  /* ---------- reading time ---------- */
  if(isEpisode){
    var h1=stage.querySelector("h1");
    if(h1){var chars=(stage.textContent||"").replace(/\s+/g,"").length;var mins=Math.max(1,Math.round(chars/620));
      var rt=el("p","art__rt","약 "+mins+"분 분량 · 읽기");h1.parentNode.insertBefore(rt,h1.nextSibling);}
  }

  /* ---------- checklist meters ---------- */
  function attachMeters(scope){
    (scope||document).querySelectorAll("ul.cl").forEach(function(cl){
      if(cl.dataset.meter)return; cl.dataset.meter="1";
      var ins=cl.querySelectorAll("input");if(!ins.length)return;
      var m=el("div","ck-meter",'<i></i><em></em>');cl.parentNode.insertBefore(m,cl.nextSibling);
      var bar=m.querySelector("i"),txt=m.querySelector("em");
      function upd(){var n=0;ins.forEach(function(x){if(x.checked)n++});bar.style.setProperty("--p",(n/ins.length*100)+"%");txt.textContent=n+" / "+ins.length+" 완료";}
      ins.forEach(function(x){x.addEventListener("change",upd)});upd();
    });
  }

  /* ---------- FAB (scroll only) ---------- */
  fab=el("button","fab","↑");fab.title="맨 위로";fab.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})});
  document.body.appendChild(fab);

  /* ---------- scroll progress ---------- */
  function onScroll(){
    if(paged.on)return;
    var h=document.documentElement,st=h.scrollTop||document.body.scrollTop,sh=h.scrollHeight-h.clientHeight;
    var p=sh>0?(st/sh*100):0; if(pb)pb.style.width=p+"%";
    if(fab)fab.classList.toggle("on",st>560);
  }
  document.addEventListener("scroll",onScroll,{passive:true});

  /* ---------- TOC drawer ---------- */
  var scrim=el("div","scrim"),drawer=el("nav","drawer");
  document.body.appendChild(scrim);document.body.appendChild(drawer);
  function openDr(){drawer.classList.add("on");scrim.classList.add("on");var c=drawer.querySelector(".drawer__e.cur");if(c)c.scrollIntoView({block:"center"});}
  function closeDr(){drawer.classList.remove("on");scrim.classList.remove("on");}
  tocBtn.addEventListener("click",openDr);scrim.addEventListener("click",closeDr);
  var curFile=(location.pathname.split("/").pop()||"index.html");
  function buildDrawer(tocRoot,fromEp){
    var bookT=(document.querySelector(".bar__home")||{}).textContent||"목차";
    var head='<div class="drawer__h"><b>'+esc(bookT)+'</b><span>목차</span></div>';
    var list='<div class="drawer__l">';
    list+='<a class="drawer__e" href="'+(fromEp?"../index.html":"index.html")+'"><span class="n">◆</span><span>표지 · 목차</span></a>';
    var kids=tocRoot.children;
    for(var i=0;i<kids.length;i++){var k=kids[i];
      if(k.classList&&k.classList.contains("pt"))list+='<div class="drawer__pt">'+esc(k.textContent)+'</div>';
      else if(k.classList&&k.classList.contains("ep")){
        var n=(k.querySelector(".ep__n")||{}).textContent||"", t=(k.querySelector(".ep__t")||{}).textContent||"", href=k.getAttribute("href")||"#";
        if(fromEp)href=href.replace(/^ep\//,"");
        var cur=(href.split("/").pop()===curFile)?" cur":"";
        list+='<a class="drawer__e'+cur+'" href="'+href+'"><span class="n">'+esc(n)+'</span><span>'+esc(t)+'</span></a>';
      }}
    drawer.innerHTML=head+list+'</div>';
  }
  var localToc=document.querySelector(".toc .wrap");
  if(localToc)buildDrawer(localToc,false);
  else fetch("../index.html").then(function(r){return r.text()}).then(function(html){
    var d=new DOMParser().parseFromString(html,"text/html"), tr=d.querySelector(".toc .wrap");
    if(tr)buildDrawer(tr,true); else drawer.innerHTML='<div class="drawer__h"><b>목차</b></div><div class="drawer__l"><a class="drawer__e" href="../index.html"><span class="n">◆</span><span>표지 · 목차로</span></a></div>';
  }).catch(function(){drawer.innerHTML='<div class="drawer__h"><b>목차</b></div><div class="drawer__l"><a class="drawer__e" href="../index.html"><span class="n">◆</span><span>표지로</span></a></div>';});

  /* ---------- table / checklist injection (returns promise) ---------- */
  function injectTables(){
    var m=location.pathname.match(/ep\/(\d+)\.html/); if(!m)return Promise.resolve();
    var ep=m[1], base=/\/ep\//.test(location.pathname)?"../assets/":"assets/";
    return fetch(base+"serial-tables.json").then(function(r){return r.ok?r.json():null}).then(function(map){
      if(!map||!map[ep])return;
      map[ep].forEach(function(t){
        var ps=[].slice.call(document.querySelectorAll(".prose p, .art .wrap>p, .art .book-stage>p, .box p"));
        var p=ps.filter(function(x){return x.textContent.indexOf(t.key)>=0})[0];
        if(!p)return;
        var nt=p.nextElementSibling; if(nt&&nt.classList&&nt.classList.contains("nt"))nt.remove();
        var html="";
        if(t.checklist){
          var T=p.textContent, pre="", post="";
          if(t.before){var bi=T.indexOf(t.before); if(bi>=0)pre=T.slice(0,bi+t.before.length);}
          if(t.after){var ai=T.indexOf(t.after); if(ai>=0)post=T.slice(ai);}
          if(pre)html+="<p>"+esc(pre)+"</p>";
          html+='<ul class="cl">';
          t.checklist.forEach(function(it){html+='<li><label><input type="checkbox" class="ckx"><span>'+esc(it)+"</span></label></li>";});
          html+="</ul>";
          if(post)html+="<p>"+esc(post)+"</p>";
          p.outerHTML=html; return;
        }
        if(t.intro)html+="<p>"+esc(t.intro)+"</p>";
        html+='<figure class="tbl"><table>';
        if(t.head){html+="<thead><tr>";t.head.forEach(function(h){html+="<th>"+esc(h)+"</th>";});html+="</tr></thead>";}
        html+="<tbody>";
        t.rows.forEach(function(r){html+="<tr>";r.forEach(function(c){html+="<td>"+esc(c)+"</td>";});html+="</tr>";});
        html+="</tbody></table>";
        if(t.cap)html+="<figcaption>"+esc(t.cap)+"</figcaption>";
        html+="</figure>";
        if(t.tail)html+="<p>"+esc(t.tail)+"</p>";
        p.outerHTML=html;
      });
    }).catch(function(){});
  }

  /* ---------- paged (ePub) engine ---------- */
  var nextHref=null, prevHref=null;
  (function(){var nx=document.querySelector("a[data-next]"),pv=document.querySelector("a[data-prev]");
    if(nx&&nx.getAttribute("href"))nextHref=nx.getAttribute("href");
    if(pv&&pv.getAttribute("href")&&pv.style.display!=="none")prevHref=pv.getAttribute("href");})();

  var paged={on:false,built:false,spread:0,total:1,ppS:2,step:0};
  var leafL,leafR,gutter,shade,zPrev,zNext,pgbar,pgNum,btnPrev,btnNext;

  function buildPagedChrome(){
    if(paged.built)return;
    leafL=el("div","leaf l");leafR=el("div","leaf r");gutter=el("div","book-gutter");shade=el("div","turn-shade");
    art.insertBefore(leafL,stage);art.insertBefore(leafR,stage);art.insertBefore(gutter,stage);art.appendChild(shade);
    zPrev=el("div","turn-zone prev");zNext=el("div","turn-zone next");
    document.body.appendChild(zPrev);document.body.appendChild(zNext);
    pgbar=el("div","pager-bar");
    btnPrev=el("button",null,"‹");btnNext=el("button",null,"›");
    pgNum=el("span","pgnum","");
    pgbar.appendChild(btnPrev);pgbar.appendChild(pgNum);pgbar.appendChild(btnNext);
    document.body.appendChild(pgbar);
    zPrev.addEventListener("click",turnPrev);zNext.addEventListener("click",turnNext);
    btnPrev.addEventListener("click",turnPrev);btnNext.addEventListener("click",turnNext);
    // swipe
    var x0=null;
    art.addEventListener("touchstart",function(e){x0=e.touches[0].clientX;},{passive:true});
    art.addEventListener("touchend",function(e){if(x0==null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>45){dx<0?turnNext():turnPrev();}});
    paged.built=true;
  }
  function sizeFrame(viewW,viewH,ppS,M,w,gap){
    if(!leafL)return; var top=10,h=viewH-20,ext=14;
    leafL.style.top=top+"px";leafL.style.height=h+"px";
    leafR.style.top=top+"px";leafR.style.height=h+"px";
    if(ppS===2){
      leafL.style.left=(M-ext)+"px";leafL.style.width=(w+2*ext)+"px";
      leafR.style.left=(M+w+gap-ext)+"px";leafR.style.width=(w+2*ext)+"px";
      var gw=56;gutter.style.top=top+"px";gutter.style.height=h+"px";gutter.style.left=(viewW/2-gw/2)+"px";gutter.style.width=gw+"px";
    } else {
      leafL.style.left=(M-ext)+"px";leafL.style.width=((viewW-2*M)+2*ext)+"px";
    }
  }
  var sweepT=null;
  function sweep(dir){ root.classList.remove("turn-next","turn-prev"); void art.offsetWidth; root.classList.add(dir); clearTimeout(sweepT); sweepT=setTimeout(function(){root.classList.remove(dir);},500); }
  function paginate(keepFrac){
    if(!isEpisode)return;
    stage.classList.add("book-stage");
    var frac = keepFrac ? (paged.total>1?paged.spread/(paged.total):0) : null;
    var viewW=art.clientWidth, viewH=art.clientHeight;
    var ppS = viewW>=900?2:1; paged.ppS=ppS;
    root.classList.toggle("spread", ppS===2);
    var M = viewW>=900?46:24, gap=2*M;
    var w = ppS===2 ? (viewW-4*M)/2 : (viewW-2*M);
    var padT = viewW>=900?38:26, padB=22;
    stage.style.cssText="";
    stage.classList.add("book-stage");
    stage.style.columnWidth=w+"px";
    stage.style.columnGap=gap+"px";
    stage.style.columnFill="auto";
    stage.style.height=viewH+"px";
    stage.style.padding=padT+"px "+M+"px "+padB+"px "+M+"px";
    stage.style.boxSizing="border-box";
    stage.style.transform="translateX(0)";
    sizeFrame(viewW,viewH,ppS,M,w,gap);
    // measure
    var contentW = stage.scrollWidth - 2*M;
    var totalCols = Math.max(1, Math.round((contentW + gap) / (w + gap)));
    paged.step = ppS*(w+gap);
    paged.w=w; paged.gap=gap;
    paged.total = Math.max(1, Math.ceil(totalCols/ppS));
    var target = 0;
    if(frac!=null) target=Math.min(paged.total-1, Math.round(frac*paged.total));
    goSpread(target,true);
  }
  function goSpread(s,noanim){
    s=Math.max(0,Math.min(paged.total-1,s)); paged.spread=s;
    if(noanim)stage.classList.add("noanim");
    stage.style.transform="translateX("+(-(s*paged.step))+"px)";
    if(noanim)requestAnimationFrame(function(){requestAnimationFrame(function(){stage.classList.remove("noanim");});});
    if(pb)pb.style.width=((s+1)/paged.total*100)+"%";
    if(pgNum)pgNum.innerHTML="<b>"+(s+1)+"</b> / "+paged.total;
    var atStart=(s<=0&&!prevHref), atEnd=(s>=paged.total-1&&!nextHref);
    if(btnPrev)btnPrev.disabled=atStart; if(btnNext)btnNext.disabled=atEnd;
    if(zPrev)zPrev.classList.toggle("off",atStart); if(zNext)zNext.classList.toggle("off",atEnd);
  }
  function turnNext(){ if(!paged.on)return; if(paged.spread<paged.total-1){sweep("turn-next");goSpread(paged.spread+1);} else if(nextHref)location.href=nextHref; }
  function turnPrev(){ if(!paged.on)return; if(paged.spread>0){sweep("turn-prev");goSpread(paged.spread-1);} else if(prevHref)location.href=prevHref+(prevHref.indexOf("?")<0?"?p=end":"&p=end"); }
  paged.repaginate=function(){ if(paged.on)paginate(true); };

  function enterPaged(){
    if(!isEpisode){root.classList.remove("paged");root.classList.add("scroll");return;}
    root.classList.remove("scroll");root.classList.add("paged");
    paged.on=true; if(modeBtn)modeBtn.classList.add("mode-on");
    buildPagedChrome();
    window.scrollTo(0,0);
    // wait fonts then paginate
    var run=function(){ paginate(false); var atEnd=/[?&]p=end/.test(location.search); if(atEnd)goSpread(paged.total-1,true); };
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){setTimeout(run,20);}); else setTimeout(run,60);
  }
  function exitPaged(){
    paged.on=false; if(modeBtn)modeBtn.classList.remove("mode-on");
    root.classList.remove("paged","spread");root.classList.add("scroll");
    if(stage){stage.classList.remove("book-stage");stage.style.cssText="";}
    window.scrollTo(0,0); onScroll();
  }
  function applyMode(m,persist){
    if(m==="paged")enterPaged(); else exitPaged();
    if(persist){pref.reader=m;save();}
  }
  if(modeBtn)modeBtn.addEventListener("click",function(){applyMode(paged.on?"scroll":"paged",true);});

  var rt2=null;
  window.addEventListener("resize",function(){ if(!paged.on)return; clearTimeout(rt2); rt2=setTimeout(function(){paginate(true);},180); });

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown",function(e){
    if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
    if(paged.on){
      if(e.key==="ArrowRight"||e.key===" "||e.key==="PageDown"){e.preventDefault();turnNext();}
      else if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();turnPrev();}
      else if(e.key==="t"||e.key==="T"){drawer.classList.contains("on")?closeDr():openDr();}
      else if(e.key==="Escape"){closeDr();}
      return;
    }
    if(e.key==="ArrowRight"&&nextHref)location.href=nextHref;
    else if(e.key==="ArrowLeft"&&prevHref)location.href=prevHref;
    else if(e.key==="t"||e.key==="T"){drawer.classList.contains("on")?closeDr():openDr();}
    else if(e.key==="Escape"){closeDr();}
  });

  /* ---------- init ---------- */
  injectTables().then(function(){
    attachMeters(document);
    var wantPaged = isEpisode && (pref.reader!=="scroll"); // default ePub
    applyMode(wantPaged?"paged":"scroll",false);
    onScroll();
  });
})();
