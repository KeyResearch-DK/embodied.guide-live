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

  var iUrl = !!boks.closest('.robotside');
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

  var etiket = boks.closest('.robotside') ? document.querySelector('.daek__enhed .enhedsskift') : null;
  function synk() { if (etiket) etiket.setAttribute('aria-checked', String(boks.checked)); }
  if (etiket) {
    boks.tabIndex = -1;
    etiket.tabIndex = 0;
    etiket.setAttribute('role', 'switch');
    etiket.addEventListener('keydown', function (h) {
      if (h.key === ' ' || h.key === 'Enter') { h.preventDefault(); boks.click(); }
    });
    synk();
  }

  boks.addEventListener('change', function () {
    synk();
    skrivUrl();
    skriv(boks.checked ? IMPERIAL : METRISK);
    rod.setAttribute('data-enhedsskift', '');
    clearTimeout(slukFlag);
    slukFlag = setTimeout(function () { rod.removeAttribute('data-enhedsskift'); }, 2 * tidSkift());
  });

  window.addEventListener('storage', function (h) {
    if (h.key !== NOEGLE) return;
    boks.checked = h.newValue === IMPERIAL;
    synk();
  });
}());
