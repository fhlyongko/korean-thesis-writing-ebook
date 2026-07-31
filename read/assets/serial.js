/* Premium serialized e-book reader — shared behavior */
(function(){
  "use strict";
  var root=document.documentElement, KEY="ebook-pref", pref={};
  try{pref=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}
  if(pref.theme&&pref.theme!=="light")root.setAttribute("data-theme",pref.theme);
  if(pref.fs)root.style.setProperty("--fs",pref.fs+"px");

  function save(){try{localStorage.setItem(KEY,JSON.stringify(pref))}catch(e){}}
  function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}

  /* ---- progress bar ---- */
  var pb=document.getElementById("pb");
  var fab;
  function onScroll(){
    var h=document.documentElement,st=h.scrollTop||document.body.scrollTop,sh=h.scrollHeight-h.clientHeight;
    var p=sh>0?(st/sh*100):0;
    if(pb)pb.style.width=p+"%";
    if(fab)fab.classList.toggle("on",st>560);
  }
  document.addEventListener("scroll",onScroll,{passive:true});

  /* ---- inject bar controls ---- */
  var barIn=document.querySelector(".bar__in"), barRight=document.querySelector(".bar__right"), tgl=document.getElementById("tgl");
  // TOC button (far left)
  var tocBtn=el("button","iconbtn","☰");tocBtn.setAttribute("aria-label","목차");tocBtn.title="목차 (T)";
  if(barIn)barIn.insertBefore(tocBtn,barIn.firstChild);
  // font size controls (before theme toggle)
  if(barRight&&tgl){
    var fm=el("button","iconbtn sm","A−");fm.setAttribute("aria-label","글자 작게");fm.title="글자 작게";
    var fp=el("button","iconbtn sm","A+");fp.setAttribute("aria-label","글자 크게");fp.title="글자 크게";
    barRight.insertBefore(fm,tgl);barRight.insertBefore(fp,tgl);
    var sizes=[17,19,21,23,25];
    function curFs(){return parseFloat(getComputedStyle(root).getPropertyValue("--fs"))||19;}
    function setFs(v){root.style.setProperty("--fs",v+"px");pref.fs=v;save();}
    fp.addEventListener("click",function(){var c=curFs();for(var i=0;i<sizes.length;i++)if(sizes[i]>c+.5){setFs(sizes[i]);return}});
    fm.addEventListener("click",function(){var c=curFs();for(var i=sizes.length-1;i>=0;i--)if(sizes[i]<c-.5){setFs(sizes[i]);return}});
  }

  /* ---- theme cycle ---- */
  var order=["light","sepia","dark"];
  if(tgl)tgl.addEventListener("click",function(){
    var cur=root.getAttribute("data-theme")||"light";
    var nt=order[(order.indexOf(cur)+1)%3];
    if(nt==="light")root.removeAttribute("data-theme");else root.setAttribute("data-theme",nt);
    pref.theme=nt;save();
  });

  /* ---- reading time (article pages) ---- */
  var art=document.querySelector(".art .wrap"), h1=art&&art.querySelector("h1");
  if(art&&h1){
    var txt=art.textContent||"";var chars=txt.replace(/\s+/g,"").length;
    var mins=Math.max(1,Math.round(chars/620));
    var meta=document.querySelector(".art__meta");
    var rt=el("p","art__rt","약 "+mins+"분 분량 · 읽기");
    h1.parentNode.insertBefore(rt,h1.nextSibling);
  }

  /* ---- checklist meters (English .cl) ---- */
  document.querySelectorAll("ul.cl").forEach(function(cl){
    var ins=cl.querySelectorAll("input");if(!ins.length)return;
    var m=el("div","ck-meter",'<i></i><em></em>');cl.parentNode.insertBefore(m,cl.nextSibling);
    var bar=m.querySelector("i"),txt=m.querySelector("em");
    function upd(){var n=0;ins.forEach(function(x){if(x.checked)n++});bar.style.setProperty("--p",(n/ins.length*100)+"%");txt.textContent=n+" / "+ins.length+" 완료";}
    ins.forEach(function(x){x.addEventListener("change",upd)});upd();
  });

  /* ---- FAB back-to-top ---- */
  fab=el("button","fab","↑");fab.title="맨 위로";fab.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})});
  document.body.appendChild(fab);

  /* ---- TOC drawer ---- */
  var scrim=el("div","scrim"),drawer=el("nav","drawer");
  document.body.appendChild(scrim);document.body.appendChild(drawer);
  function openDr(){drawer.classList.add("on");scrim.classList.add("on");var c=drawer.querySelector(".drawer__e.cur");if(c)c.scrollIntoView({block:"center"});}
  function closeDr(){drawer.classList.remove("on");scrim.classList.remove("on");}
  tocBtn.addEventListener("click",openDr);scrim.addEventListener("click",closeDr);

  var inEp=/\/ep\//.test(location.pathname)||/(^|\/)ep\//.test(location.pathname);
  var curFile=(location.pathname.split("/").pop()||"index.html");
  function buildDrawer(tocRoot,fromEp){
    var bookT=(document.querySelector(".bar__home")||{}).textContent||"목차";
    var head='<div class="drawer__h"><b>'+bookT+'</b><span>목차</span></div>';
    var list='<div class="drawer__l">';
    var idxHref=fromEp?"../index.html":"index.html";
    list+='<a class="drawer__e" href="'+idxHref+'"><span class="n">◆</span><span>표지 · 목차</span></a>';
    var kids=tocRoot.children;
    for(var i=0;i<kids.length;i++){
      var k=kids[i];
      if(k.classList&&k.classList.contains("pt")){
        list+='<div class="drawer__pt">'+k.textContent+'</div>';
      }else if(k.classList&&k.classList.contains("ep")){
        var n=(k.querySelector(".ep__n")||{}).textContent||"";
        var t=(k.querySelector(".ep__t")||{}).textContent||"";
        var href=k.getAttribute("href")||"#";
        if(fromEp)href=href.replace(/^ep\//,"");     // ep/03.html -> 03.html
        var cur=(href.split("/").pop()===curFile)?" cur":"";
        list+='<a class="drawer__e'+cur+'" href="'+href+'"><span class="n">'+n+'</span><span>'+t+'</span></a>';
      }
    }
    list+='</div>';
    drawer.innerHTML=head+list;
  }
  var localToc=document.querySelector(".toc .wrap");
  if(localToc){ buildDrawer(localToc,false); }
  else{
    // fetch index.html to build TOC once
    fetch("../index.html").then(function(r){return r.text()}).then(function(html){
      var d=new DOMParser().parseFromString(html,"text/html");
      var tr=d.querySelector(".toc .wrap");
      if(tr)buildDrawer(tr,true);
      else drawer.innerHTML='<div class="drawer__h"><b>목차</b></div><div class="drawer__l"><a class="drawer__e" href="../index.html"><span class="n">◆</span><span>표지 · 목차로</span></a></div>';
    }).catch(function(){
      drawer.innerHTML='<div class="drawer__h"><b>목차</b></div><div class="drawer__l"><a class="drawer__e" href="../index.html"><span class="n">◆</span><span>표지 · 목차로</span></a></div>';
    });
  }

  /* ---- keyboard nav ---- */
  document.addEventListener("keydown",function(e){
    if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
    if(e.key==="ArrowRight"){var n=document.querySelector("a[data-next]");if(n&&n.getAttribute("href"))location.href=n.getAttribute("href");}
    else if(e.key==="ArrowLeft"){var p=document.querySelector("a[data-prev]");if(p&&p.getAttribute("href")&&p.style.display!=="none")location.href=p.getAttribute("href");}
    else if(e.key==="t"||e.key==="T"){drawer.classList.contains("on")?closeDr():openDr();}
    else if(e.key==="Escape"){closeDr();}
  });

  onScroll();
})();

/* ---- table reconstruction from serial-tables.json (non-destructive, words unchanged) ---- */
(function(){
  var m=location.pathname.match(/ep\/(\d+)\.html/); if(!m)return;
  var ep=m[1];
  var base=/\/ep\//.test(location.pathname)?"../assets/":"assets/";
  function esc(s){return (s==null?"":String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  fetch(base+"serial-tables.json").then(function(r){return r.ok?r.json():null}).then(function(map){
    if(!map||!map[ep])return;
    map[ep].forEach(function(t){
      var ps=[].slice.call(document.querySelectorAll(".prose p, .art .wrap>p, .box p"));
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
        p.outerHTML=html;
        return;
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
})();
