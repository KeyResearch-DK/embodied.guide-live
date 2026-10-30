/* Læses synkront i <head>, aldrig defer: ellers blinker siden i det forkerte tema. */
(function () {
  var rod = document.documentElement;
  var NOEGLE = 'eg-theme';
  try {
    var gemt = localStorage.getItem(NOEGLE);
    if (gemt === 'light' || gemt === 'dark') rod.setAttribute('data-theme', gemt);
  } catch (e) {}

  function nu() {
    return rod.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function start() {
    var knap = document.getElementById('tema');
    if (knap) {
      var ord = knap.querySelector('.theme__ord');
      var vis = function () {
        var moerk = nu() === 'dark';
        if (ord) ord.textContent = knap.getAttribute(moerk ? 'data-moerk' : 'data-lys');
        knap.setAttribute('aria-pressed', String(moerk));
      };
      vis();
      knap.addEventListener('click', function () {
        var ny = nu() === 'dark' ? 'light' : 'dark';
        rod.setAttribute('data-theme', ny);
        try { localStorage.setItem(NOEGLE, ny); } catch (e) {}
        vis();
      });
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', vis);
    }
    var enhed = document.getElementById('enhedsskift');
    var aktiv = document.querySelector('.nav [aria-current]');
    var nav = document.querySelector('.nav');
    // aldrig scrollIntoView: det ruller siden og flytter foerste Tab
    if (aktiv && nav && nav.scrollWidth > nav.clientWidth) nav.scrollLeft += aktiv.getBoundingClientRect().left - nav.getBoundingClientRect().left - (nav.clientWidth - aktiv.offsetWidth) / 2;
    if (nav) {
      var fade = function () {
        if (nav.scrollWidth <= nav.clientWidth) {
          nav.style.maskImage = 'none';
          nav.style.webkitMaskImage = 'none';
          return;
        }
        var v = nav.scrollLeft > 4;
        var h = nav.scrollLeft < nav.scrollWidth - nav.clientWidth - 4;
        var m = v && h ? 'linear-gradient(to right, transparent, #000 24px, #000 calc(100% - 24px), transparent)'
          : v ? 'linear-gradient(to right, transparent, #000 24px, #000 100%)'
          : h ? 'linear-gradient(to right, #000 calc(100% - 24px), transparent)' : 'none';
        nav.style.maskImage = m;
        nav.style.webkitMaskImage = m;
      };
      fade();
      nav.addEventListener('scroll', fade, { passive: true });
      window.addEventListener('resize', fade, { passive: true });
    }
    if (enhed) enhed.addEventListener('keydown', function (h) {
      if (h.key === 'Enter') { h.preventDefault(); enhed.click(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}());
