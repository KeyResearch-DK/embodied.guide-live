(function () {
  'use strict';

  var v = document.querySelector('.view');
  if (v) {
    var knapper = v.querySelectorAll('.seg button');
    [].forEach.call(knapper, function (b) {
      b.addEventListener('click', function () {
        v.setAttribute('data-view', b.getAttribute('data-v'));
        document.body.setAttribute('data-view', b.getAttribute('data-v'));
        [].forEach.call(knapper, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
  }

  var cb = document.getElementById('ns');
  var sp = document.getElementById('specs');
  var m = document.getElementById('hidemsg');
  if (cb && sp && m) {
    var saet = function () { sp.classList.toggle('hide-ns', !cb.checked); m.hidden = cb.checked; };
    var skrivNs = function () {
      try {
        var q = new URLSearchParams(window.location.search);
        if (cb.checked) q.delete('ns'); else q.set('ns', '0');
        var t = q.toString();
        window.history.replaceState(null, '', window.location.pathname + (t ? '?' + t : '') + window.location.hash);
      } catch (fejl) {}
    };
    if (new URLSearchParams(window.location.search).get('ns') === '0') { cb.checked = false; saet(); }
    cb.addEventListener('change', function () { saet(); skrivNs(); });
    document.getElementById('showall').addEventListener('click', function () { cb.checked = true; saet(); skrivNs(); cb.focus(); });
    document.addEventListener('click', function (e) {
      var l = e.target.closest('a[href^="#felt-"]');
      var rk = l && document.getElementById(l.getAttribute('href').slice(1));
      if (!rk || cb.checked || !sp.contains(rk) || rk.getBoundingClientRect().height > 0) return;
      cb.checked = true; saet(); skrivNs();
      setTimeout(function () { rk.scrollIntoView({ block: 'center' }); }, 250);
    });
  }

  if (sp) {
    var fastg = function () {
      var gs = sp.querySelectorAll('.spec .g');
      if (!gs.length || sp.querySelector('.g--k2')) return;
      for (var i = 1; i < gs.length; i++) {
        if (gs[i].offsetLeft > gs[0].offsetLeft + 10) { gs[i].classList.add('g--k2'); return; }
      }
    };
    var slipg = function () { [].forEach.call(sp.querySelectorAll('.g--k2'), function (g) { g.classList.remove('g--k2'); }); };
    window.addEventListener('resize', slipg);
    if (cb) cb.addEventListener('change', slipg);
    var sa = document.getElementById('showall');
    if (sa) sa.addEventListener('click', slipg);
    sp.addEventListener('click', function (e) {
      var x = e.target.closest('.nx');
      if (x) {
        var kn = x.closest('.r').querySelector('.sm');
        kn.click();
        kn.focus();
        return;
      }
      var b = e.target.closest('.sm');
      if (!b) return;
      fastg();
      var r = b.closest('.r');
      var n = r.querySelector('.r__note');
      var aaben = n.hidden;
      n.hidden = !aaben;
      [].forEach.call(r.querySelectorAll('.sm'), function (x) { x.setAttribute('aria-expanded', String(aaben)); });
      r.classList.toggle('r--open', aaben);
    });
  }

  var luk = function (knap, panel, fokus) {
    panel.hidden = true;
    knap.setAttribute('aria-expanded', 'false');
    if (fokus) knap.focus();
  };
  document.addEventListener('click', function (e) {
    if (e.target.closest('#specs')) return;
    var kn = e.target.closest('button[aria-controls]');
    var pn = kn && document.getElementById(kn.getAttribute('aria-controls'));
    if (pn && pn.classList.contains('fx-note')) {
      pn.hidden = !pn.hidden;
      kn.setAttribute('aria-expanded', String(!pn.hidden));
      return;
    }
    var x = e.target.closest('.fx-note .nx');
    if (!x) return;
    var p2 = x.closest('.fx-note');
    luk(document.querySelector('[aria-controls="' + p2.id + '"]'), p2, true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    [].forEach.call(document.querySelectorAll('.fx-note:not([hidden])'), function (p2) {
      var kn = document.querySelector('[aria-controls="' + p2.id + '"]');
      luk(kn, p2, p2.contains(document.activeElement) || document.activeElement === kn);
    });
    if (sp) [].forEach.call(sp.querySelectorAll('.r--open'), function (r) {
      var inde = r.contains(document.activeElement);
      r.querySelector('.r__note').hidden = true;
      r.classList.remove('r--open');
      [].forEach.call(r.querySelectorAll('.sm'), function (b) { b.setAttribute('aria-expanded', 'false'); });
      if (inde) r.querySelector('.sm').focus();
    });
  });

  var p = document.querySelector('.fpick');
  if (p) {
    var fr = document.querySelectorAll('.frs .fr');
    var bs = p.querySelectorAll('button');
    var vaelg = function (i) {
      [].forEach.call(fr, function (f, j) { f.classList.toggle('is-pick', i === j); });
      [].forEach.call(bs, function (b, j) { b.setAttribute('aria-pressed', String(i === j)); });
    };
    [].forEach.call(bs, function (b, j) { b.addEventListener('click', function () { vaelg(j); }); });
    vaelg(0);
  }

  (function () {
    var frs = document.querySelector('.frs');
    var nj = document.querySelector('.frs__n');
    if (!frs || !nj) return;
    var navne = JSON.parse(nj.textContent);
    var tekst = function (k, n) { return frs.getAttribute('data-' + k).replace('{n}', n); };
    var kort = document.createElement('div');
    kort.className = 'fr__card'; kort.hidden = true;
    var akt = null, fast = false, sidste = 'mouse', alle = [];
    var navnFor = function (h) { return h.r.map(function (i) { return navne[i]; }); };
    var linje = function (n) {
      var s = n.slice(0, 5).map(function (x) { return x[1]; }).join(', ');
      return n.length > 5 ? s + ' ' + tekst('more', n.length - 5) : s;
    };
    var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
    var skjul = function () {
      if (akt) { akt.rect.classList.remove('is-hot'); akt.el.setAttribute('aria-expanded', 'false'); }
      akt = null; fast = false; kort.hidden = true;
    };
    var vis = function (h, laast) {
      if (akt && akt !== h) akt.rect.classList.remove('is-hot');
      akt = h; fast = laast;
      h.rect.classList.add('is-hot');
      var n = navnFor(h);
      kort.textContent = '';
      kort.classList.toggle('is-list', laast);
      if (laast) {
        kort.appendChild(el('p', 'fr__ct', tekst('list', n.length)));
        var ul = el('ul', 'fr__ul');
        n.forEach(function (x) {
          var li = el('li'); var a = el('a', '', x[1]);
          a.href = frs.getAttribute('data-base').replace('~', x[0]); a.setAttribute('translate', 'no');
          li.appendChild(a); ul.appendChild(li);
        });
        kort.appendChild(ul);
      } else {
        n.slice(0, 5).forEach(function (x) {
          var s = el('a', 'fr__nm', x[1]); s.setAttribute('translate', 'no'); s.tabIndex = -1;
          s.href = frs.getAttribute('data-base').replace('~', x[0]);
          kort.appendChild(s);
        });
        if (n.length > 5) kort.appendChild(el('span', 'fr__mer', tekst('more', n.length - 5)));
        if (n.length > 1) kort.appendChild(el('span', 'fr__hint', frs.getAttribute('data-hint')));
      }
      h.fig.appendChild(kort);
      kort.hidden = false;
      var cx = h.el.offsetLeft + h.el.offsetWidth / 2;
      kort.style.left = Math.max(0, Math.min(cx - kort.offsetWidth / 2, h.fig.clientWidth - kort.offsetWidth)) + 'px';
      h.el.setAttribute('aria-expanded', String(laast));
    };
    var aabn = function (h) {
      vis(h, true);
      var a = kort.querySelector('a');
      if (a) a.focus();
    };
    var naer = function (ov, x, maks) {
      var b = null, bd = maks + 1;
      ov._h.forEach(function (h) {
        var r = h.el.getBoundingClientRect(); var d = Math.abs(x - (r.left + r.width / 2));
        if (d < bd) { bd = d; b = h; }
      });
      return b;
    };
    [].forEach.call(frs.querySelectorAll('.fr__fig'), function (fig) {
      var rects = fig.querySelectorAll('.f rect[data-r]');
      if (!rects.length) return;
      var ov = el('div', 'fr__hit'); ov._h = [];
      ov.setAttribute('role', 'group'); ov.setAttribute('aria-label', frs.getAttribute('data-hits'));
      [].forEach.call(rects, function (rc, i) {
        var r = rc.getAttribute('data-r').split(' ').map(Number);
        var n = r.map(function (j) { return navne[j]; });
        var e = el(r.length === 1 ? 'a' : 'button', 'hit');
        if (r.length === 1) e.href = frs.getAttribute('data-base').replace('~', n[0][0]);
        else { e.type = 'button'; e.setAttribute('aria-expanded', 'false'); }
        e.setAttribute('aria-label', linje(n));
        e.tabIndex = i === 0 ? 0 : -1;
        e.style.left = (parseFloat(rc.getAttribute('x')) / 10) + '%';
        e.style.width = (parseFloat(rc.getAttribute('width')) / 10) + '%';
        var h = { el: e, rect: rc, r: r, fig: fig, ov: ov };
        e._h = h; ov._h.push(h); alle.push(h);
        e.addEventListener('focus', function () {
          ov._h.forEach(function (x) { x.el.tabIndex = x === h ? 0 : -1; });
          if (akt !== h || fast) vis(h, false);
        });
        e.addEventListener('blur', function (ev) { if (!fast && !(ev.relatedTarget && kort.contains(ev.relatedTarget))) skjul(); });
        e.addEventListener('keydown', function (ev) {
          var k = ev.key; var j = ov._h.indexOf(h);
          var t = k === 'ArrowRight' ? j + 1 : k === 'ArrowLeft' ? j - 1 : k === 'Home' ? 0 : k === 'End' ? ov._h.length - 1 : -1;
          if (t < 0) return;
          ev.preventDefault();
          if (ov._h[t]) ov._h[t].el.focus();
        });
        ov.appendChild(e);
      });
      ov.addEventListener('pointerdown', function (ev) { sidste = ev.pointerType; });
      ov.addEventListener('pointermove', function (ev) {
        if (ev.pointerType === 'touch') return;
        var h = naer(ov, ev.clientX, 10);
        ov.style.cursor = h ? 'pointer' : '';
        if (fast && akt && akt.ov === ov) return;
        if (h) { if (akt !== h || fast) vis(h, false); } else skjul();
      });
      ov.addEventListener('pointerleave', function (ev) {
        if (ev.pointerType === 'touch' || fast || ov.contains(document.activeElement) || kort.contains(ev.relatedTarget)) return;
        skjul();
      });
      var klik = function (h, ev, ctrl) {
        h.el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: ctrl || ev.ctrlKey, shiftKey: ev.shiftKey, altKey: ev.altKey, metaKey: ev.metaKey }));
      };
      ov.addEventListener('click', function (ev) {
        var t = ev.target.closest('.hit');
        var h = t ? t._h : naer(ov, ev.clientX, sidste === 'touch' ? 18 : 10);
        if (!h || (t && h.r.length === 1)) return;
        if (sidste === 'touch' && akt !== h) { vis(h, false); return; }
        if (h.r.length === 1) { klik(h, ev); return; }
        aabn(h);
      });
      ['mousedown', 'mouseup'].forEach(function (t) {
        ov.addEventListener(t, function (ev) {
          var h = ev.button === 1 && naer(ov, ev.clientX, 10);
          if (!h || h.r.length !== 1) return;
          if (t === 'mouseup') klik(h, ev, true); else ev.preventDefault();
        });
      });
      fig.appendChild(ov);
    });
    if (!alle.length) return;
    kort.addEventListener('pointerleave', function (ev) {
      if (ev.pointerType === 'touch' || fast || !akt || akt.ov.contains(ev.relatedTarget) || akt.ov.contains(document.activeElement)) return;
      skjul();
    });
    kort.addEventListener('focusout', function (ev) {
      if (fast && !(ev.relatedTarget && (kort.contains(ev.relatedTarget) || (akt && akt.el === ev.relatedTarget)))) skjul();
    });
    document.addEventListener('pointerdown', function (ev) {
      if (akt && (fast || ev.pointerType === 'touch') && !kort.contains(ev.target) && !ev.target.closest('.fr__hit')) skjul();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape' || !akt) return;
      var h = akt; var inde = kort.contains(document.activeElement);
      skjul();
      if (inde) h.el.focus({ preventScroll: true });
    });
    var bredde = innerWidth;
    addEventListener('resize', function () { if (innerWidth !== bredde) { bredde = innerWidth; skjul(); } });
  }());

  var links = [].slice.call(document.querySelectorAll('.local a[href^="#"]:not(.til-top)'));
  if (links.length) {
    document.querySelector('.local').setAttribute('data-nav-js', '');
    var valgt = null, fri;
    var skin = document.querySelector('.local__s'), nu = null;
    var streg = function () {
      if (!nu) return;
      skin.style.setProperty('--mx', nu.offsetLeft + 'px');
      skin.style.setProperty('--mw', nu.offsetWidth + 'px');
      skin.style.setProperty('--my', nu.offsetTop + nu.offsetHeight - 2 + 'px');
    };
    var marker = function (a) {
      links.forEach(function (x) { if (x === a) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
      nu = a; streg();
    };
    addEventListener('resize', streg);
    // glid først efter webfonten: ellers glider stregen i bredden ved indlæsning
    var glid = function () { streg(); getComputedStyle(skin, '::after').transform; document.querySelector('.local').setAttribute('data-glid', ''); };
    if (document.fonts) document.fonts.ready.then(glid); else glid();
    var spejd = function () {
      if (valgt) { marker(valgt); clearTimeout(fri); fri = setTimeout(slip, 200); return; }
      var akt = links[0];
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 16) akt = links[links.length - 1];
      else links.forEach(function (a) { var el = document.getElementById(a.hash.slice(1)); if (el && el.getBoundingClientRect().top <= 100) akt = a; });
      marker(akt);
    };
    addEventListener('scroll', spejd, { passive: true });
    var slip = function () { valgt = null; };
    links.forEach(function (a) { a.addEventListener('click', function () { valgt = a; marker(a); clearTimeout(fri); fri = setTimeout(slip, 400); }); });
    spejd();
  }

  [document.querySelector('.local__s')].forEach(function (el) {
    if (!el) return;
    var fade = function () {
      var v = el.scrollLeft > 2, h = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      if (v || h) el.setAttribute('data-fade', v && h ? 'begge' : v ? 'venstre' : 'hoejre'); else el.removeAttribute('data-fade');
    };
    el.addEventListener('scroll', fade, { passive: true });
    addEventListener('resize', fade);
    fade();
  });
}());
