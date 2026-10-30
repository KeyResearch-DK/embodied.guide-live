(function () {
  'use strict';

  var NOEGLE = 'quad-sammenligning:';
  var KLASSER = ['humanoid', 'quadruped', 'ai_model'];
  var telefon = window.matchMedia ? window.matchMedia('(max-width: 599px)') : { matches: false };

  function laes(klasse) {
    try {
      var a = JSON.parse(localStorage.getItem(NOEGLE + klasse) || '[]');
      return Object.prototype.toString.call(a) === '[object Array]'
        ? a.filter(function (s) { return typeof s === 'string' && s; }).slice(0, 3)
        : [];
    } catch (e) {
      return [];
    }
  }

  function skriv(klasse, liste) {
    try {
      localStorage.setItem(NOEGLE + klasse, JSON.stringify(liste));
      localStorage.setItem(NOEGLE + 'sidst', JSON.stringify(klasse));
    } catch (e) {}
  }

  function maks() { return telefon.matches ? 2 : 3; }

  function taeller() {
    var el = document.querySelector('.cmptal');
    if (!el) return;
    var lister = {}, total = 0, sidst = null;
    KLASSER.forEach(function (k) { lister[k] = laes(k); total += lister[k].length; });
    try { sidst = JSON.parse(localStorage.getItem(NOEGLE + 'sidst')); } catch (e) {}
    var liste = lister[sidst] && lister[sidst].length ? lister[sidst] : (KLASSER.map(function (k) { return lister[k]; }).filter(function (l) { return l.length; })[0] || []);
    el.href = el.getAttribute('data-href') + (liste.length ? '#r=' + liste.map(encodeURIComponent).join(',') : '');
    el.classList.toggle('cmptal--n', total > 0);
    var tal = el.querySelector('b');
    if (total && !tal) { tal = document.createElement('b'); el.appendChild(tal); }
    if (tal) { if (total) tal.textContent = String(total); else tal.remove(); }
    el.setAttribute('aria-label', total ? el.getAttribute('data-aria').replace('{n}', total) : el.querySelector('.cmptal__ord').textContent);
  }

  function tegnKnap(b, valgt, af, liste) {
    var ord = b.querySelector('.ret-cmp__ord');
    if (b.samlHvileNavn === undefined) { b.samlHvileNavn = b.getAttribute('aria-label') || ''; b.samlHvileOrd = ord ? ord.textContent : ''; }
    b.removeAttribute('hidden');
    b.setAttribute('aria-pressed', valgt ? 'true' : 'false');
    b.classList.toggle('ret-cmp--valgt', valgt);
    b.classList.toggle('ret-cmp--af', af);
    if (af) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
    b.setAttribute('aria-label', valgt ? b.getAttribute('data-saml-valgt-navn') : b.samlHvileNavn);
    if (ord) ord.textContent = valgt ? b.getAttribute('data-saml-valgt-ord') : b.samlHvileOrd;
    var se = b.nextElementSibling && b.nextElementSibling.classList.contains('ret-cmp-se') ? b.nextElementSibling : null;
    if (b.hasAttribute('data-saml-se')) {
      if (valgt && !se) { se = document.createElement('a'); se.className = 'ret-cmp-se'; b.after(se); }
      if (valgt) {
        se.textContent = b.getAttribute('data-saml-se').replace('{n}', liste.length);
        se.href = b.getAttribute('data-saml-href') + '#r=' + liste.map(encodeURIComponent).join(',');
      } else if (se) se.remove();
    }
  }

  function opdater() {
    var lister = {};
    KLASSER.forEach(function (k) { lister[k] = laes(k); });
    [].forEach.call(document.querySelectorAll('button[data-saml]'), function (b) {
      var liste = lister[b.getAttribute('data-saml-klasse')] || [];
      var valgt = liste.indexOf(b.getAttribute('data-saml')) >= 0;
      tegnKnap(b, valgt, !valgt && liste.length >= maks(), liste);
    });
    taeller();
  }

  // Kataloget har sin egen klikhaandtering (klaebebar, tilvalg); alle andre sider bruger denne.
  var katalog = !!document.querySelector('[data-saml-taeller]');
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button[data-saml]');
    if (b && !katalog && b.getAttribute('aria-disabled') !== 'true') {
      var klasse = b.getAttribute('data-saml-klasse'), liste = laes(klasse), p = liste.indexOf(b.getAttribute('data-saml'));
      if (p >= 0) liste.splice(p, 1); else liste.push(b.getAttribute('data-saml'));
      skriv(klasse, liste);
      opdater();
      return;
    }
    setTimeout(taeller, 60);
  });
  window.quadSaml = { opdater: opdater, maks: maks, skriv: skriv };
  window.addEventListener('storage', opdater);
  window.addEventListener('pageshow', opdater);
  window.addEventListener('hashchange', function () { setTimeout(taeller, 60); });
  if (telefon.addEventListener) telefon.addEventListener('change', opdater);
  opdater();
})();
