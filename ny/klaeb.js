(function () {
  var rod = document.documentElement;
  rod.setAttribute('data-klaeb-js', '');
  if (!('IntersectionObserver' in window)) return;
  var set = [], observere = {};
  function observer(top) {
    if (observere[top]) return observere[top];
    return (observere[top] = new IntersectionObserver(function (poster) {
      poster.forEach(function (p) {
        var kl = p.isIntersecting && p.intersectionRatio < 1 && p.boundingClientRect.top <= top + 1;
        if (kl) p.target.setAttribute('data-klaebet', ''); else p.target.removeAttribute('data-klaebet');
      });
    // Fjern ikke 0: uden den melder Chrome intet, når en bjælke under første skærm hopper direkte til klæbet.
    }, { rootMargin: -(top + 1) + 'px 0px 0px 0px', threshold: [0, 1] }));
  }
  function start() {
    Object.keys(observere).forEach(function (k) { observere[k].disconnect(); });
    observere = {};
    set.forEach(function (el) {
      var top = parseFloat(getComputedStyle(el).top);
      if (!isNaN(top) && el.isConnected) observer(top).observe(el);
    });
  }
  function iagttag(fra) {
    var nye = (fra || document).querySelectorAll('[data-klaeb]');
    for (var i = 0; i < nye.length; i++) if (set.indexOf(nye[i]) < 0) set.push(nye[i]);
    start();
  }
  var rt;
  addEventListener('resize', function () { cancelAnimationFrame(rt); rt = requestAnimationFrame(start); });
  document.addEventListener('click', function (e) {
    // Skip-linket skal springe straks: fragmentspringet læser html-stilen, mens klikket kører.
    if (e.target.closest && e.target.closest('.skip')) { rod.style.scrollBehavior = 'auto'; setTimeout(function () { rod.style.removeProperty('scroll-behavior'); }, 100); }
    if (e.target.closest && e.target.closest('.til-top')) { e.preventDefault(); scrollTo(0, 0); var oeverst = document.querySelector('.top a'); if (oeverst) oeverst.focus({ preventScroll: true }); }
  });
  // Fjern ikke: uden en stilændring efter første billede åbner sidens første <details> uden overgang (Chrome 151).
  addEventListener('load', function () {
    requestAnimationFrame(function () {
      var ds = document.querySelectorAll('details');
      for (var i = 0; i < ds.length; i++) ds[i].style.setProperty('--fu', '0');
    });
  });
  window.klaeb = { iagttag: iagttag };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { iagttag(); });
  else iagttag();
})();
