/* =====================================================================
   Culture Bar : navigation par intercalaires, en haut de la page.
   Chargé en dernier. Se branche sur renderRail() (onglet actif),
   toStage() (défilement sous la barre d'onglets sur téléphone) et
   renderBulletin() (le bouton « Effacer le cahier » y est rangé).
   ===================================================================== */
(function(){
const _rr = renderRail;
renderRail = function(){
  _rr();
  document.querySelectorAll(".tabs .tab").forEach(t => {
    const v = t.dataset.v, on = v === view || (v === "home" && view === "quiz");
    t.classList.toggle("cur", on);
    t.setAttribute("aria-current", on ? "page" : "false");
  });
};
toStage = function(){
  const el = document.getElementById("stage"); if (!el) return;
  if (!window.matchMedia("(max-width:880px)").matches) { window.scrollTo({top: 0}); return; }
  const bar = document.querySelector(".tabs");
  const off = (bar ? bar.getBoundingClientRect().height : 0) + 22;
  window.scrollTo({top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - off)});
};
const _rb = renderBulletin;
renderBulletin = function(){
  _rb();
  const s = document.querySelector("#stage .save");
  if (s) s.insertAdjacentHTML("beforeend",
    '<div class="danger"><button class="tool" onclick="reset()">Effacer le cahier</button>'+
    '<span>Remet toute la progression de ce téléphone à zéro (ton score du classement reste en ligne).</span></div>');
};
renderRail();
})();
