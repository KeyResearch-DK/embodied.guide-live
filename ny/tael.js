(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const varighed = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tid-tael')) || 1400;
  const ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

  const kor = (vis) => {
    const start = performance.now();
    const lang = varighed();
    let id = 0;
    const tik = (nu) => {
      // rAF-tiden kan ligge før start; uden max vises negative tal ("-6") i første billede.
      const gaaet = Math.max(0, nu - start);
      vis(ease(Math.min(gaaet / lang, 1)));
      if (gaaet < lang) id = requestAnimationFrame(tik);
    };
    id = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(id);
  };

  window.taelStart = (g, lav) => {
    if (reduce()) return;
    if (g.__stop) g.__stop();
    const vis = lav(g);
    vis(0);
    g.__stop = kor(vis);
  };

  window.tael = (grupper, lav) => {
    if (!('IntersectionObserver' in window) || reduce()) return;

    const taelIo = new IntersectionObserver((poster) => {
      poster.forEach((p) => {
        const r = p.boundingClientRect;
        if (!p.isIntersecting) {
          if (r.bottom < 0) { taelIo.unobserve(p.target); p.target.__slut(); }
          return;
        }
        taelIo.unobserve(p.target);
        p.target.__tael();
      });
    }, { rootMargin: '0px 0px -10% 0px' });

    const nulIo = new IntersectionObserver((poster) => {
      poster.forEach((p) => {
        if (!p.isIntersecting) return;
        nulIo.unobserve(p.target);
        p.target.__nul();
        taelIo.observe(p.target);
      });
    }, { rootMargin: '200px 0px' });

    const html = document.documentElement;
    const malet = performance.getEntriesByType('paint').length > 0;
    const alle = [];
    grupper.forEach((g) => {
      // Allerede malet i syne med slut-tallet: nulstilling ville blinke — undtagen når tael-vent skjuler tallene.
      if (malet && !html.classList.contains('tael-vent') && g.getBoundingClientRect().top < innerHeight) return;
      let vis = () => {};
      g.__nul = () => { vis = lav(g); vis(0); html.classList.remove('tael-vent'); };
      g.__slut = () => { if (g.__stop) g.__stop(); vis(1); };
      g.__tael = () => { g.__stop = kor(vis); };
      alle.push(g);
      nulIo.observe(g);
    });
    if (!alle.length) html.classList.remove('tael-vent');

    const afslut = () => alle.forEach((g) => { nulIo.unobserve(g); taelIo.unobserve(g); g.__slut(); });
    addEventListener('beforeprint', afslut);
    matchMedia('print').addEventListener('change', (e) => e.matches && afslut());
  };
})();
