(function () {
  var NOEGLE = "samtykke-analytics";
  var GA = "G-5MJFN2KEZT";
  var boks = document.getElementById("samtykke");
  var aabn = document.querySelector("[data-samtykke-aabn]");
  function laes() {
    try { return localStorage.getItem(NOEGLE); } catch (e) { return null; }
  }
  function gem(v) {
    try { localStorage.setItem(NOEGLE, v); } catch (e) {}
  }
  var indlaest = false;
  function indlaesGa() {
    if (indlaest) return;
    indlaest = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA);
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA;
    document.head.appendChild(s);
  }
  function vis(skjul) {
    if (boks) boks.hidden = skjul;
  }
  var valg = laes();
  if (aabn) aabn.hidden = false;
  if (valg === "ja") indlaesGa();
  else if (valg !== "nej") vis(false);
  var fraFod = false;
  if (aabn) aabn.addEventListener("click", function () {
    fraFod = true;
    vis(false);
    var f = boks && boks.querySelector("button");
    if (f) f.focus();
  });
  if (boks) boks.addEventListener("click", function (e) {
    var k = e.target.closest ? e.target.closest("[data-samtykke]") : null;
    if (!k) return;
    var ja = k.getAttribute("data-samtykke") === "ja";
    gem(ja ? "ja" : "nej");
    vis(true);
    if (ja) indlaesGa();
    if (fraFod && aabn) aabn.focus();
    fraFod = false;
  });
})();
