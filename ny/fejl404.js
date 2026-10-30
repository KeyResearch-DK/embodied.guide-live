(() => {
  const f = document.querySelector('.f404__sog');
  if (!f) return;
  const inp = f.querySelector('input');
  const { sog, kort: kortSti, producenter, stier, navne, ent, tekster } = JSON.parse(f.dataset.f404);
  const sti = location.pathname;

  document.querySelectorAll('.f404__veje a:not(.btn)').forEach((a) => {
    if (sti.indexOf(a.getAttribute('href')) === 0) f.action = a.getAttribute('href');
  });
  let s = sti.split('/').filter(Boolean).pop() || '';
  try { s = decodeURIComponent(s); } catch (e) { }
  s = s.replace(/[.]html?$/, '').replace(/[-_+]+/g, ' ').trim();
  if (s !== '404') inp.value = s;
  const adr = document.querySelector('[data-fejl404-adresse]');
  adr.querySelector('code').textContent = sti;
  adr.hidden = false;

  const ordAf = (q) => q.trim().toLowerCase().split(/\s+/);
  const antal = (j, k, ord) => (j[k] || []).filter((x) => ord.every((o) => x.indexOf(o) >= 0)).length;
  const hent = (u) => fetch(u).then((r) => r.text()).then((t) => new DOMParser().parseFromString(t, 'text/html'));
  const fyld = (el, mal, dele) => mal.split(/(\{\w+\})/).forEach((x) => {
    const m = /^\{(\w+)\}$/.exec(x);
    el.append(m ? dele[m[1]] : x);
  });
  const el = (tag, klasse, tekst) => {
    const e = document.createElement(tag);
    e.className = klasse;
    if (tekst !== undefined) e.textContent = tekst;
    return e;
  };

  f.addEventListener('submit', (e) => {
    const q = inp.value.trim();
    if (!q || !window.fetch) return;
    e.preventDefault();
    const ord = ordAf(q);
    fetch(sog).then((r) => r.json()).then((j) => {
      let m = 0, bedst = '';
      for (const k in j) {
        const n = antal(j, k, ord);
        if (n > m && stier[k]) { m = n; bedst = stier[k]; }
      }
      if (bedst) location.href = bedst + '?s=' + encodeURIComponent(q);
      else f.submit();
    }).catch(() => f.submit());
  });

  const q = inp.value.trim();
  if (!q) return;
  const ord = ordAf(q);
  const svar = document.querySelector('.f404__svar');
  const efter = (n) => svar.append(n);
  fetch(sog).then((r) => r.json()).then(async (j) => {
    const typer = Object.keys(navne).filter((k) => antal(j, k, ord));
    const p = el('p', 'f404__traef');
    if (typer.length) {
      const dele = document.createDocumentFragment();
      const en = typer.length === 1 && antal(j, typer[0], ord) === 1;
      typer.forEach((k, n) => {
        const a = antal(j, k, ord);
        if (n) dele.append(' · ');
        dele.append(el('strong', '', a), ' ' + (a === 1 ? ent[k] : navne[k]));
      });
      fyld(p, en ? tekster.traef_en : tekster.traef, { dele, q: '' + q });
      efter(p);
      const kort = [];
      const indeks = await fetch(kortSti).then((r) => r.json());
      for (const k of typer) {
        if (kort.length >= 3) break;
        (indeks[k] || []).forEach(([href, prod, navn, billede]) => {
          if (kort.length >= 3 || !ord.every((o) => (prod + ' ' + navn).toLowerCase().indexOf(o) >= 0)) return;
          const k1 = el('a', 'f404__kort');
          k1.href = href;
          const ramme = el('span', 'f404__kort-bil');
          if (billede) {
            const i2 = document.createElement('img');
            i2.src = billede;
            i2.alt = '';
            ramme.append(i2);
          }
          k1.append(ramme, el('span', 'f404__kort-prod', prod), el('span', 'f404__kort-navn', navn));
          kort.push(k1);
        });
      }
      if (kort.length) {
        const rad = el('div', 'f404__kortrad');
        rad.append(...kort.slice(0, 3));
        svar.append(rad);
      }
      return;
    }
    const liste = await hent(producenter);
    const raekke = [...liste.querySelectorAll('td[role="rowheader"] > a')].find((a) => a.textContent.toLowerCase().indexOf(ord[0]) >= 0);
    const modeller = raekke ? [...raekke.parentNode.querySelectorAll('[data-type] a')].reduce((sum, a) => sum + (parseInt(a.textContent, 10) || 0), 0) : 0;
    fyld(p, tekster.ingen, { q });
    efter(p);
    if (!modeller) return;
    const knap = el('a', 'btn');
    knap.href = new URL(raekke.getAttribute('href'), location.origin + producenter).pathname;
    fyld(knap, tekster.producent, { n: '' + modeller, navn: raekke.textContent });
    document.querySelector('.f404__veje').prepend(knap);
  }).catch(() => {});
})();
