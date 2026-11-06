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

  function trin(t) {
    var dt = Math.min(t - t0, 100) / 1000;
    t0 = t;
    var maks = spor.scrollWidth - spor.clientWidth;
    if (over || fokus || reduce.matches || !synlig || t < ventTil || maks <= 0) {
      v = 0;
    } else {
      if (retning > 0 && pos >= maks - FART * TAU) retning = -1;
      else if (retning < 0 && pos <= FART * TAU) retning = 1;
      v += (retning * FART - v) * Math.min(1, dt / TAU);
      pos = Math.max(0, Math.min(maks, pos + v * dt));
      spor.scrollLeft = pos;
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

  pile.forEach(function (knap) {
    knap.addEventListener('click', function () {
      if (knap.getAttribute('aria-disabled') === 'true') return;
      ro();
      var kort = spor.querySelector('.nyeste__kort');
      var skridt = kort.offsetWidth + parseFloat(getComputedStyle(spor).columnGap || 0);
      spor.scrollBy({ left: skridt * Number(knap.getAttribute('data-nyeste-pil')), behavior: reduce.matches ? 'auto' : 'smooth' });
    });
  });

  function fade() {
    var h = spor.scrollLeft > 2, d = spor.scrollLeft + spor.clientWidth < spor.scrollWidth - 2;
    pile.forEach(function (k) { k.setAttribute('aria-disabled', String(!(Number(k.getAttribute('data-nyeste-pil')) < 0 ? h : d))); });
    if (h || d) spor.setAttribute('data-fade', h && d ? 'begge' : h ? 'venstre' : 'hoejre'); else spor.removeAttribute('data-fade');
  }
  spor.addEventListener('scroll', function () {
    if (Math.abs(spor.scrollLeft - pos) > 2) { pos = spor.scrollLeft; ro(); }
    fade();
  }, { passive: true });
  addEventListener('resize', fade);
  fade();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (p) { synlig = p[0].isIntersecting; }).observe(rod);
  }
  requestAnimationFrame(trin);
})();
