/* =====================================================================
   Culture Bar : prénom et classement partagé (Supabase)
   Module chargé après app.js. Il se branche sur trois fonctions d'app.js :
   go() pour la nouvelle page, result() pour envoyer le score, renderRail()
   pour afficher le prénom, record() pour compter les bonnes réponses.
   Le score = 1 point par question réussie au moins une fois (maximum = nombre de questions).
   ===================================================================== */
(function(){
const PKEY = "culturebar-profil";
const TOTAL = BANK.length;
let P = null;                // profil de cet appareil : {id, secret, prenom, public}
let board = null, boardErr = "", boardAt = 0, syncTimer = null, lastSent = null;

/* ---------- Profil ---------- */
function rid(){
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  const h = [...Array(32)].map(() => Math.floor(Math.random()*16).toString(16)).join("");
  return h.slice(0,8)+"-"+h.slice(8,12)+"-4"+h.slice(13,16)+"-a"+h.slice(17,20)+"-"+h.slice(20,32);
}
function secret(){
  const a = new Uint8Array(24);
  (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(a) : a.forEach((_,i)=>a[i]=Math.floor(Math.random()*256));
  return [...a].map(b => b.toString(16).padStart(2,"0")).join("");
}
function loadP(){
  try { P = JSON.parse(localStorage.getItem(PKEY) || "null"); } catch(e){ P = null; }
  if (!P || !P.id || !P.secret) P = { id: rid(), secret: secret(), prenom: "", public: true };
  saveP();
}
function saveP(){ try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch(e){} }
/* Questions réussies au moins une fois : gardées dans S.j (donc incluses dans la sauvegarde).
   Au premier passage, on reprend tout ce qui a déjà été répondu juste (case ≥ 1 de la répétition espacée). */
function justes(){
  if (!Array.isArray(S.j)) { S.j = BANK.filter(q => S.L[q.id] && S.L[q.id][0] >= 1).map(q => q.id); save(); }
  return S.j;
}
function addJuste(id){ const j = justes(); if (!j.includes(id)) { j.push(id); save(); } }
function sues(){ const ids = new Set(justes()); return BANK.filter(q => ids.has(q.id)).length; }
function cleanName(s){ return String(s || "").replace(/\s+/g, " ").trim().slice(0, 20); }

/* ---------- Supabase ---------- */
function configured(){ return !!(window.CLASSEMENT && CLASSEMENT.url && CLASSEMENT.cle); }
function base(){ return CLASSEMENT.url.replace(/\/+$/, ""); }
function hdr(){
  const h = { "apikey": CLASSEMENT.cle, "Content-Type": "application/json" };
  if (/^eyJ/.test(CLASSEMENT.cle)) h.Authorization = "Bearer " + CLASSEMENT.cle;   // ancienne clé « anon »
  return h;
}
async function rpc(fn, body){
  const r = await fetch(base()+"/rest/v1/rpc/"+fn, { method: "POST", headers: hdr(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error("HTTP "+r.status);
}
async function sync(force){
  if (!configured() || !P.prenom || !P.public) return;
  const n = sues(), key = P.prenom+"|"+n;
  if (!force && key === lastSent) return;
  try {
    await rpc("envoyer_score", { p_id: P.id, p_secret: P.secret, p_prenom: P.prenom, p_sues: n, p_total: TOTAL });
    lastSent = key; P.pending = false; saveP();
  } catch(e){ P.pending = true; saveP(); }
}
function syncSoon(){ clearTimeout(syncTimer); syncTimer = setTimeout(() => sync(false), 800); }
async function leave(){
  if (!configured()) return;
  try { await rpc("supprimer_score", { p_id: P.id, p_secret: P.secret }); } catch(e){}
  lastSent = null;
}
async function fetchBoard(){
  if (!configured()) return;
  try {
    const r = await fetch(base()+"/rest/v1/classement?select=id,prenom,sues,total,maj&order=sues.desc,maj.asc&limit=100", { headers: hdr() });
    if (!r.ok) throw new Error("HTTP "+r.status);
    board = await r.json(); boardErr = ""; boardAt = Date.now();
  } catch(e){ boardErr = "Classement injoignable pour l'instant (pas de réseau ?). Réessaie dans un moment."; }
}

/* ---------- Fenêtre « prénom » ---------- */
function askName(first){
  document.getElementById("modal").innerHTML =
    '<div class="modal" '+(first?'':'onclick="if(event.target===this)closeModal()"')+'><div class="box2 namebox" style="--pc:var(--stylo)">'+
    '<div class="mh"><h3>'+(first?"Bienvenue dans le cahier !":"Changer de prénom")+'</h3>'+(first?'':'<button onclick="closeModal()">Fermer</button>')+'</div>'+
    '<div class="nb-body seyes"><label for="pn">Comment tu t\'appelles ?</label>'+
    '<input id="pn" maxlength="20" autocomplete="given-name" placeholder="Ton prénom" value="'+esc(P.prenom||"")+'">'+
    '<label class="ck"><input type="checkbox" id="pp" '+(P.public?"checked":"")+'> Apparaître dans le classement partagé</label>'+
    '<p class="nb-note">Seuls ton prénom et ton nombre de points sont envoyés. Ta progression détaillée reste sur ce téléphone.</p>'+
    '<button class="btn" id="pok">C\'est parti !</button></div></div></div>';
  const inp = document.getElementById("pn");
  const ok = () => {
    const v = cleanName(inp.value);
    if (!v) { inp.focus(); inp.classList.add("err"); return; }
    const wasPublic = P.public;
    P.prenom = v; P.public = document.getElementById("pp").checked; saveP();
    closeModal(); renderRail();
    if (wasPublic && !P.public) leave(); else sync(true);
    if (view === "classement") renderClassement(true);
  };
  document.getElementById("pok").onclick = ok;
  inp.addEventListener("keydown", e => { if (e.key === "Enter") ok(); });
  setTimeout(() => inp.focus(), 50);
}

/* ---------- Page « Classement » ---------- */
function ago(t){
  const m = Math.round((Date.now() - new Date(t).getTime())/60000);
  if (m < 1) return "à l'instant"; if (m < 60) return "il y a "+m+" min";
  const h = Math.round(m/60); if (h < 24) return "il y a "+h+" h";
  const d = Math.round(h/24); return "il y a "+d+" j";
}
async function renderClassement(refetch){
  view = "classement"; renderRail();
  const st = document.getElementById("stage");
  if (!configured()) {
    st.innerHTML = '<div class="sheet seyes"><div class="bh">Tableau d\'honneur</div>'+
      '<div class="empty">Le classement partagé n\'est pas encore branché. Il faut renseigner l\'adresse et la clé Supabase dans config.js.</div>'+
      '<p class="bsub">En attendant, tu as <b>'+sues()+'</b> points sur '+TOTAL+'.</p></div>';
    return;
  }
  if (refetch || !board) {
    st.innerHTML = '<div class="sheet seyes"><div class="bh">Tableau d\'honneur</div><div class="empty">Je ramasse les copies…</div></div>';
    await sync(true); await fetchBoard();
    if (view !== "classement") return;
  }
  const me = P.id, rows = (board || []);
  const myRank = rows.findIndex(r => r.id === me);
  const MED = ["🥇","🥈","🥉"];
  const podium = rows.slice(0,3);
  st.innerHTML = '<div class="sheet seyes lb">'+
    '<div class="bh">Tableau d\'honneur</div>'+
    '<div class="bsub">1 point par question réussie au moins une fois, '+TOTAL+' points au maximum. '+(boardAt?'Mis à jour '+ago(boardAt)+'.':'')+'</div>'+
    (boardErr ? '<div class="empty">'+esc(boardErr)+'</div>' : '')+
    (!P.public ? '<div class="lb-info">Tu n\'apparais pas dans le classement. <button class="tool" onclick="CB.rename()">Changer</button></div>' :
      (myRank >= 0 ? '<div class="lb-me">Tu es <b>'+(myRank+1)+'<sup>'+(myRank?"e":"er")+'</sup></b> sur '+rows.length+', avec <b>'+rows[myRank].sues+'</b> point'+(rows[myRank].sues>1?'s':'')+' sur '+TOTAL+'.</div>' :
        '<div class="lb-info">Ton score part à la prochaine synchronisation.</div>'))+
    (podium.length ? '<div class="podium">'+[1,0,2].filter(i => podium[i]).map(i =>
      '<div class="pod p'+(i+1)+(podium[i].id===me?' me':'')+'"><span class="md">'+MED[i]+'</span><span class="pnm">'+esc(podium[i].prenom)+'</span><span class="psc">'+podium[i].sues+'</span><span class="step">'+(i+1)+'</span></div>').join("")+'</div>'
      : (boardErr ? '' : '<div class="empty">Personne au tableau pour l\'instant : sois le premier !</div>'))+
    (rows.length > 3 ? '<ol class="lb-list" start="4">'+rows.slice(3).map((r,i) =>
      '<li class="'+(r.id===me?'me':'')+'"><span class="rk">'+(i+4)+'</span><span class="nm">'+esc(r.prenom)+(r.id===me?' <em>(toi)</em>':'')+'</span>'+
      '<span class="bar2"><i style="width:'+Math.round(100*r.sues/Math.max(1,r.total||TOTAL))+'%"></i></span><span class="sc">'+r.sues+'</span><span class="ag">'+ago(r.maj)+'</span></li>').join("")+'</ol>' : '')+
    '<div class="btns" style="margin-top:18px"><button class="btn" onclick="CB.refresh()">Actualiser</button>'+
    '<button class="btn ghost" onclick="CB.rename()">Changer de prénom</button>'+
    (P.public ? '<button class="btn ghost" onclick="CB.quit()">Quitter le classement</button>' : '')+'</div></div>';
}

/* ---------- Branchements sur app.js ---------- */
const _go = go, _result = result, _renderRail = renderRail, _record = record;
record = function(q, good){ _record(q, good); if (good) addJuste(q.id); };
go = function(v){
  if (v !== "classement") return _go(v);
  closeModal(); clearInterval(tick); session = null; view = "classement";
  renderClassement(!board || Date.now() - boardAt > 60000); toStage();
};
result = function(){ _result(); syncSoon(); };
renderRail = function(){
  _renderRail();
  const w = document.getElementById("who"); if (w) w.textContent = P && P.prenom ? P.prenom : "à remplir";
  const b = document.querySelector('.nav-rail .chip[data-v="classement"]'); if (b) b.classList.toggle("cur", view === "classement");
};
window.CB = {
  rename(){ askName(false); },
  refresh(){ renderClassement(true); },
  async quit(){
    if (!confirm("Retirer ton prénom et ton score du classement partagé ?")) return;
    P.public = false; saveP(); await leave(); renderClassement(true);
  }
};

/* ---------- Démarrage ---------- */
loadP(); renderRail();
if (!P.prenom) askName(true); else if (P.public) sync(!!P.pending);
})();
