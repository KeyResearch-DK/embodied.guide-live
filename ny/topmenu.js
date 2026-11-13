(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.nav__knap, .dd__knap'), function (k) {
    var m = document.getElementById(k.getAttribute('aria-controls')), rod = k.parentNode;
    function saet(aaben, fokus) {
      k.setAttribute('aria-expanded', aaben ? 'true' : 'false');
      m.hidden = !aaben;
      if (fokus) k.focus();
    }
    k.addEventListener('click', function () { saet(m.hidden); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !m.hidden) saet(false, true); });
    document.addEventListener('click', function (e) { if (!m.hidden && !rod.contains(e.target)) saet(false); });
    if (k.classList.contains('dd__knap')) {
      var navn = function (a) { var v = m.querySelector('[' + a + '][aria-pressed="true"]'); return v ? v.textContent : ''; };
      var sync = function () { k.setAttribute('aria-label', k.getAttribute('data-aria').replace('{enhed}', navn('data-enhedsvalg')).replace('{tema}', navn('data-tema'))); };
      new MutationObserver(sync).observe(m, { attributes: true, attributeFilter: ['aria-pressed'], subtree: true });
      sync();
    }
    rod.addEventListener('focusout', function (e) { if (!m.hidden && e.relatedTarget && !rod.contains(e.relatedTarget)) saet(false); });
  });
})();
