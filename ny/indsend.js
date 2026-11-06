(function () {
  var form = document.getElementById('form');
  if (!form) return;
  var $ = function (i) { return document.getElementById(i); };
  var TX = JSON.parse(form.getAttribute('data-tekster'));
  var ENDEPUNKT = form.getAttribute('data-endpoint') || '';
  var RAEKKE = ['company', 'models', 'url', 'name', 'email'];
  var firma = new URLSearchParams(location.search).get('company');
  if (firma && firma.trim()) $('company').value = firma.trim().slice(0, 200);
  var titel = document.title;
  var skema = /^[a-z][a-z0-9+.-]*:(?!\d)/i;
  var httpsForan = function (s) { s = s.trim(); return s && !skema.test(s) ? 'https://' + s : s; };
  var urlOk = function (s) {
    try { var u = new URL(s); return /^https?:$/.test(u.protocol) && u.hostname.indexOf('.') > 0; } catch (e) { return false; }
  };
  var mailOk = function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); };
  var erTom = function (s) { return !s.trim(); };
  var gyldig = {
    company: function (v) { return !erTom(v); },
    models: function (v) { return !erTom(v); },
    url: function (v) { return urlOk(v); },
    name: function (v) { return !erTom(v); },
    email: function (v) { return mailOk(v.trim()); }
  };

  var feltFejl = function (k, til) {
    var inp = $(k), f = $(k + '-f'), id = k + '-f';
    var d = (inp.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== id; });
    f.hidden = !til;
    if (til) { f.querySelector('[data-t]').textContent = TX.fejl[k]; d.push(id); inp.setAttribute('aria-invalid', 'true'); } else inp.removeAttribute('aria-invalid');
    if (d.length) inp.setAttribute('aria-describedby', d.join(' ')); else inp.removeAttribute('aria-describedby');
    inp.closest('.inp').classList.toggle('inp--fejl', til);
  };
  var visBoks = function (sendefejl) {
    var h = $('opsummering-h');
    h.textContent = h.getAttribute(sendefejl ? 'data-sendfejl' : 'data-fejl');
    $('opsummering-tekst').hidden = !sendefejl;
    $('opsummering-liste').hidden = sendefejl;
    $('opsummering').hidden = false;
    $('opsummering').focus();
    document.title = TX.titelFejl;
  };
  var skjulBoks = function () {
    $('opsummering').hidden = true;
    $('opsummering-liste').textContent = '';
    document.title = titel;
  };
  var hviler = function () {
    form.removeAttribute('aria-busy');
    $('send').removeAttribute('aria-disabled');
    $('send').textContent = TX.send;
    $('sendstatus').textContent = '';
  };
  var kvittering = function (v) {
    form.hidden = true;
    document.querySelectorAll('[data-k]').forEach(function (d) { d.textContent = v[d.getAttribute('data-k')]; });
    skjulBoks();
    $('kvit').hidden = false;
    $('kvit').focus();
    document.title = TX.titelSendt;
  };
  var sendfejl = function () {
    hviler();
    $('send').textContent = TX.sendIgen;
    $('opsummering-liste').textContent = '';
    visBoks(true);
  };

  $('url').addEventListener('blur', function () {
    this.value = httpsForan(this.value);
    if (this.value) feltFejl('url', !urlOk(this.value));
  });

  $('opsummering-liste').addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    e.preventDefault();
    var inp = $(a.getAttribute('href').slice(1));
    inp.closest('.inp').scrollIntoView(); inp.focus({ preventScroll: true });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('send').getAttribute('aria-disabled') === 'true') return;
    $('url').value = httpsForan($('url').value);
    var v = {};
    RAEKKE.forEach(function (k) { v[k] = $(k).value.trim(); });
    var fejl = RAEKKE.filter(function (k) { var ok = gyldig[k]($(k).value); feltFejl(k, !ok); return !ok; });
    if (fejl.length) {
      var liste = $('opsummering-liste');
      liste.textContent = '';
      fejl.forEach(function (k) {
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = '#' + k; a.textContent = TX.fejl[k]; li.appendChild(a); liste.appendChild(li);
      });
      visBoks(false);
      return;
    }
    skjulBoks();
    if ($('hp_note').value) { kvittering(v); return; }
    var who = form.querySelector('input[name=who]:checked');
    var krop = { company: v.company, models: v.models, url: v.url, name: v.name, email: v.email, who: who ? who.value : '', msg: $('msg').value.trim() };
    form.setAttribute('aria-busy', 'true');
    $('send').textContent = TX.sender; $('send').setAttribute('aria-disabled', 'true');
    $('sendstatus').textContent = TX.sender;
    document.title = TX.titelSender;
    if (!ENDEPUNKT) { sendfejl(); return; }
    fetch(ENDEPUNKT, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(krop) })
      .then(function (r) { if (r.ok) { hviler(); kvittering(v); } else sendfejl(); }, sendfejl);
  });

  $('igen').addEventListener('click', function () {
    form.reset();
    RAEKKE.forEach(function (k) { feltFejl(k, false); });
    skjulBoks();
    $('kvit').hidden = true; form.hidden = false;
    $('company').focus();
  });
})();
