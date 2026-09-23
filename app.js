/* ================= ÉTAT ================= */
const KEY="culturebar-cahier-v3", OLDKEY="culturebar-3parts-v1";
const DAY=864e5, INT=[0,1,3,7,21,60];
const SUBS=Object.keys(SUB);
const PC={h:"var(--h)",c:"var(--c)",p:"var(--p)"};
const PNAME=Object.fromEntries(PARTS.map(p=>[p.k,p.n]));
const LVN={1:"Facile",2:"Moyen",3:"Expert"};
const STARS={1:"★",2:"★★",3:"★★★"};
const QMODES=["eval","interro","defi","libre"];
const IDS=new Set(BANK.map(q=>q.id));
const BYID=Object.fromEntries(BANK.map(q=>[q.id,q]));
const IMAGES=[["🍋","Le zeste d'or"],["🧊","Le glaçon parfait"],["🍸","La coupe de cristal"],["🥃","Le rocks du patron"],["🍒","La cerise confite"],["🌿","La menthe fraîche"],["🥥","La noix de coco tiki"],["🍍","L'ananas royal"],["🫒","L'olive du Martini"],["🍊","L'orange amère"],["🧂","Le rebord salé"],["🍯","Le miel du Bee's Knees"],["☕","L'espresso de minuit"],["🥚","Le blanc d'œuf"],["🌶️","Le piment du Bloody"],["🍾","Le sabre du hussard"],["🥂","La flûte de Reims"],["🍹","Le parasol tiki"],["🐓","Le coq de Peychaud"],["🎩","Le chapeau du Professeur"],["🔥","Le Blue Blazer"],["⚓","Le grog de l'amiral"],["🗽","Le Manhattan Club"],["🌴","La plage de Daiquirí"],["🏝️","L'île de Tahiti"],["🦃","Le dindon sauvage"],["🌵","L'agave bleu"],["🍇","La grappe de Cognac"],["🍏","La pomme du Pays d'Auge"],["🌾","L'épi de seigle"],["🎷","Le jazz de La Nouvelle-Orléans"],["🐇","Le lapin du Dead Rabbit"],["📞","La cabine du PDT"],["🥄","La cuillère de bar"],["🌸","La violette de l'Aviation"],["🏆","La coupe de l'IBA"],["👑","La couronne du Kir Royale"],["📚","Le Savoy Cocktail Book"],["⭐","L'étoile du comptoir"],["🎓","Le diplôme de mixologue"]];

function fresh(){return {L:{},pos:{},fl:{},hist:[],bp:0,dj:{last:null,streak:0,best:0,note:null},c:[...SUBS],lv:[1,2,3],len:20,ch:true,dueOnly:true,an:true};}
let S=fresh();
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){ S=Object.assign(fresh(),JSON.parse(raw)); }
    else{
      const o=JSON.parse(localStorage.getItem(OLDKEY)||"null");
      if(o){ const now=Date.now();
        (o.m||[]).forEach(id=>{ if(IDS.has(id)) S.L[id]=[1,now+DAY]; });
        (o.w||[]).forEach(id=>{ if(IDS.has(id)) S.L[id]=[0,now]; });
        if(Array.isArray(o.c)) S.c=o.c; if(o.len) S.len=o.len;
        if(typeof o.ch==="boolean") S.ch=o.ch; if(typeof o.an==="boolean") S.an=o.an;
        save();
      }
    }
    S.c=S.c.filter(c=>SUBS.includes(c));
    for(const id in S.L) if(!IDS.has(id)) delete S.L[id];
  }catch(e){ S=fresh(); }
}
function save(){ try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){} }

/* ================= OUTILS ================= */
function shuffle(a,rnd){rnd=rnd||Math.random;a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function fr(n){return String(n).replace(".",",");}
function dayKey(t){const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function today(){return dayKey(Date.now());}
function yesterday(){return dayKey(Date.now()-DAY);}
function seeded(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
  return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return ((h^=h>>>16)>>>0)/4294967296;};}
function fmtDate(t){return new Date(t).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"});}

/* ================= RÉPÉTITION ESPACÉE ================= */
function isNew(id){return !S.L[id];}
function isDue(id){const e=S.L[id];return !e||e[1]<=Date.now();}
function isMastered(id){const e=S.L[id];return !!e&&e[0]>=3;}
function grade(id,good){
  const e=S.L[id], b=e?e[0]:0;
  if(good){ const nb=Math.min(b+1,5); S.L[id]=[nb,Date.now()+INT[nb]*DAY]; }
  else S.L[id]=[0,Date.now()];
}
function nextLabel(id){const e=S.L[id]; if(!e) return ""; if(e[0]===0) return "revient à la prochaine interro";
  const d=INT[e[0]]; return "revient dans "+d+" jour"+(d>1?"s":"")+(e[0]>=3?" (question sue)":"");}

/* ================= FILTRES ================= */
const BY_SUB=new Map(SUBS.map(s=>[s,[]]));
BANK.forEach(q=>BY_SUB.get(q.t).push(q.id));
function stat(ids){return {tot:ids.length, mas:ids.filter(isMastered).length};}
function subsOf(k){return SUBS.filter(s=>s[0]===k);}
function idsOfPart(k){return subsOf(k).flatMap(s=>BY_SUB.get(s));}
function filtered(){const a=new Set(S.c), l=new Set(S.lv);return BANK.filter(q=>a.has(q.t)&&l.has(q.lv));}
function pool(){const f=filtered();return S.dueOnly?f.filter(q=>isDue(q.id)):f;}
function order(list){
  const seen=list.filter(q=>!isNew(q.id)).sort((a,b)=>S.L[a.id][0]-S.L[b.id][0]||S.L[a.id][1]-S.L[b.id][1]);
  const due=seen.filter(q=>isDue(q.id)), later=seen.filter(q=>!isDue(q.id));
  return [...due, ...shuffle(list.filter(q=>isNew(q.id))), ...shuffle(later)];
}

/* Sur téléphone, le volet est au-dessus : on ramène l'écran sur la feuille, pas en haut de page */
function toStage(){
  if(!window.matchMedia("(max-width:880px)").matches){ window.scrollTo({top:0}); return; }
  const el=document.getElementById("stage"); if(!el) return;
  window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+window.scrollY-26)});
}
/* ================= VOLET ================= */
let view="home";
let openParts=new Set(window.matchMedia("(max-width:880px)").matches?[]:["h","c","p"]);
function renderRail(){
  document.getElementById("brand-sub").textContent=BANK.length+" questions sourcées";
  const s=stat(BANK.map(q=>q.id)), pct=s.tot?Math.round(s.mas/s.tot*100):0;
  document.getElementById("g-pct").textContent=pct+"%";
  document.getElementById("g-fill").style.width=pct+"%";
  document.getElementById("g-det").textContent=s.mas+" question"+(s.mas>1?"s sues":" sue")+" sur "+s.tot+" (sue = 3 bonnes réponses espacées)";
  const act=new Set(S.c);
  document.getElementById("parts").innerHTML=PARTS.map(p=>{
    const subs=subsOf(p.k), on=subs.filter(x=>act.has(x)).length, ps=stat(idsOfPart(p.k));
    return '<details class="part" style="--pc:'+PC[p.k]+'" data-k="'+p.k+'"'+(openParts.has(p.k)?" open":"")+'>'+
      '<summary><span class="chev">▶</span><span class="pn">'+p.n+'</span><span class="pnb">'+ps.mas+'/'+ps.tot+'</span>'+
      '<button class="all" onclick="event.preventDefault();togglePart(\''+p.k+'\')">'+(on===subs.length?"aucun":"tous")+'</button></summary>'+
      '<div class="cats">'+subs.map(x=>{
        const st=stat(BY_SUB.get(x)), pr=st.tot?Math.round(st.mas/st.tot*100):0;
        return '<button class="cat'+(act.has(x)?" on":"")+'" aria-pressed="'+act.has(x)+'" onclick="toggleCat(\''+x+'\')">'+
          '<span class="box"></span><span class="nm">'+esc(SUB[x])+'<span class="mini"><i style="width:'+pr+'%"></i></span></span>'+
          '<span class="nb">'+st.mas+'/'+st.tot+'</span></button>';
      }).join("")+'</div></details>';
  }).join("");
  document.querySelectorAll("#parts details").forEach(d=>d.addEventListener("toggle",()=>{d.open?openParts.add(d.dataset.k):openParts.delete(d.dataset.k);}));
  const cnt={1:0,2:0,3:0}; BANK.forEach(q=>cnt[q.lv]++);
  document.getElementById("lvls").innerHTML=[1,2,3].map(l=>'<button class="lvl'+(S.lv.includes(l)?" on":"")+'" onclick="toggleLv('+l+')"><b>'+STARS[l]+'</b>'+LVN[l]+' ('+cnt[l]+')</button>').join("");
  document.getElementById("seg-len").innerHTML=[10,20,40,80].map(n=>'<button class="'+(S.len===n?"on":"")+'" onclick="setLen('+n+')">'+n+'</button>').join("");
  document.getElementById("sw-chrono").classList.toggle("on",S.ch);
  document.getElementById("sw-due").classList.toggle("on",S.dueOnly);
  document.getElementById("sw-auto").classList.toggle("on",S.an);
  document.querySelectorAll(".nav-rail .chip[data-v]").forEach(b=>b.classList.toggle("cur",b.dataset.v===view||(b.dataset.v==="home"&&view==="quiz")));
}
function refresh(){ save(); renderRail(); if(!session&&view==="home") home(); }
function toggleCat(c){ const i=S.c.indexOf(c); i>=0?S.c.splice(i,1):S.c.push(c); refresh(); }
function togglePart(k){ const subs=subsOf(k), allOn=subs.every(x=>S.c.includes(x)); S.c=S.c.filter(x=>!subs.includes(x)); if(!allOn) S.c.push(...subs); refresh(); }
function onlyPart(k){ S.c=subsOf(k); refresh(); }
function allCats(on){ S.c=on?[...SUBS]:[]; refresh(); }
function weakCats(){ S.c=SUBS.filter(x=>{const s=stat(BY_SUB.get(x));return s.tot&&s.mas/s.tot<.6;}); if(!S.c.length) S.c=[...SUBS]; refresh(); }
function toggleLv(l){ const i=S.lv.indexOf(l); i>=0?S.lv.splice(i,1):S.lv.push(l); if(!S.lv.length) S.lv=[l]; refresh(); }
function setLen(n){ S.len=n; refresh(); }
function toggle(k){ S[k]=!S[k]; refresh(); }
function reset(){ if(!confirm("Effacer tout le cahier (progression, bulletin, images, signalements) ?")) return; S=fresh(); save(); go("home"); }
function go(v){ closeModal(); clearInterval(tick); session=null; view=v;
  if(v==="fiches") renderFiches(); else if(v==="exo") renderExo(); else if(v==="bulletin") renderBulletin(); else home();
  renderRail(); toStage(); }

/* ================= ACCUEIL ================= */
function defiDone(){return S.dj.last===today();}
function home(){
  session=null; clearInterval(tick); view="home";
  const f=filtered(), p=pool();
  const due=f.filter(q=>!isNew(q.id)&&isDue(q.id)).length, nw=f.filter(q=>isNew(q.id)).length;
  const streakAlive=S.dj.last===today()||S.dj.last===yesterday();
  document.getElementById("stage").innerHTML=
    '<div class="sheet seyes hero"><h3>Interro <span>surprise</span> !</h3>'+
    '<div class="evalbox"><div class="et2"><h4>L\'évaluation</h4><p>'+S.len+' questions tirées au hasard dans toutes les matières, chrono de 20 s imposé. <b>Seules les bonnes réponses de l\'évaluation comptent pour le classement.</b></p></div>'+
    '<button class="btn" onclick="start(\'eval\')">Sortez une feuille !</button></div>'+
    '<h4 class="trh">S\'entraîner <small>sur les chapitres cochés, ne compte pas pour le classement</small></h4>'+
    '<p>Une bonne réponse fait revenir la question plus tard (1, 3, 7, 21 puis 60 jours) ; une erreur la fait revenir tout de suite. Une question est « sue » après trois bonnes réponses espacées.</p>'+
    '<div class="stats"><span class="stat"><b>'+due+'</b>à revoir aujourd\'hui</span><span class="stat"><b>'+nw+'</b>jamais vues</span><span class="stat"><b>'+S.bp+'</b>bons points</span></div>'+
    '<div class="tiles">'+PARTS.map(pt=>{
      const s=stat(idsOfPart(pt.k)), pr=s.tot?Math.round(s.mas/s.tot*100):0, on=subsOf(pt.k).some(x=>S.c.includes(x));
      return '<button class="tile'+(on?"":" off")+'" style="--pc:'+PC[pt.k]+'" onclick="onlyPart(\''+pt.k+'\')" title="Réviser seulement cette matière">'+
        '<div class="et"><div class="tn">'+pt.n+'</div><div class="td">'+pt.d+'</div></div>'+
        '<div class="tp">'+pr+' %</div><div class="tq">'+s.mas+' sues sur '+s.tot+'</div></button>';
    }).join("")+'</div>'+
    '<div class="avail">'+(p.length?p.length+' question'+(p.length>1?'s':'')+' dans le chapeau, entraînement de '+Math.min(p.length,S.len):'Rien à revoir pour l\'instant : bravo ! Désactive « seulement ce qui est à revoir » pour t\'entraîner quand même.')+'</div>'+
    '<div class="btns"><button class="btn ghost" onclick="start(\'interro\')"'+(p.length?'':' disabled')+'>Entraînement QCM</button>'+
    '<button class="btn ghost" onclick="start(\'libre\')"'+(p.length?'':' disabled')+'>Réponse libre</button></div>'+
    '<div class="defi"><div class="dt"><h4>Le défi du jour</h4><p>10 questions tirées au sort chaque jour, tous chapitres confondus. Reviens chaque jour pour allonger ta série. Entraînement, ne compte pas pour le classement.</p></div>'+
    '<div class="fl">'+(streakAlive&&S.dj.streak?'Série : '+S.dj.streak+' jour'+(S.dj.streak>1?'s':''):'Pas de série en cours')+'</div>'+
    (defiDone()?'<span class="stat">Fait aujourd\'hui : <b>'+fr(S.dj.note)+'</b>/20</span>':'<button class="btn" onclick="start(\'defi\')">Relever le défi</button>')+'</div>'+
    '</div>';
  renderRail();
}

/* ================= SESSIONS ================= */
let session=null, tick=null;
/* Placement de la bonne réponse : jamais au même endroit que la question précédente,
   jamais au même endroit que la dernière fois qu'on a vu cette question, et réparti à parts égales sur la série. */
function mk(list){
  S.pos=S.pos||{};
  const counts={}; let prev=-1;
  const out=list.map(q=>{
    const n=q.o.length, all=[...Array(n).keys()];
    let cand=all.filter(p=>p!==prev&&p!==S.pos[q.id]);
    if(!cand.length) cand=all.filter(p=>p!==prev);
    if(!cand.length) cand=all;
    const minc=Math.min(...cand.map(p=>counts[p]||0));
    const best=cand.filter(p=>(counts[p]||0)<=minc+1);
    const pos=best[Math.floor(Math.random()*best.length)];
    counts[pos]=(counts[pos]||0)+1; prev=pos; S.pos[q.id]=pos;
    const opts=shuffle(q.o.filter((t,i)=>i!==q.r)).map(t=>({t,ok:false}));
    opts.splice(pos,0,{t:q.o[q.r],ok:true});
    return {...q,opts};
  });
  save(); return out;
}
function start(mode){
  let list;
  if(mode==="defi"){ const r=seeded("defi-"+today()); list=shuffle(BANK,r).slice(0,10); }
  else if(mode==="eval"){ list=shuffle(BANK).slice(0,S.len); }
  else { const p=pool(); if(!p.length){ home(); return; } list=order(p).slice(0,S.len); list=shuffle(list); }
  session={mode,qs:mk(list),i:0,ok:0,streak:0,best:0,done:[],by:{},left:20};
  view="quiz"; renderRail();
  mode==="libre"?askLibre():ask(); toStage();
}
function startMissed(){
  const ids=Object.keys(S.L).filter(id=>S.L[id][0]===0);
  if(!ids.length){ home(); return; }
  session={mode:"interro",qs:mk(shuffle(ids.map(i=>BYID[i])).slice(0,S.len)),i:0,ok:0,streak:0,best:0,done:[],by:{},left:20};
  view="quiz"; ask(); toStage();
}
function head(q){
  const st=session, k=q.t[0];
  const lab={defi:"Défi du jour, ",eval:"Évaluation, ",interro:"Entraînement, ",libre:"Réponse libre, "}[st.mode]||"";
  return '<div class="q-top"><span class="tag">'+lab+PNAME[k]+', '+esc(SUB[q.t])+'<span class="lv">'+STARS[q.lv]+'</span></span>'+
   '<div class="meters"><span>Question '+(st.i+1)+' sur '+st.qs.length+'</span><span class="bons" id="bons">'+bpText(st.ok)+'</span>'+
   ((S.ch||st.mode==="eval")&&st.mode!=="libre"?'<span class="clock" id="clk">20</span>':'')+'</div></div>'+
   '<div class="bar"><i style="width:'+(100*st.i/st.qs.length)+'%"></i></div>'+
   '<div class="q">'+esc(q.q)+'</div>';
}
function bpText(n){return n+" bon"+(n>1?"s":"")+" point"+(n>1?"s":"");}
function srcLine(q){return '<span class="src"><b>Réf. :</b> '+esc(q.s)+'</span>';}
function tools(q){
  const fl=S.fl[q.id];
  return '<div class="tools"><button class="tool" onclick="openLesson(\''+q.id+'\')">📖 Revoir la leçon</button>'+
    '<button class="tool'+(fl?' done':'')+'" id="flagbtn" onclick="flagQ(\''+q.id+'\')">'+(fl?'🚩 Signalée':'🚩 Signaler une erreur')+'</button></div>';
}
function ask(){
  const st=session, q=st.qs[st.i];
  clearInterval(tick); st.left=20; st.answered=false; st.deadline=0;
  document.getElementById("stage").innerHTML=
   '<div class="sheet seyes" id="card" style="--pc:'+PC[q.t[0]]+'">'+head(q)+'<div class="opts" id="opts">'+
   q.opts.map((o,j)=>'<button class="opt" data-k="'+j+'" onclick="answer('+j+')"><span class="ltr">'+"ABCD"[j]+'</span><span>'+esc(o.t)+'</span></button>').join("")+
   '</div><div class="exp" id="exp"><span class="h">La correction</span>'+esc(q.e)+srcLine(q)+'<div class="hint" id="nextl"></div></div>'+
   '<div class="nav"><span class="kb"><kbd>1</kbd> à <kbd>4</kbd> pour répondre, <kbd>Entrée</kbd> pour avancer</span>'+
   '<button class="btn" id="nx" onclick="next()" disabled>Suivante</button></div>'+
   '<div id="tl" style="margin-top:14px;display:none">'+tools(q)+'</div></div>';
  if(S.ch||st.mode==="eval") startClock();
}
/* Chrono basé sur l'heure réelle : il ne se met pas en pause si on quitte l'app
   (téléphone verrouillé, passage sur une autre appli pour chercher la réponse). */
function startClock(){
  const el=document.getElementById("clk"); if(!el) return;
  const st=session; st.deadline=Date.now()+20000;
  const step=()=>{
    if(!session||session!==st||st.answered){ clearInterval(tick); return; }
    const left=Math.max(0,Math.ceil((st.deadline-Date.now())/1000));
    if(left!==st.left){ st.left=left; el.textContent=left; el.className="clock"+(left<=5?" hot":left<=10?" warn":""); }
    if(left<=0){ clearInterval(tick); answer(-1); }
  };
  tick=setInterval(step,250);
}
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"&&session&&!session.answered&&session.deadline&&Date.now()>=session.deadline){ clearInterval(tick); answer(-1); }
});
const BRAVO=["Bravo !","Très bien !","Parfait !","Bien vu !","Excellent !"], OUPS=["Raté !","Oups !","À revoir !","Presque !"];
function record(q,good){
  const st=session;
  st.by[q.t]=st.by[q.t]||[0,0]; st.by[q.t][1]++;
  if(good){ st.ok++; st.by[q.t][0]++; st.streak++; st.best=Math.max(st.best,st.streak); } else st.streak=0;
  grade(q.id,good); st.done.push({q,good}); save(); renderRail();
  const b=document.getElementById("bons"); if(b) b.textContent=bpText(st.ok);
}
function answer(k){
  const st=session; if(!st||st.answered) return;
  st.answered=true; clearInterval(tick);
  if(k>=0&&st.deadline&&Date.now()>st.deadline+300) k=-1;   // réponse arrivée après la fin du chrono : comptée fausse
  const q=st.qs[st.i], good=k>=0&&q.opts[k].ok;
  document.querySelectorAll("#opts .opt").forEach(b=>{
    b.disabled=true; const j=+b.dataset.k;
    if(q.opts[j].ok){ b.classList.add("good"); b.insertAdjacentHTML("beforeend",'<span class="mark">✓</span>'); }
    else if(j===k){ b.classList.add("bad"); b.insertAdjacentHTML("beforeend",'<span class="mark">✗</span>'); }
    else b.classList.add("dim");
  });
  document.getElementById("card").insertAdjacentHTML("beforeend",'<span class="stamp '+(good?"ok":"ko")+'">'+(good?pick(BRAVO):(k<0?"Temps écoulé !":pick(OUPS)))+'</span>');
  record(q,good);
  document.getElementById("nextl").textContent="Cette question "+nextLabel(q.id)+".";
  document.getElementById("exp").classList.add("show");
  document.getElementById("tl").style.display="";
  const nx=document.getElementById("nx");
  nx.disabled=false; nx.textContent=st.i===st.qs.length-1?"Rendre la copie":"Suivante"; nx.focus({preventScroll:true});
  if(good&&S.an){ const cur=st.i; setTimeout(()=>{ if(session===st&&st.i===cur&&st.answered&&!modalOpen()) next(); },1400); }
}
function next(){
  const st=session; if(!st||!st.answered) return;
  if(st.i<st.qs.length-1){ st.i++; st.mode==="libre"?askLibre():ask(); toStage(); } else result();
}

/* Réponse libre */
function askLibre(){
  const st=session, q=st.qs[st.i]; st.answered=false; st.revealed=false;
  const good=q.o[q.r];
  document.getElementById("stage").innerHTML=
   '<div class="sheet seyes" id="card" style="--pc:'+PC[q.t[0]]+'">'+head(q)+
   '<div class="hint">Réponds dans ta tête, ou à voix haute, puis retourne la carte.</div>'+
   '<div class="reveal"><button class="btn" id="rv" onclick="reveal()" style="margin-top:14px">Voir la réponse</button></div>'+
   '<div class="answer" id="ans"><div class="big">'+esc(good)+'</div><div style="margin-top:8px">'+esc(q.e)+'</div>'+srcLine(q)+'</div>'+
   '<div class="self" id="self"><button class="btn ok" onclick="selfGrade(true)">Je savais ✓</button><button class="btn ghost ko" onclick="selfGrade(false)">Je ne savais pas ✗</button>'+
   '<span class="kb"><kbd>1</kbd> je savais, <kbd>2</kbd> je ne savais pas</span></div>'+
   '<div class="hint" id="nextl"></div>'+
   '<div id="tl" style="margin-top:14px">'+tools(q)+'</div></div>';
}
function reveal(){ const st=session; if(!st||st.revealed) return; st.revealed=true;
  document.getElementById("rv").style.display="none"; document.getElementById("ans").classList.add("show"); document.getElementById("self").classList.add("show"); }
function selfGrade(good){
  const st=session; if(!st||!st.revealed||st.answered) return; st.answered=true;
  const q=st.qs[st.i]; record(q,good);
  document.getElementById("self").innerHTML='<span class="stamp '+(good?"ok":"ko")+'" style="position:static;display:inline-block">'+(good?pick(BRAVO):"À revoir !")+'</span>'+
    '<button class="btn" id="nx" onclick="next()">'+(st.i===st.qs.length-1?"Rendre la copie":"Suivante")+'</button>';
  document.getElementById("nextl").textContent="Cette question "+nextLabel(q.id)+".";
  if(good&&S.an){ const cur=st.i; setTimeout(()=>{ if(session===st&&st.i===cur&&!modalOpen()) next(); },1100); }
}

/* Copie rendue */
function appreciation(note){
  if(note>=18) return ["top","Excellent !"]; if(note>=16) return ["top","Très bien"]; if(note>=14) return ["mid","Bien"];
  if(note>=12) return ["mid","Assez bien"]; if(note>=10) return ["low","Peut mieux faire"]; return ["low","Au travail !"];
}
function addBP(n){ const before=Math.floor(S.bp/10); S.bp+=n; const after=Math.min(Math.floor(S.bp/10),IMAGES.length); return IMAGES.slice(before,after); }
function result(){
  const st=session; clearInterval(tick);
  const note=Math.round(st.ok/st.qs.length*40)/2;
  const [cls,appr]=appreciation(note);
  const rows=Object.entries(st.by).map(([n,s])=>({n,ok:s[0],tot:s[1],r:s[0]/s[1]})).sort((a,b)=>a.r-b.r||b.tot-a.tot);
  const faible=rows.find(x=>x.r<1);
  const comment=note>=18?"Rien à redire, copie modèle.":faible?"Revois le chapitre « "+SUB[faible.n]+" ».":"Du bon travail, continue comme ça.";
  S.hist.push({d:Date.now(),m:st.mode,ok:st.ok,tot:st.qs.length,n:note,by:st.by});
  if(S.hist.length>400) S.hist=S.hist.slice(-400);
  let defiMsg="";
  if(st.mode==="defi"&&!defiDone()){
    S.dj.streak=(S.dj.last===yesterday()?S.dj.streak:0)+1; S.dj.last=today(); S.dj.note=note; S.dj.best=Math.max(S.dj.best,S.dj.streak);
    defiMsg='<div class="gain">Défi du jour réussi ! Série : '+S.dj.streak+' jour'+(S.dj.streak>1?'s':'')+'.</div>';
  }
  const imgs=addBP(st.ok); save();
  document.getElementById("stage").innerHTML=
   '<div class="sheet seyes result">'+
   '<div class="grade"><svg class="circle" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true"><path d="M30 64 C 26 20, 170 8, 182 52 C 194 98, 60 118, 22 80 C 8 62, 40 30, 96 22" fill="none" stroke="var(--ko)" stroke-width="3" stroke-linecap="round"/></svg>'+
   '<span class="n">'+fr(note)+'<small>/20</small></span></div><br>'+
   '<span class="appr '+cls+'">'+appr+'</span>'+
   '<div class="comment">'+esc(comment)+'</div>'+
   '<div class="meta">'+st.ok+' bonnes réponses sur '+st.qs.length+', meilleure série : '+st.best+'.</div>'+
   '<div class="gain">+'+st.ok+' bons points, '+S.bp+' au total.</div>'+defiMsg+
   (imgs.length?'<div class="gain">Nouvelle image'+(imgs.length>1?'s':'')+' !</div><div class="gal" style="max-width:420px;margin:8px auto 0">'+imgs.map(i=>'<div class="img new"><span class="e">'+i[0]+'</span>'+esc(i[1])+'</div>').join("")+'</div>':'')+
   '<div class="recap">'+rows.slice().sort((a,b)=>b.tot-a.tot).map(x=>
     '<div class="l"><span class="n">'+esc(SUB[x.n])+'</span><span class="m"><i data-w="'+Math.round(x.r*100)+'" style="width:0;background:'+PC[x.n[0]]+'"></i></span><span class="s">'+x.ok+'/'+x.tot+'</span></div>').join("")+'</div>'+
   '<div class="acts"><button class="btn" onclick="start(\''+(st.mode==="eval"?"eval":st.mode==="libre"?"libre":"interro")+'\')">'+(st.mode==="eval"?"Nouvelle évaluation":"Nouvel entraînement")+'</button>'+
   (Object.values(S.L).some(e=>e[0]===0)?'<button class="btn ghost" onclick="startMissed()">Refaire les erreurs</button>':'')+
   '<button class="btn ghost" onclick="go(\'home\')">Retour au cahier</button></div>'+
   '<div class="rev"><h3>Ma copie corrigée</h3>'+st.done.map(d=>{
      return '<div class="rv '+(d.good?"ok":"ko")+'"><span class="st">'+(d.good?"✓":"✗")+'</span>'+esc(d.q.q)+
        '<br><span class="an">'+esc(d.q.o[d.q.r])+'</span><span class="ex">'+esc(d.q.e)+'</span>'+srcLine(d.q)+'</div>';
   }).join("")+'</div></div>';
  requestAnimationFrame(()=>document.querySelectorAll(".recap .m i").forEach(el=>el.style.width=el.dataset.w+"%"));
  session=null; view="home"; renderRail(); toStage();
}

/* ================= SIGNALEMENTS ================= */
function flagQ(id){
  if(S.fl[id]) return;
  const c=prompt("Qu'est-ce qui cloche dans cette question ? (réponse fausse, source douteuse, formulation…)");
  if(c===null) return;
  S.fl[id]={c:c.trim()||"(sans commentaire)",d:Date.now()}; save();
  const b=document.getElementById("flagbtn"); if(b){ b.classList.add("done"); b.textContent="🚩 Signalée";
    b.insertAdjacentHTML("afterend",'<a class="tool" href="'+esc(mailto(flagText([id])))+'">✉️ Envoyer par e-mail</a>'); }
}
/* Partage des signalements par e-mail (ouvre la messagerie du téléphone, rien n'est envoyé sans l'utilisateur) */
const MAIL_SIGNAL="jocesou@orange.fr";
function mailto(body){
  const n=(body.match(/^\d+\. /gm)||[]).length;
  return "mailto:"+MAIL_SIGNAL+"?subject="+encodeURIComponent("Culture Bar : "+(n>1?n+" signalements":"signalement"))+"&body="+encodeURIComponent(body+"\n\nEnvoyé depuis Culture Bar, le cahier.");
}
function flagText(only){
  return Object.entries(S.fl).filter(([id])=>!only||only.includes(id)).map(([id,f],i)=>{const q=BYID[id]; if(!q) return "";
    return (i+1)+". ["+id+"] "+q.q+"\n   Réponse enregistrée : "+q.o[q.r]+"\n   Réf. : "+q.s+"\n   Remarque : "+f.c;}).join("\n\n");
}
function copyText(t,btn){ (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{btn.textContent="Copié !";},()=>{prompt("Copie ce texte :",t);}); }
function download(name,text,type){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:type||"text/plain"})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500); }
function unflag(id){ delete S.fl[id]; save(); renderBulletin(); }

/* ================= LEÇON ================= */
const STOP=new Set("quelle quelles quels lequel laquelle cette celle celui entre comme depuis avant après encore aussi toujours selon notamment environ minimum maximum combien dans pour avec leurs était étaient sont avait d'un d'une qu'il qu'elle cocktail cocktails question".split(" "));
function tokens(t){return (t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").match(/[a-z0-9]{5,}/g)||[]).filter(w=>!STOP.has(w));}
const FTXT=FICHES.map(f=>(f.t+" "+f.html.replace(/<[^>]+>/g," ")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""));
function findFiche(q){
  const tk=[...new Set([...tokens(q.o[q.r]),...tokens(q.o[q.r]),...tokens(q.q)])];
  let best=-1,bi=0;
  FICHES.forEach((f,i)=>{ let s=f.p===q.t[0]?1.5:0; tk.forEach(w=>{ if(FTXT[i].includes(w)) s+=1; }); if(s>best){best=s;bi=i;} });
  return {i:bi,tk};
}
function openLesson(id){
  const q=BYID[id]||session.qs[session.i]; const {i,tk}=findFiche(q); const f=FICHES[i];
  document.getElementById("modal").innerHTML='<div class="modal" onclick="if(event.target===this)closeModal()"><div class="box2" style="--pc:'+PC[f.p]+'">'+
    '<div class="mh"><h3>'+esc(f.t)+'</h3><button onclick="closeModal()">Fermer</button></div>'+
    '<div class="fiche open" style="--pc:'+PC[f.p]+'"><div class="bd"><div class="seyes" id="mbody">'+f.html+'</div></div></div></div></div>';
  markWords(document.getElementById("mbody"),tk);
  const m=document.querySelector("#mbody mark"); if(m) setTimeout(()=>m.scrollIntoView({block:"center"}),60);
}
function markWords(root,tk){
  if(!tk.length) return;
  const rx=new RegExp("("+tk.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")","i");
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  let n=0;
  nodes.forEach(tn=>{ if(n>40) return; const plain=tn.data.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const m=plain.match(rx); if(!m) return; const st=m.index, en=st+m[0].length;
    const mid=tn.splitText(st); mid.splitText(en-st); const mk=document.createElement("mark"); mid.parentNode.replaceChild(mk,mid); mk.appendChild(mid); n++; });
}
function modalOpen(){return !!document.querySelector("#modal .modal");}
function closeModal(){ const m=document.getElementById("modal"); if(m) m.innerHTML=""; }

/* ================= EXERCICES ================= */
let exo=null;
function renderExo(){
  exo=null; view="exo";
  document.getElementById("stage").innerHTML='<div class="sheet seyes hero"><h3>Cahier <span>d\'exercices</span></h3>'+
   '<p>Deux jeux pour ancrer les dates et les créateurs autrement qu\'en QCM. Chaque bonne réponse rapporte un bon point.</p>'+
   '<div class="exo-pick"><button class="exo-card" onclick="startFrise()"><span class="ic">📅</span><h4>La frise</h4><p>Remets 5 événements dans l\'ordre chronologique.</p></button>'+
   '<button class="exo-card" onclick="startRelier()"><span class="ic">✏️</span><h4>Relie par une flèche</h4><p>Associe 5 barmen à leur création.</p></button></div></div>';
  renderRail();
}
function startFrise(){
  const ev=[], years=new Set();
  for(const e of shuffle(CHRONO)){ if(!years.has(e.y)){ years.add(e.y); ev.push(e); } if(ev.length===5) break; }
  exo={type:"frise",ev:shuffle(ev),pick:[],done:false}; drawFrise();
}
function drawFrise(){
  const x=exo, sorted=x.ev.slice().sort((a,b)=>a.y-b.y);
  document.getElementById("stage").innerHTML='<div class="sheet seyes" style="--pc:var(--h)"><div class="q-top"><span class="tag">Exercice, la frise</span><span class="bons">'+x.pick.length+' / 5 placés</span></div>'+
   '<div class="q">Clique les événements du plus ancien au plus récent.</div><div class="frise">'+
   x.ev.map((e,i)=>{ const r=x.pick.indexOf(i); let cls="ev"+(r>=0?" picked":"");
     if(x.done){ cls+=sorted[r]===e?" good":" bad"; }
     return '<button class="'+cls+'" onclick="pickEv('+i+')"'+(x.done?" disabled":"")+'><span class="rk">'+(r>=0?r+1:"")+'</span><span>'+esc(e.n)+(x.done?'<span class="sr">Réf. : '+esc(e.s)+'</span>':'')+'</span>'+(x.done?'<span class="yr">'+e.y+'</span>':'')+'</button>'; }).join("")+
   '</div>'+(x.done?'<div class="comment" style="text-align:left">'+x.score+' sur 5 bien placés. '+(x.score===5?"Chronologie parfaite !":"Le bon ordre : "+sorted.map(e=>e.y).join(", ")+".")+'</div><div class="gain">+'+x.score+' bons points</div>':'')+
   '<div class="btns" style="margin-top:14px">'+(x.done?'<button class="btn" onclick="startFrise()">Nouvelle frise</button>':'<button class="btn" onclick="checkFrise()"'+(x.pick.length<5?" disabled":"")+'>Vérifier</button><button class="btn ghost" onclick="exo.pick=[];drawFrise()">Recommencer</button>')+
   '<button class="btn ghost" onclick="renderExo()">Autres exercices</button></div></div>';
}
function pickEv(i){ const x=exo; if(x.done) return; const r=x.pick.indexOf(i); if(r>=0) x.pick.splice(r); else if(x.pick.length<5) x.pick.push(i); drawFrise(); }
function checkFrise(){
  const x=exo; const sorted=x.ev.slice().sort((a,b)=>a.y-b.y);
  x.score=x.pick.filter((ei,r)=>sorted[r]===x.ev[ei]).length; x.done=true;
  addBP(x.score); S.hist.push({d:Date.now(),m:"frise",ok:x.score,tot:5,n:x.score*4,by:{}}); save(); drawFrise(); renderRail();
}
function startRelier(){
  const ps=shuffle(PAIRS).slice(0,5);
  exo={type:"relier",ps,left:shuffle(ps.map((p,i)=>i)),right:shuffle(ps.map((p,i)=>i)),sel:null,ok:new Set(),err:0,done:false};
  drawRelier();
}
function drawRelier(flash){
  const x=exo;
  document.getElementById("stage").innerHTML='<div class="sheet seyes" style="--pc:var(--c)"><div class="q-top"><span class="tag">Exercice, relie par une flèche</span><span class="bons">'+x.ok.size+' / 5 reliés, '+x.err+' erreur'+(x.err>1?"s":"")+'</span></div>'+
   '<div class="q">Clique un barman, puis sa création.</div><div class="cols"><div class="col">'+
   x.left.map(i=>'<button class="pl'+(x.ok.has(i)?" done":"")+(x.sel===i?" sel":"")+'" onclick="selL('+i+')"'+(x.ok.has(i)?" disabled":"")+'>'+esc(x.ps[i].a)+'</button>').join("")+'</div><div class="col">'+
   x.right.map(i=>'<button class="pl'+(x.ok.has(i)?" done":"")+(flash===i?" err":"")+'" onclick="selR('+i+')"'+(x.ok.has(i)?" disabled":"")+'>'+esc(x.ps[i].b)+'</button>').join("")+'</div></div>'+
   (x.done?'<div class="comment" style="text-align:left">'+(x.err===0?"Sans faute !":x.err+" erreur"+(x.err>1?"s":"")+" en route.")+'</div><div class="gain">+'+x.gain+' bons points</div><ul class="srcs">'+x.ps.map(p=>'<li>'+esc(p.a)+' : '+esc(p.b)+'. Réf. : '+esc(p.s)+'</li>').join("")+'</ul>':'')+
   '<div class="btns" style="margin-top:14px">'+(x.done?'<button class="btn" onclick="startRelier()">Nouvelle série</button>':'')+'<button class="btn ghost" onclick="renderExo()">Autres exercices</button></div></div>';
}
function selL(i){ exo.sel=i; drawRelier(); }
function selR(i){
  const x=exo; if(x.sel===null||x.done) return;
  if(x.sel===i){ x.ok.add(i); x.sel=null; if(x.ok.size===5){ x.done=true; x.gain=Math.max(0,5-x.err); addBP(x.gain); S.hist.push({d:Date.now(),m:"relier",ok:x.gain,tot:5,n:x.gain*4,by:{}}); save(); renderRail(); } drawRelier(); }
  else { x.err++; drawRelier(i); }
}

/* ================= BULLETIN ================= */
function renderBulletin(){
  view="bulletin";
  const q=S.hist.filter(h=>QMODES.includes(h.m)), last=q.slice(-20);
  const moy=last.length?Math.round(last.reduce((a,h)=>a+h.n,0)/last.length*2)/2:null;
  const streakAlive=S.dj.last===today()||S.dj.last===yesterday();
  const unlocked=Math.min(Math.floor(S.bp/10),IMAGES.length);
  // par matière, 30 derniers jours
  const since=Date.now()-30*DAY, agg={h:[0,0],c:[0,0],p:[0,0]};
  q.filter(h=>h.d>=since).forEach(h=>Object.entries(h.by||{}).forEach(([t,v])=>{agg[t[0]][0]+=v[0];agg[t[0]][1]+=v[1];}));
  const pts=q.slice(-30);
  let chart='<div class="empty">Pas encore de copie rendue. Ta courbe apparaîtra ici.</div>';
  if(pts.length){
    const W=640,H=200,pl=34,pr=12,pt=12,pb=26, X=i=>pl+(pts.length===1?(W-pl-pr)/2:i*(W-pl-pr)/(pts.length-1)), Y=n=>pt+(20-n)*(H-pt-pb)/20;
    const line=pts.map((h,i)=>X(i).toFixed(1)+","+Y(h.n).toFixed(1)).join(" ");
    chart='<div class="chart"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Courbe des notes">'+
      [0,5,10,15,20].map(v=>'<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="'+(v===10?"#E4505E":"#CFE0F3")+'" stroke-width="'+(v===10?1.5:1)+'"'+(v===10?' stroke-dasharray="5 4"':'')+'/><text x="'+(pl-8)+'" y="'+(Y(v)+4)+'" font-size="11" text-anchor="end" fill="#5C6270" font-family="Lexend">'+v+'</text>').join("")+
      '<polyline points="'+line+'" fill="none" stroke="#1F46A8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>'+
      pts.map((h,i)=>'<circle cx="'+X(i)+'" cy="'+Y(h.n)+'" r="4.5" fill="'+(h.n>=10?"#1E9E5A":"#D93A46")+'" stroke="#1D2433" stroke-width="1.5"><title>'+fmtDate(h.d)+' : '+fr(h.n)+'/20</title></circle>').join("")+
      '<text x="'+pl+'" y="'+(H-6)+'" font-size="11" fill="#5C6270" font-family="Lexend">'+fmtDate(pts[0].d)+'</text><text x="'+(W-pr)+'" y="'+(H-6)+'" font-size="11" text-anchor="end" fill="#5C6270" font-family="Lexend">'+fmtDate(pts[pts.length-1].d)+'</text></svg></div>';
  }
  const MODEN={eval:"Évaluation",interro:"Entraînement",defi:"Défi du jour",libre:"Réponse libre",frise:"La frise",relier:"Relier"};
  const fls=Object.entries(S.fl);
  document.getElementById("stage").innerHTML='<div class="sheet seyes">'+
   '<div class="bh">Bulletin de Jocelyn</div><div class="bsub">Culture Bar, année '+new Date().getFullYear()+'</div>'+
   '<div class="kpis"><div class="kpi"><div class="v">'+(moy===null?"–":fr(moy))+'</div><div class="k">moyenne sur 20 (20 dernières copies)</div></div>'+
   '<div class="kpi"><div class="v">'+q.length+'</div><div class="k">copies rendues</div></div>'+
   '<div class="kpi"><div class="v">'+(streakAlive?S.dj.streak:0)+'</div><div class="k">jours de défi d\'affilée (record : '+S.dj.best+')</div></div>'+
   '<div class="kpi"><div class="v">'+S.bp+'</div><div class="k">bons points ('+unlocked+' image'+(unlocked>1?'s':'')+')</div></div></div>'+
   '<div class="bsec">Mes notes<small>30 dernières copies, la ligne rouge marque 10/20</small></div>'+chart+
   '<div class="bsec">Par matière<small>réussite sur 30 jours et maîtrise globale</small></div>'+
   '<div class="tw"><table class="bt"><tr><th>Matière</th><th>Note (30 j)</th><th>Questions sues</th><th>Appréciation</th></tr>'+
   PARTS.map(p=>{ const a=agg[p.k], n=a[1]?Math.round(a[0]/a[1]*40)/2:null, s=stat(idsOfPart(p.k));
     return '<tr><td><span class="dot" style="background:'+PC[p.k]+'"></span>'+p.n+'</td><td class="nt">'+(n===null?"–":fr(n)+"/20")+'</td><td>'+s.mas+' / '+s.tot+'</td><td class="ap">'+(n===null?"Pas encore évalué":appreciation(n)[1])+'</td></tr>'; }).join("")+'</table></div>'+
   '<div class="bsec">Dernières copies</div>'+
   (S.hist.length?'<div class="tw"><table class="bt"><tr><th>Date</th><th>Épreuve</th><th>Résultat</th><th>Note</th></tr>'+
     S.hist.slice(-12).reverse().map(h=>'<tr><td>'+fmtDate(h.d)+'</td><td>'+(MODEN[h.m]||h.m)+'</td><td>'+h.ok+' / '+h.tot+'</td><td class="nt">'+fr(h.n)+'/20</td></tr>').join("")+'</table></div>':'<div class="empty">Rien pour l\'instant.</div>')+
   '<div class="bsec">Mes images<small>une image tous les 10 bons points</small></div>'+
   '<div class="gal">'+IMAGES.map((im,i)=>i<unlocked?'<div class="img"><span class="e">'+im[0]+'</span>'+esc(im[1])+'</div>':'<div class="img lock"><span class="e">'+im[0]+'</span>'+((i+1)*10)+' bons points</div>').join("")+'</div>'+
   '<div class="bsec">Mes signalements<small>'+fls.length+' question'+(fls.length>1?'s':'')+' à faire vérifier</small></div>'+
   (fls.length?fls.map(([id,f])=>{const qq=BYID[id]; return qq?'<div class="flag"><button class="tool" onclick="unflag(\''+id+'\')">Retirer</button><b>'+esc(qq.q)+'</b><div>Réponse : '+esc(qq.o[qq.r])+'</div><div class="c">'+esc(f.c)+'</div><div class="d">'+fmtDate(f.d)+', réf. : '+esc(qq.s)+'</div></div>':"";}).join("")+
     '<div class="btns"><a class="btn" href="'+esc(mailto(flagText()))+'">✉️ Envoyer par e-mail</a><button class="btn ghost" onclick="copyText(flagText(),this)">Copier la liste</button><button class="btn ghost" onclick="download(\'culture-bar-signalements-\'+today()+\'.txt\',flagText())">Télécharger (.txt)</button></div>'
     :'<div class="empty">Aucun signalement. Pendant une interro, le bouton 🚩 sous la correction permet d\'en ajouter.</div>')+
   (fls.length?'<p class="bsub" style="margin-top:8px">Les signalements sont à envoyer à '+MAIL_SIGNAL+'.</p>':'')+
   '<div class="bsec">Sauvegarde<small>pour passer d\'un appareil à l\'autre</small></div>'+
   '<div class="save"><div class="btns"><button class="btn" onclick="download(\'culture-bar-progression-\'+today()+\'.json\',JSON.stringify(S),\'application/json\')">Télécharger ma progression</button>'+
   '<label class="btn ghost" style="cursor:pointer">Charger un fichier<input type="file" accept=".json,application/json" style="display:none" onchange="importFile(this)"></label></div>'+
   '<div style="font-size:13px;color:var(--mine)">Ou par copier-coller, pratique entre téléphone et ordinateur :</div>'+
   '<div class="btns"><button class="tool" onclick="copyText(exportCode(),this)">Copier mon code</button><button class="tool" onclick="importCode()">Charger le code collé</button></div>'+
   '<textarea id="codebox" placeholder="Colle ici un code de progression"></textarea><div class="msg" id="savemsg"></div></div>'+
   '</div>';
  renderRail();
}
function exportCode(){ return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
function applyImport(obj){
  if(!obj||typeof obj!=="object"||!obj.L){ alert("Ce fichier ou ce code ne ressemble pas à une progression Culture Bar."); return; }
  if(!confirm("Remplacer la progression de cet appareil par celle-ci ?")) return;
  S=Object.assign(fresh(),obj); save(); renderBulletin();
  const m=document.getElementById("savemsg"); if(m) m.textContent="Progression chargée !";
}
function importCode(){ const v=document.getElementById("codebox").value.trim(); if(!v) return;
  try{ applyImport(JSON.parse(decodeURIComponent(escape(atob(v))))); }catch(e){ alert("Code illisible : vérifie qu'il a été copié en entier."); } }
function importFile(inp){ const f=inp.files[0]; if(!f) return; const r=new FileReader();
  r.onload=()=>{ try{ applyImport(JSON.parse(r.result)); }catch(e){ alert("Fichier illisible."); } }; r.readAsText(f); }

/* ================= CAHIER DE COURS ================= */
function renderFiches(){
  view="fiches";
  let html='<input class="srch" type="search" placeholder="Chercher dans le cahier de cours" oninput="filtFiches(this.value)"><div id="fl">';
  PARTS.forEach(p=>{
    html+='<h3 class="fh" style="--pc:'+PC[p.k]+'" data-k="'+p.k+'">'+p.n+'</h3>';
    FICHES.forEach((f,i)=>{ if(f.p!==p.k) return;
      html+='<div class="fiche" style="--pc:'+PC[p.k]+'" data-k="'+p.k+'" data-t="'+esc(FTXT[i])+'">'+
        '<button aria-expanded="false" onclick="const o=this.parentElement.classList.toggle(\'open\');this.setAttribute(\'aria-expanded\',o)">'+esc(f.t)+'</button>'+
        '<div class="bd"><div class="seyes">'+f.html+'</div></div></div>';
    });
  });
  document.getElementById("stage").innerHTML=html+'</div>';
}
function filtFiches(v){
  v=v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  document.querySelectorAll("#fl .fiche").forEach(f=>{ f.style.display=(!v||f.dataset.t.includes(v))?"":"none"; });
  document.querySelectorAll("#fl .fh").forEach(h=>{
    const any=[...document.querySelectorAll('#fl .fiche[data-k="'+h.dataset.k+'"]')].some(f=>f.style.display!=="none");
    h.style.display=any?"":"none";
  });
}

/* ================= CLAVIER ================= */
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&modalOpen()){ closeModal(); return; }
  if(!session||modalOpen()||/INPUT|TEXTAREA/.test(e.target.tagName)) return;
  if(session.mode==="libre"){
    if(!session.revealed&&(e.key===" "||e.key==="Enter")){ e.preventDefault(); reveal(); return; }
    if(session.revealed&&!session.answered&&(e.key==="1"||e.key==="2")){ selfGrade(e.key==="1"); return; }
    if(session.answered&&e.key==="Enter"){ e.preventDefault(); next(); }
    return;
  }
  if(e.key==="Enter"){ e.preventDefault(); next(); return; }
  const n=parseInt(e.key,10);
  if(n>=1&&n<=4&&!session.answered){ const o=document.querySelectorAll("#opts .opt"); if(o[n-1]) o[n-1].click(); }
});

/* ================= DÉMARRAGE ================= */
load(); renderRail(); home();
if("serviceWorker" in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(()=>{});
