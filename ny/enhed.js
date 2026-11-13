/* Læses synkront efter kontakten, aldrig defer — ellers blinker siden. */
(function () {
  'use strict';

  var NOEGLE = 'quad.enhed';
  var IMPERIAL = 'imperial';
  var METRISK = 'metrisk';

  function laes() {
    try { return window.localStorage.getItem(NOEGLE); } catch (fejl) { return null; }
  }
  function skriv(v) {
    try { window.localStorage.setItem(NOEGLE, v); } catch (fejl) {}
  }

  var boks = document.getElementById('enhedsskift');
  if (!boks) return;
  boks.tabIndex = -1;
  boks.setAttribute('aria-hidden', 'true');

  if (laes() === IMPERIAL) boks.checked = true;

  var iUrl = window.location.pathname.indexOf('/robots/') !== -1;
  function skrivUrl() {
    if (!iUrl) return;
    try {
      var p = new URLSearchParams(window.location.search);
      if (boks.checked) p.set('enhed', IMPERIAL); else p.delete('enhed');
      var s = p.toString();
      window.history.replaceState(null, '', window.location.pathname + (s ? '?' + s : '') + window.location.hash);
    } catch (fejl) {}
  }
  if (iUrl) {
    var ae = new URLSearchParams(window.location.search).get('enhed');
    if (ae === IMPERIAL) boks.checked = true;
    else if (ae === 'metric') boks.checked = false;
    if (boks.checked) skrivUrl();
  }

  var rod = document.documentElement;
  var slukFlag = 0;

  var valg = document.querySelectorAll('[data-enhedsvalg]');
  function tegn() {
    Array.prototype.forEach.call(valg, function (v) {
      v.setAttribute('aria-pressed', String((v.getAttribute('data-enhedsvalg') === IMPERIAL) === boks.checked));
    });
  }
  Array.prototype.forEach.call(valg, function (v) {
    v.addEventListener('click', function () {
      if (boks.checked !== (v.getAttribute('data-enhedsvalg') === IMPERIAL)) boks.click();
    });
  });
  tegn();

  boks.addEventListener('change', function () {
    tegn();
    skrivUrl();
    skriv(boks.checked ? IMPERIAL : METRISK);
    rod.removeAttribute('data-enhedsskift');
    void rod.offsetWidth;
    rod.setAttribute('data-enhedsskift', '');
    clearTimeout(slukFlag);
    slukFlag = setTimeout(function () { rod.removeAttribute('data-enhedsskift'); }, 200);
  });

  window.addEventListener('storage', function (h) {
    if (h.key !== NOEGLE) return;
    boks.checked = h.newValue === IMPERIAL;
    tegn();
  });
}());

(function () {
  'use strict';

  function rund() {
    Array.prototype.forEach.call(document.querySelectorAll('.enhedsvis--imperial .v-tal'), function (v) {
      var n = v.querySelector('.num');
      var op = v.querySelector('.op');
      if (!n || n.getAttribute('data-rund') !== null) return;
      if (!(op && /approx|\u2248/.test(op.textContent)) && n.textContent.indexOf('\u2013') < 0) return;
      n.setAttribute('data-rund', n.textContent);
      n.textContent = n.textContent.replace(/\d[\d,]*\.?\d*/g, function (x) {
        var r = Math.round(parseFloat(x.replace(/,/g, '')));
        return r === 0 ? x : r.toLocaleString('en-US');
      });
    });
  }

  function start() {
    rund();
    new MutationObserver(rund).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
}());
