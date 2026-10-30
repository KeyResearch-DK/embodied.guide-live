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
    try { window.localStorage.setItem(NOEGLE, v); } catch (fejl) { /* husker ikke */ }
  }

  var boks = document.getElementById('enhedsskift');
  if (!boks) return;

  if (laes() === IMPERIAL) boks.checked = true;

  var iUrl = window.location.pathname.indexOf('/robots/') !== -1;
  function skrivUrl() {
    if (!iUrl) return;
    try {
      var p = new URLSearchParams(window.location.search);
      if (boks.checked) p.set('enhed', IMPERIAL); else p.delete('enhed');
      var s = p.toString();
      window.history.replaceState(null, '', window.location.pathname + (s ? '?' + s : '') + window.location.hash);
    } catch (fejl) { /* tavs */ }
  }
  if (iUrl) {
    var ae = new URLSearchParams(window.location.search).get('enhed');
    if (ae === IMPERIAL) boks.checked = true;
    else if (ae === 'metric') boks.checked = false;
    if (boks.checked) skrivUrl();
  }

  var rod = document.documentElement;
  var slukFlag = 0;
  function tidSkift() {
    var v = parseFloat(getComputedStyle(rod).getPropertyValue('--tid-skift'));
    return isNaN(v) ? 240 : v * 1000;
  }

  document.addEventListener('click', function (h) {
    var etiket = h.target.closest ? h.target.closest('.units__l') : null;
    if (!etiket) return;
    h.preventDefault();
    var ord = h.target.closest('.units__i, .units__m');
    var vilImperial = ord ? ord.classList.contains('units__i') : !boks.checked;
    if (boks.checked !== vilImperial) boks.click();
  });

  boks.addEventListener('change', function () {
    skrivUrl();
    skriv(boks.checked ? IMPERIAL : METRISK);
    rod.setAttribute('data-enhedsskift', '');
    clearTimeout(slukFlag);
    slukFlag = setTimeout(function () { rod.removeAttribute('data-enhedsskift'); }, 2 * tidSkift());
  });

  window.addEventListener('storage', function (h) {
    if (h.key !== NOEGLE) return;
    boks.checked = h.newValue === IMPERIAL;
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
