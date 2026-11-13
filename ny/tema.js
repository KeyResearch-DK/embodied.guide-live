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
  // Farverne læses af meta'erne, ikke af --paper: stil.css er ikke indlæst endnu.
  var metaer = document.querySelectorAll('meta[name="theme-color"]'), PAPIR = {};
  for (var i = 0; i < metaer.length; i++) PAPIR[/dark/.test(metaer[i].media) ? 'dark' : 'light'] = metaer[i].content;
  function farve() {
    for (var j = 0; j < metaer.length; j++) metaer[j].setAttribute('content', PAPIR[nu()]);
  }
  farve();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', farve);
  function start() {
    var valg = document.querySelectorAll('[data-tema]');
    var vis = function () {
      Array.prototype.forEach.call(valg, function (v) {
        v.setAttribute('aria-pressed', String(v.getAttribute('data-tema') === nu()));
      });
    };
    vis();
    Array.prototype.forEach.call(valg, function (v) {
      v.addEventListener('click', function () {
        rod.setAttribute('data-theme', v.getAttribute('data-tema'));
        try { localStorage.setItem(NOEGLE, v.getAttribute('data-tema')); } catch (e) {}
        vis();
        farve();
      });
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', vis);
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
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}());
