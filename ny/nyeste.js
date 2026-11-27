(function () {
  var rod = document.querySelector('[data-nyeste]');
  if (!rod) return;
  var spor = rod.querySelector('[data-nyeste-spor]');
  var scene = spor.parentNode;
  var pile = rod.querySelectorAll('[data-nyeste-pil]');
  var reduce = matchMedia('(prefers-reduced-motion:reduce)');
  var START = 3000, VENT = 5000, FART = 24, TAU = 0.45;
  var over = false, fokus = false, synlig = true;
  var pos = 0, v = 0, retning = 1, ventTil = performance.now() + START, t0 = 0;

  pile.forEach(function (k) { k.hidden = false; });
  var hoved = rod.querySelector('.nyeste__hoved');
  var tael = null;
  if (hoved) {
    tael = document.createElement('span');
    tael.className = 'nyeste__tael';
    tael.setAttribute('aria-hidden', 'true');
    hoved.appendChild(tael);
  }
  var kortListe = Array.prototype.slice.call(spor.querySelectorAll('.nyeste__kort'));

  var lenker = Array.prototype.slice.call(rod.querySelectorAll('.nyeste__navn a'));
  lenker.forEach(function (a, i) { a.tabIndex = i ? -1 : 0; });
  spor.addEventListener('focusin', function (e) {
    if (lenker.indexOf(e.target) < 0) return;
    lenker.forEach(function (a) { a.tabIndex = a === e.target ? 0 : -1; });
  });
  spor.addEventListener('keydown', function (e) {
    var i = lenker.indexOf(document.activeElement);
    var til = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? lenker.length - 1 : -1;
    if (i < 0 || til < 0 || til >= lenker.length) return;
    e.preventDefault();
    lenker[til].focus();
  });

  function trin(t) {
    var dt = Math.min(t - t0, 100) / 1000;
    t0 = t;
    if (over || fokus || reduce.matches || !synlig || t < ventTil) {
      v = 0;
    } else {
      var maks = spor.scrollWidth - spor.clientWidth;
      if (maks <= 0) {
        v = 0;
      } else {
        if (retning > 0 && pos >= maks - FART * TAU) retning = -1;
        else if (retning < 0 && pos <= FART * TAU) retning = 1;
        v += (retning * FART - v) * Math.min(1, dt / TAU);
        pos = Math.max(0, Math.min(maks, pos + v * dt));
        spor.scrollLeft = pos;
      }
    }
    requestAnimationFrame(trin);
  }

  function ro() { v = 0; ventTil = performance.now() + VENT; }
  ['wheel', 'touchstart', 'keydown'].forEach(function (n) { scene.addEventListener(n, ro, { passive: true }); });

  scene.addEventListener('pointerenter', function () { over = true; });
  scene.addEventListener('pointerleave', function () { over = false; });
  scene.addEventListener('focusin', function (e) {
    var tast = e.target.matches(':focus-visible');
    fokus = tast;
    var k = e.target.closest('.nyeste__kort');
    if (k && tast) ro();
    if (k && tast) k.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
  });
  scene.addEventListener('focusout', function () { fokus = false; });

  function rulSkridt(ret) {
    ro();
    var kort = spor.querySelector('.nyeste__kort');
    var skridt = kort.offsetWidth + parseFloat(getComputedStyle(spor).columnGap || 0);
    spor.scrollBy({ left: skridt * ret, behavior: reduce.matches ? 'auto' : 'smooth' });
  }
  pile.forEach(function (knap) {
    knap.addEventListener('click', function () {
      if (knap.getAttribute('aria-disabled') === 'true') return;
      rulSkridt(Number(knap.getAttribute('data-nyeste-pil')));
    });
    knap.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        rulSkridt(e.key === 'ArrowRight' ? 1 : -1);
      }
    });
  });

  function fade() {
    var h = spor.scrollLeft > 2, d = spor.scrollLeft + spor.clientWidth < spor.scrollWidth - 2;
    pile.forEach(function (k) { k.setAttribute('aria-disabled', String(!(Number(k.getAttribute('data-nyeste-pil')) < 0 ? h : d))); });
    if (h || d) spor.setAttribute('data-fade', h && d ? 'begge' : h ? 'venstre' : 'hoejre'); else spor.removeAttribute('data-fade');
    if (tael && kortListe.length) {
      var sr = spor.getBoundingClientRect();
      var fra = 0, til = 0;
      for (var i = 0; i < kortListe.length; i++) {
        var r = kortListe[i].getBoundingClientRect();
        if (r.right > sr.left + 12 && r.left < sr.right - 12) {
          if (!fra) fra = i + 1;
          til = i + 1;
        }
      }
      if (!fra) { fra = 1; til = 1; }
      tael.textContent = (fra === til ? fra : fra + '–' + til) + ' of ' + kortListe.length;
    }
  }
  spor.addEventListener('scroll', function () {
    if (Math.abs(spor.scrollLeft - pos) > 2) { pos = spor.scrollLeft; ro(); }
    fade();
  }, { passive: true });
  addEventListener('resize', fade);

  if ('IntersectionObserver' in window) {
    synlig = false;
    new IntersectionObserver(function (p) {
      synlig = p[0].isIntersecting;
      if (synlig) fade();
    }).observe(rod);
  } else {
    requestAnimationFrame(fade);
  }
  requestAnimationFrame(trin);
})();
