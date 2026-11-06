(() => {
  const aabn = () => {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    const e = id && document.getElementById(id);
    if (e instanceof HTMLDetailsElement) e.open = true;
  };
  aabn();
  addEventListener('hashchange', aabn);

  const klargoer = (figur) => {
    const slut = figur.textContent.trim();
    const sep = slut.replace(/\d/g, '')[0] ?? '';
    const vaerdi = Number(slut.replace(/\D/g, ''));
    figur.dataset.tael = slut;
    figur.innerHTML = '<span class="kunskaerm"></span><span aria-hidden="true">0</span>';
    figur.firstChild.textContent = slut;
    const cifre = figur.lastChild;
    // Til sidst ren tekst igen; ellers kopieres tallet dobbelt ("173173").
    return (p) => {
      if (p >= 1) { figur.textContent = slut; delete figur.dataset.tael; return; }
      cifre.textContent = String(Math.floor(vaerdi * p)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    };
  };

  const grupper = [...document.querySelectorAll('.om-tal__post, .om-mark__boks')];
  if (!grupper.length) return;
  window.tael(grupper, (g) => {
    const skridt = [...g.querySelectorAll('.figur')].map(klargoer);
    const ja = g.querySelector('.om-bjaelke__ja');
    const basis = ja ? parseFloat(ja.style.flexBasis) : 0;
    return (p) => {
      skridt.forEach((s) => s(p));
      if (ja) ja.style.flexBasis = (basis * p) + '%';
    };
  });
})();
