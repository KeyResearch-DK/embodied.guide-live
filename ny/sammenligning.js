(function () {
  'use strict';

  var app = document.querySelector('[data-sammenligning]');
  var dataEl = document.getElementById('sammenligning-data');
  if (!app || !dataEl) return;

  var DATA;
  try { DATA = JSON.parse(dataEl.textContent); } catch (fejl) { return; }
  if (!DATA || !DATA.robotter || !DATA.robotter.length) return;

  var lang = document.documentElement.lang === 'en' ? 'en-GB' : 'da-DK';
  var nf = (window.Intl && Intl.NumberFormat) ? new Intl.NumberFormat(lang, { maximumFractionDigits: 3 }) : null;
  function fmt(n) { return nf ? nf.format(n) : String(n); }
  var NY = DATA.ny || { klasser: {}, tekst: {} };
  var NYT = NY.tekst;
  function fyld(skabelon, v) {
    return String(skabelon).replace(/\{(\w+)\}/g, function (m, k) { return v[k] !== undefined ? v[k] : m; });
  }
  var datoFmt = (window.Intl && Intl.DateTimeFormat) ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : null;
  function datoI(s) {
    return String(s).replace(/(\d{4})-(\d{2})-(\d{2})/g, function (m, y, mo, d) { return datoFmt ? datoFmt.format(new Date(Date.UTC(+y, +mo - 1, +d))) : m; });
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function robotAf(slug) {
    for (var i = 0; i < DATA.robotter.length; i++) {
      if (DATA.robotter[i].slug === slug) return DATA.robotter[i];
    }
    return null;
  }

  var FELT_ANTAL_FALDBACK = Object.keys(DATA.feltNavne).length;
  function feltAntalFor(robottype) {
    var pr = DATA.naevnerPrType || {};
    return (robottype && pr[robottype] !== undefined) ? pr[robottype] : FELT_ANTAL_FALDBACK;
  }
  function taethedTekst(a, robottype) {
    return String(DATA.tekst.taethed_skabelon).replace('{a}', a).replace('{b}', feltAntalFor(robottype));
  }

  function fnote(tekst) {
    return '<abbr class="forbehold--skjult" title="' + esc(tekst) + '">'
      + '<span class="kunskaerm">' + esc(DATA.tekst.advarsel) + ': ' + esc(tekst) + '</span></abbr>';
  }

  function figurAf(v, min, maks, enhed) {
    if (min !== null && min !== undefined) return fmt(min) + '–' + fmt(maks);
    if (typeof v === 'number' && !enhed && v >= 1e6) return kortAntal(v);
    return typeof v === 'number' ? fmt(v) : String(v);
  }
  function kortAntal(n) {
    var m = n >= 1e9 ? [1e9, 'B'] : [1e6, 'M'];
    return fmt(Math.round(n / m[0] * 100) / 100) + m[1];
  }

  function vaerdiSpan(figur, enhed, nul, op) {
    return '<span class="v v-tal' + (nul ? ' v-nul' : '') + (String(figur).length >= 11 ? ' v-tal--lang' : '') + '">' + op
      + '<b class="num">' + esc(figur) + '</b>'
      + (enhed ? '<span class="enhed">' + esc(enhed) + '</span>' : '')
      + '</span>';
  }

  function omregnetHTML(f, imp) {
    if (imp.egen) return '<span class="kunskaerm">' + esc(DATA.tekst.imperial_forklaring || '') + '</span>';
    var kilde = (figurAf(f.vaerdi, f.min, f.maks) + ' ' + (f.enhed || '')).replace(/\s+$/, '');
    var forklaring = String(DATA.tekst.enhed_omregnet_forklaring || '').replace('{figur}', kilde);
    return '<span class="kunskaerm">' + esc(forklaring) + '</span>';
  }

  function renderTal(f) {
    var op = '';
    if (f.operator && DATA.operatorer[f.operator]) {
      var o = DATA.operatorer[f.operator];
      var opVis = o.kort
        ? '<span class="op__lang">' + esc(o.vis) + '</span><span class="op__kort">' + esc(o.kort) + '</span>'
        : esc(o.vis);
      op = '<span class="op" aria-hidden="true">' + opVis + '</span>'
        + '<span class="kunskaerm">' + esc(o.laest) + ' </span>';
    }
    var noter = [];
    if (f.ved_last) {
      if (f.ved_last.ukendt) noter.push(DATA.tekst.ved_last_ukendt);
      else noter.push((DATA.tekst.ved_last + ' ' + fmt(f.ved_last.vaerdi) + ' ' + (f.ved_last.enhed || '')).trim());
    }
    var noteHTML = noter.length ? fnote(noter.join(' · ')) : '';

    var metrisk = vaerdiSpan(figurAf(f.vaerdi, f.min, f.maks, f.enhed), f.enhed, f.tilstand === 'nul', op);
    if (f.kildeform) {
      var titel = String(DATA.tekst.kilde_original_form || '').replace('{figur}', f.kildeform);
      metrisk = '<span class="original-enhed" title="' + esc(titel) + '">' + metrisk + '</span>';
    }

    if (!f.imp) return metrisk + noteHTML;
    var imp = f.imp;
    var impFigur = figurAf(imp.vaerdi, imp.min, imp.maks);
    var imperial = vaerdiSpan(impFigur, imp.enhed, imp.vaerdi === 0, op) + omregnetHTML(f, imp);
    return '<span class="enhedsvis enhedsvis--metrisk">' + metrisk + '</span>'
      + '<span class="enhedsvis enhedsvis--imperial">' + imperial + '</span>'
      + noteHTML;
  }

  function kildemaerke(r, bogstav, sek, cav) {
    if (!bogstav) return '';
    var navn = String(DATA.tekst[sek ? 'kilde_navn_sekundaer' : 'kilde_navn_primaer'] || '').replace('{bogstav}', bogstav);
    var info = r.kilder && r.kilder[bogstav];
    var dato = info && info[1] && datoI(info[1]);
    var titel = info ? (dato ? String(DATA.tekst.kilde_maerke_titel).replace('{kilde}', info[0]).replace('{dato}', dato) : info[0])
      : (sek ? DATA.tekst.kilde_sek_forklaring : DATA.tekst.kilde_primaer);
    if (sek && info) titel = navn + ': ' + titel;
    var aria = dato ? String(DATA.tekst.kilde_maerke_navn).replace('{navn}', navn).replace('{kilde}', info[0]).replace('{dato}', dato)
      : info ? navn + ': ' + info[0] : navn;
    if (cav) aria = String(DATA.tekst.kilde_forbehold_navn).replace('{navn}', aria);
    return '⁠<button type="button" class="kildemaerke' + (sek ? ' kildemaerke--sek' : '') + (cav ? ' kildemaerke--cav' : '') + '" aria-expanded="false" data-slug="' + esc(r.slug)
      + '" data-bogstav="' + esc(bogstav) + '" aria-label="' + esc(aria) + '" title="' + esc(titel)
      + '">' + esc(bogstav) + (cav ? '*' : '') + '</button>';
  }

  var kildePanel = null;
  var kildeKnap = null;
  function lukKilde(fokus) {
    if (!kildePanel) return;
    var knap = kildeKnap;
    var gammel = kildePanel;
    if (gammel.parentNode) {
      gammel.removeAttribute('id');
      var rolig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
      var note = gammel.firstChild && gammel.firstChild.firstChild;
      if (rolig && note && note.classList) {
        note.classList.add('foldud--skjult');
        setTimeout(function () { if (gammel.parentNode) gammel.parentNode.removeChild(gammel); }, 180);
      } else gammel.parentNode.removeChild(gammel);
    }
    kildePanel = null;
    kildeKnap = null;
    knap.setAttribute('aria-expanded', 'false');
    knap.removeAttribute('aria-controls');
    if (fokus && document.body.contains(knap)) knap.focus();
  }
  function aabnKilde(knap) {
    var igen = knap === kildeKnap;
    lukKilde(false);
    var raekke = knap.closest('tr.saml-raekke');
    var r = robotAf(knap.getAttribute('data-slug'));
    if (igen || !raekke || !r) return;
    var feltNavn = raekke.getAttribute('data-felt');
    var f = r.felter[feltNavn] || {};
    var bogstav = knap.getAttribute('data-bogstav');
    var info = r.kilder && r.kilder[bogstav];
    var T = DATA.tekst;
    var ord = raekke.querySelector('.saml-raekke__ord');
    var html = '<b class="nt-h">' + esc(fyld(T.kilde_titel, { felt: (ord ? ord.textContent : feltNavn) + ' · ' + r.navn })) + '</b>';
    if (info) {
      html += '<span class="nt nt--src"><b>' + esc(bogstav) + '</b> ' + (info[2] || esc(info[0]))
        + (info[1] ? ' · ' + esc(T.hentet) + ' ' + esc(datoI(info[1])) : '') + '</span>';
    }
    var K = DATA.prisKurs;
    if (f.kildeform && f.eb) html += '<span class="nt nt--src"><b>' + esc(f.eb) + '</b> ' + K.adr + ' · ' + esc(T.hentet) + ' ' + esc(datoI(K.hentet)) + '</span>';
    if (f.forbehold) html += '<span class="nt"><b>' + esc(f.gy ? T.forbehold_navn : T.note_navn) + '.</b> ' + (f.fh || esc(f.forbehold)) + '</span>';
    if (f.nt) html += '<span class="nt"><b>' + esc(T.note_navn) + '.</b> ' + esc(f.nt) + '</span>';
    if (f.kildeform) html += '<span class="nt">' + esc(fyld(T.pris_forklaring, K)) + '</span>';
    html += '<button type="button" class="nx" aria-label="' + esc(T.kilde_luk) + '">×</button>';
    var tr = document.createElement('tr');
    tr.className = 'saml-kilde';
    tr.id = 'saml-kilde-panel';
    var td = document.createElement('td');
    td.colSpan = raekke.children.length;
    td.innerHTML = '<div class="r__note foldud">' + html + '</div>';
    tr.appendChild(td);
    raekke.parentNode.insertBefore(tr, raekke.nextSibling);
    kildePanel = tr;
    kildeKnap = knap;
    knap.setAttribute('aria-expanded', 'true');
    knap.setAttribute('aria-controls', tr.id);
  }

  function renderFelt(f, r, feltNavn) {
    if (!f) f = { tilstand: 'ikke_oplyst' };
    var ud0 = renderFeltUdenKilde(f, r);
    if (!r || f.tilstand === 'ikke_oplyst') return ud0;
    return ud0 + kildemaerke(r, f.kb, f.ks, !!f.forbehold);
  }

  var FOLD_TEGN = 60;
  function foldHTML() {
    return '<input type="checkbox" class="foldmere" aria-label="' + esc(DATA.tekst.fold_label) + '" data-mere="' + esc(DATA.tekst.fold_mere)
      + '" data-mindre="' + esc(DATA.tekst.fold_mindre) + '">';
  }

  function renderFeltUdenKilde(f, r) {
    switch (f.tilstand) {
      case 'nej':
        return '<span class="v v-nej"><i class="mrk"></i>' + esc(f.nejTekst || DATA.tekst.nej) + '</span>';
      case 'ja':
        return '<span class="v v-ja"><i class="mrk"></i>' + esc(DATA.tekst.ja) + '</span>';
      case 'kun_billede':
        return '<span class="v v-billede"><i class="mrk"></i><span class="ord">' + esc(DATA.tekst.kun_billede) + '</span></span>';
      case 'tekst': {
        if (f.ver) return '<span class="v v-tekst"><a class="ret-ver" href="' + esc(f.ver) + '">' + esc(f.tekst) + '</a></span>';
        var ud = '<span class="v v-tekst">' + esc(f.tekst) + '</span>';
        if (f.links) {
          ud = '<span class="v v-tekst">' + f.links.map(function (l) {
            return '<a href="' + esc(l[1]) + '">' + esc(l[0]) + '</a>' + (r ? kildemaerke(r, l[2]) : '');
          }).join(', ') + '</span>';
        }
        if (f.min !== null && f.min !== undefined) {
          ud += ' ' + renderTal({ tilstand: 'tal', vaerdi: null, min: f.min, maks: f.maks, enhed: f.enhed, operator: null, imp: f.imp });
        }
        if (!f.links && (f.min === null || f.min === undefined) && String(f.tekst).length > FOLD_TEGN) ud += foldHTML();
        return ud;
      }
      case 'tal':
      case 'nul':
        return renderTal(f);
      case 'ikke_oplyst':
      default:
        return '<span class="v v-ikke"><i class="mrk"></i><span class="v-ikke__ord">' + esc(DATA.tekst.ikke_oplyst) + '</span></span>';
    }
  }

  var CAPTION_ID = 'saml-tabel-caption';

  // Samme id som sammenligning.mjs, robot.mjs og enhed.js (test 44 holder dem sammen).
  var ENHED_ID = 'enhedsskift';
  var enhedsBoks = document.getElementById(ENHED_ID);
  var sidsteOmregnelige = 0;

  function fotofeltHTML(r, lazy) {
    if (r.klasse === 'ai_model') return '';
    var f = r.foto;
    var staaende = r.klasse === 'humanoid';
    var kl = 'saml-fotofelt' + (staaende ? ' saml-fotofelt--staaende' : '');
    if (!f) {
      return '<span class="' + kl + ' saml-fotofelt--uoplyst"><span class="intetfoto">'
        + '<span class="plade" aria-hidden="true"></span>'
        + '<span class="saml-fotofelt__ord">' + esc(DATA.tekst.billede_intet) + '</span></span></span>';
    }
    var kilder = '';
    for (var i = 0; i < (f.kilder || []).length; i++) {
      kilder += '<source srcset="' + esc(f.kilder[i][0]) + '" type="' + esc(f.kilder[i][1]) + '">';
    }
    return '<span class="' + kl + '"><picture>' + kilder
      + '<img src="' + esc(f.src) + '" alt="' + esc(f.alt || '') + '"'
      + (staaende ? ' width="56" height="74"' : ' width="74" height="56"')
      + (lazy ? ' loading="lazy"' : '') + ' decoding="async"></picture></span>';
  }

  // Tredje kolonne er skjult under 900 px; uden lazy hentes dens foto alligevel.
  function fotoLinkHTML(r, lazy) {
    var foto = fotofeltHTML(r, lazy);
    return foto ? '<a class="saml-fotolink" href="' + esc(r.url) + '" tabindex="-1" aria-hidden="true">' + foto + '</a>' : '';
  }

  function forsteOrd(s) { return String(s).split(' ')[0]; }
  function erDup(robotter, r) {
    return robotter.filter(function (x) { return x.navn === r.navn; }).length > 1;
  }
  function visNavn(robotter, r) { return erDup(robotter, r) ? forsteOrd(r.producent) + ' ' + r.navn : r.navn; }
  function fjernNavn(robotter, r) {
    return String(DATA.tekst.fjern_navn || '').replace('{navn}', erDup(robotter, r) ? r.navn + ' (' + r.producent + ')' : r.navn);
  }
  function kol3(i) { return i === 2 ? ' ret-kol3' : ''; }
  function aiBilledeHTML(b) {
    return '<span class="ret-aibillede"><img src="' + esc(b.src) + '" alt="' + esc(b.alt) + '">'
      + (b.mrk ? '<span class="kort__mrk" aria-hidden="true">' + esc(b.mrk) + '</span>' : '') + '</span>';
  }
  function pladsHTML(ord) {
    return '<a class="ret-plats" href="' + esc(klasseKatalogUrl()) + '" data-saml-knap><span class="ret-plats__plus" aria-hidden="true"></span>'
      + '<span>' + esc(fyld(NYT.plads, { noun: ord })) + '</span></a>';
  }

  function specimenHoved(robotter, n, plads) {
    var celler = robotter.map(function (r, i) {
      return '<th scope="col" role="columnheader" class="specimen' + kol3(i) + '">' + '<span class="specimen__ramme">'
        + '<span class="specimen__top">' + (r.aiBillede ? aiBilledeHTML(r.aiBillede) : '') + fotoLinkHTML(r, i === 2)
        + '<span class="specimen__id">'
        + (r.typeMrk ? '<span class="kort__mrk kort__mrk--moerk">' + esc(r.typeMrk) + '</span>' : '')
        + '<span class="specimen__navn"><a href="' + esc(r.url) + '">' + esc(visNavn(robotter, r)) + '</a></span>'
        + '<span class="specimen__meta">' + esc(r.producent) + '</span>'
        + (r.modeltyper ? '<span class="kort__modeltype"><span class="kunskaerm">' + esc(DATA.feltNavne.modeltype) + ': </span>'
          + r.modeltyper.map(function (v) { return '<span class="kort__mrk kort__mrk--moerk">' + esc(v) + '</span>'; }).join('') + '</span>' : '')
        + '</span></span>'
        + '<span class="specimen__fod">'
        + '<span class="specimen__taethed figur">'
        + '<span class="specimen__taethed-lang" aria-hidden="true">' + esc(taethedTekst(r.taethedAntal, r.robottype)) + '</span>'
        + '<span class="specimen__taethed-kort" aria-hidden="true">' + esc(String(DATA.tekst.taethed_kort || '').replace('{a}', r.taethedAntal).replace('{b}', feltAntalFor(r.robottype))) + '</span>'
        + '<span class="kunskaerm">' + esc(taethedTekst(r.taethedAntal, r.robottype)) + '</span>'
        + '</span>'
        + '<button type="button" class="specimen__fjern knap knap--kant-moerk" data-saml-fjern="' + esc(r.slug) + '">'
        + '<span class="specimen__fjern-ord" aria-hidden="true">' + esc(DATA.tekst.fjern_kort || '') + '</span>'
        + '<span class="specimen__fjern-tegn" aria-hidden="true">' + esc(DATA.tekst.fjern_tegn || '') + '</span>'
        + '<span class="kunskaerm">' + esc(fjernNavn(robotter, r)) + '</span>'
        + '</button>'
        + '</span></span>'
        + '</th>';
    });
    return '<thead class="specimen-hoved" role="rowgroup">'
      + '<tr class="specimen-hoved__raekke" role="row">'
      + '<td class="specimen-hoved__hjoerne" role="cell"></td>'
      + medGhost(celler, '<th scope="col" role="columnheader" class="specimen specimen--fjernet"><span class="specimen__fod">' + fortrydHTML() + '</span></th>').join('')
      + (plads ? '<th scope="col" class="ret-ny3h">' + pladsHTML(plads) + '</th>' : '')
      + '</tr></thead>';
  }

  function bjaelkeHTML(robotter) {
    return '<div class="saml-bjaelke">'
      + '<span class="saml-bjaelke__hjoerne">' + esc(DATA.tekst.alle_felter) + '</span>'
      + medGhost(robotter.map(function (r, i) {
        return '<span class="saml-bjaelke__celle' + kol3(i) + '">'
          + '<span class="saml-bjaelke__navn"' + (erDup(robotter, r) ? '' : ' title="' + esc(r.navn) + '"') + '><a href="' + esc(r.url) + '">' + esc(visNavn(robotter, r)) + '</a></span>'
          + '<button type="button" class="saml-bjaelke__fjern knap knap--kant-moerk" data-saml-fjern="' + esc(r.slug) + '">'
          + '<span aria-hidden="true">' + esc(DATA.tekst.fjern_tegn || '') + '</span>'
          + '<span class="kunskaerm">' + esc(fjernNavn(robotter, r)) + '</span>'
          + '</button></span>';
      }), '<span class="saml-bjaelke__celle"></span>').join('')
      + '<a class="til-top" href="#top" aria-label="' + esc(DATA.tekst.til_top) + '"><span aria-hidden="true">↑</span></a>'
      + '</div>';
  }

  function feltNaevnerTekst(robotter) {
    var b0 = feltAntalFor(robotter[0] && robotter[0].robottype);
    var blandet = robotter.some(function (x) { return feltAntalFor(x.robottype) !== b0; });
    return String((blandet ? DATA.tekst.felter_naevner_blandet : DATA.tekst.felter_naevner) || "").replace("{b}", b0);
  }

  function svarHTML(robotter, feltNavn) {
    var svarer = 0;
    for (var i = 0; i < robotter.length; i++) {
      var f = robotter[i].felter[feltNavn];
      if (f && f.tilstand !== 'ikke_oplyst' && !f.ingen) svarer++;
    }
    var taelling = String(DATA.tekst.svar_taeller || '')
      .replace('{a}', svarer).replace('{b}', robotter.length);
    return {
      svarer: svarer,
      html: '<span class="kunskaerm">' + esc(taelling) + '</span>',
    };
  }

  function fotoCelleTekst(r, f) {
    var hentet = f.hentet ? ' (' + DATA.tekst.hentet + ' ' + datoI(f.hentet) + ')' : '';
    if (f.vist === 'fri_licens') {
      var note = String(f.note || '');
      var mark = 'Wikimedia Commons';
      var i = note.indexOf(mark);
      var link = function (t) {
        return '<a href="' + esc(f.kilde) + '" rel="nofollow noopener external">' + esc(t) + '</a>';
      };
      if (!f.kilde) return esc(note);
      return i < 0 ? link(note)
        : esc(note.slice(0, i)) + link(mark) + esc(note.slice(i + mark.length));
    }
    if (f.vist === 'forhandler') {
      var m = /\(([^)]+)\)/.exec(String(f.note || ''));
      return esc(DATA.tekst.foto_forhandler + (m ? ', ' + m[1] : '') + hentet);
    }
    return esc(r.producent + hentet);
  }

  function fotoFodHTML(robotter, plads) {
    var harKredit = false;
    var celler = robotter.map(function (r, i) {
      var f = r.foto;
      if (!f || !f.vist) {
        return '<td class="saml-fotofod__celle' + kol3(i) + '" role="cell"></td>';
      }
      harKredit = true;
      return '<td class="saml-fotofod__celle' + kol3(i) + '" role="cell">' + fotoCelleTekst(r, f) + '</td>';
    });
    if (!harKredit) return '';
    return '<tfoot class="saml-fotofod" role="rowgroup">'
      + '<tr class="saml-fotofod__raekke" role="row">'
      + '<td class="saml-fotofod__hjoerne" role="cell">' + esc(DATA.tekst.foto_kreditter) + '</td>'
      + medGhost(celler, '<td class="saml-fotofod__celle" role="cell"></td>').join('')
      + (plads ? '<td class="ret-ny3" role="cell"></td>' : '')
      + '</tr></tfoot>';
  }

  function omregneligeAntal(robotter) {
    var n = 0;
    for (var i = 0; i < robotter.length; i++) {
      var felter = robotter[i].felter;
      for (var navn in felter) {
        if (Object.prototype.hasOwnProperty.call(felter, navn) && felter[navn] && felter[navn].imp) n++;
      }
    }
    return n;
  }

  function enhedslinjeHTML() {
    return '<div class="saml-enhedslinje">'
      + '<label class="enhedsskift" for="' + ENHED_ID + '">'
      + '<span class="enhedsskift__spor" aria-hidden="true"><span class="enhedsskift__knop"></span></span>'
      + '<span class="enhedsskift__ord">' + esc(DATA.tekst.enhed_skift_etiket || '') + '</span></label>'
      + '<p class="t-mikro maal enhedsnote">' + esc(DATA.tekst.enhed_skift_forklaring || '') + '</p>'
      + '</div>';
  }

  function invitationHTML(fyldt, hold, tekst) {
    if (!DATA.katalogUrl) return '';
    return '<p class="saml-invit' + (hold ? ' saml-invit--hold" aria-hidden="true"' : '"') + '><a' + (hold ? ' tabindex="-1"' : '') + ' class="saml-invit__link knap ' + (fyldt ? 'knap--fyldt' : 'knap--kant') + '" href="'
      + esc(klasseKatalogUrl()) + '" data-saml-knap>'
      + esc(tekst || DATA.tekst.vaelg_titel || '') + '</a></p>';
  }

  function soegErEt(navn) {
    return new RegExp('[?&]' + navn + '=1(&|$)').test((window.location && window.location.search) || '');
  }
  function skrivSoeg(navn, aktiv) {
    try {
      var del = ((window.location.search || '').replace('?', '')).split('&').filter(function (x) { return x && x.split('=')[0] !== navn; });
      if (aktiv) del.push(navn + '=1');
      window.history.replaceState(null, '', window.location.pathname + (del.length ? '?' + del.join('&') : '') + (window.location.hash || ''));
    } catch (e) {}
  }
  var diffAktiv = soegErEt('diff');
  var skjulTomme = soegErEt('tomme');

  function oplyste(felter) {
    return (felter || []).filter(function (f) { return f && f.tilstand !== 'ikke_oplyst'; });
  }
  function erFeltEns(felter) {
    felter = oplyste(felter);
    if (felter.length <= 1) return true;
    function norm(f) {
      if (f.tilstand === 'nej') return 'nej';
      if (f.tilstand === 'ja') return 'ja';
      if (f.tilstand === 'kun_billede') return 'billede';
      if (f.tilstand === 'nul') return '0';
      if (f.tilstand === 'tekst') return 'txt:' + f.tekst;
      if (f.min != null && f.maks != null) {
        return 'int:' + f.min + '-' + f.maks + ':' + (f.enhed || '');
      }
      return 'v:' + f.vaerdi + ':' + (f.enhed || '') + ':' + (f.operator || '');
    }
    var foerste = norm(felter[0]);
    for (var i = 1; i < felter.length; i++) {
      if (norm(felter[i]) !== foerste) return false;
    }
    return true;
  }

  function diffKnapHTML(antalForskelle) {
    var taellerTekst = antalForskelle > 0 ? ' (' + antalForskelle + ')' : '';
    return '<button type="button" class="saml-diff-knap knap knap--kant'
      + (diffAktiv ? ' saml-diff-knap--aktiv' : '')
      + '" data-saml-diff aria-pressed="' + (diffAktiv ? 'true' : 'false') + '">'
      + '<span class="saml-diff-knap__ikon" aria-hidden="true">±</span> '
      + '<span class="saml-diff-knap__tekst">' + esc(DATA.tekst.diff_knap || 'Highlight differences') + '</span>'
      + '<span class="saml-diff-knap__kort">' + esc(DATA.tekst.diff_knap_kort) + '</span>'
      + '<span class="saml-diff-knap__taeller figur">' + esc(taellerTekst) + '</span>'
      + '</button>';
  }

  function toggleDiff() {
    diffAktiv = !diffAktiv;
    skrivSoeg('diff', diffAktiv);
    var tabel = resultat.querySelector('.saml-matrix');
    var knap = resultat.querySelector('[data-saml-diff]');
    if (tabel && knap && tabel.classList) {
      if (diffAktiv) {
        tabel.classList.add('saml-matrix--diff');
        knap.classList.add('saml-diff-knap--aktiv');
        knap.setAttribute('aria-pressed', 'true');
      } else {
        tabel.classList.remove('saml-matrix--diff');
        knap.classList.remove('saml-diff-knap--aktiv');
        knap.setAttribute('aria-pressed', 'false');
      }
    } else {
      opdater();
    }
  }

  function tommeKnapHTML(antal) {
    if (!antal) return '';
    return '<button type="button" class="saml-diff-knap saml-tomme-knap knap knap--kant'
      + (skjulTomme ? ' saml-diff-knap--aktiv' : '')
      + '" data-saml-tomme aria-pressed="' + (skjulTomme ? 'true' : 'false') + '">'
      + '<span class="saml-diff-knap__tekst">' + esc(DATA.tekst.tomme_knap) + '</span>'
      + '<span class="saml-diff-knap__kort">' + esc(DATA.tekst.tomme_knap_kort) + '</span>'
      + '<span class="saml-diff-knap__taeller figur"> (' + antal + ')</span>'
      + '</button>';
  }

  function toggleTomme() {
    skjulTomme = !skjulTomme;
    skrivSoeg('tomme', skjulTomme);
    var tabel = resultat.querySelector('.saml-matrix');
    var knap = resultat.querySelector('[data-saml-tomme]');
    if (!tabel || !knap || !tabel.classList) { opdater(); return; }
    var raekker = Array.prototype.slice.call(tabel.querySelectorAll('tbody tr'));
    var foer = raekker.map(function (r) { return r.getClientRects().length ? r.getBoundingClientRect().top : null; });
    tabel.classList[skjulTomme ? 'add' : 'remove']('saml-matrix--skjul-tomme');
    if (window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var rod = getComputedStyle(document.documentElement);
      var tidTekst = rod.getPropertyValue('--tid').trim();
      var tid = parseFloat(tidTekst) * (/ms$/.test(tidTekst) ? 1 : 1000) || 420;
      var slyng = rod.getPropertyValue('--slyng').trim() || 'ease-out';
      raekker.forEach(function (r, i) {
        if (foer[i] === null || !r.animate || !r.getClientRects().length) return;
        var dy = foer[i] - r.getBoundingClientRect().top;
        if (Math.abs(dy) < 0.5) return;
        r.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: tid, easing: slyng });
      });
    }
    knap.classList[skjulTomme ? 'add' : 'remove']('saml-diff-knap--aktiv');
    knap.setAttribute('aria-pressed', skjulTomme ? 'true' : 'false');
    sikrTabstop();
  }

  function synligeNavne() {
    return Array.prototype.filter.call(resultat.querySelectorAll('.saml-raekke__navn'), function (el) {
      return el.getClientRects().length > 0;
    });
  }
  function saetTabstop(el) {
    var alle = resultat.querySelectorAll('.saml-raekke__navn');
    for (var i = 0; i < alle.length; i++) alle[i].setAttribute('tabindex', alle[i] === el ? '0' : '-1');
  }
  function sikrTabstop() {
    var syn = synligeNavne();
    if (syn.length && syn.indexOf(resultat.querySelector('.saml-raekke__navn[tabindex="0"]')) < 0) saetTabstop(syn[0]);
  }

  function tabelHTML(slugs) {
    var robotter = slugs.map(robotAf).filter(Boolean);
    kildePanel = null;
    kildeKnap = null;
    var n = robotter.length;
    var eksempel = slugs === DATA.standard;
    if (!n) return '';
    var plads = n === 2 && DATA.maksAntal > 2 && !fortryd ? klasseOrd('ent') : '';
    var spalter = n + 1 + (fortryd ? 1 : 0) + (plads ? 1 : 0);

    var delType = robotter[0].robottype;
    var etiketOverride = (DATA.feltEtiketOverride && DATA.feltEtiketOverride[delType]) || {};
    function feltEtiket(feltNavn) {
      return etiketOverride[feltNavn] !== undefined ? etiketOverride[feltNavn] : DATA.feltNavne[feltNavn];
    }

    function raekkeProducent(r) {
      var foerste = String(r.producent).split(' ')[0].toLowerCase();
      return String(r.navn).toLowerCase().indexOf(foerste) === 0 ? '' : r.producent;
    }

    function gaelder(r, feltNavn) {
      var pr = (DATA.ikkeGaelderPrType && DATA.ikkeGaelderPrType[r.robottype]) || [];
      return pr.indexOf(feltNavn) === -1;
    }
    var antalForskelle = 0;
    var antalTomme = 0;
    var foersteRaekke = true;
    var grupperHTML = DATA.grupper.map(function (g) {
      var synligeFelter = g.felter.filter(function (feltNavn) { return robotter.every(function (r) { return gaelder(r, feltNavn); }); });
      if (!synligeFelter.length) return '';
      var tomIGruppen = 0;
      var raekker = synligeFelter.map(function (feltNavn) {
        var svar = svarHTML(robotter, feltNavn);
        var felter = robotter.map(function (r) { return r.felter[feltNavn]; });
        var ens = erFeltEns(felter);
        if (!ens) antalForskelle++;

        var mangler = oplyste(felter).length > 0 && oplyste(felter).length < felter.length;
        var celler = robotter.map(function (r, i) {
          var f = r.felter[feltNavn];
          var tavs = !f || f.tilstand === 'ikke_oplyst' || !!f.ingen;
          return '<td class="saml-raekke__celle' + (tavs ? ' saml-raekke__celle--tavs' : '') + kol3(i)
            + '" role="cell" data-robot="' + esc(r.navn) + '" data-producent="' + esc(raekkeProducent(r)) + '">'
            + renderFelt(f, r, feltNavn) + '</td>';
        });
        var tavsRaekke = svar.svarer === 0 ? ' saml-raekke--tavs' : '';
        if (svar.svarer === 0) { antalTomme++; tomIGruppen++; }
        var diffKlasse = (ens ? ' saml-raekke--ens' : ' saml-raekke--forskel') + (mangler ? ' ret-mangler' : '');
        // Fjern ikke rækkenavnenes tab-stop: rækkerne skal kunne nås med tastatur.
        var tabAt = foersteRaekke ? '0' : '-1';
        foersteRaekke = false;
        return '<tr class="saml-raekke' + tavsRaekke + diffKlasse + '" role="row" data-felt="' + esc(feltNavn) + '">'
          + '<th scope="row" role="rowheader" tabindex="' + tabAt + '" class="saml-raekke__navn">'
          + '<span class="saml-raekke__ord">' + esc(feltEtiket(feltNavn)) + '</span>'
          + svar.html + '</th>' + medGhost(celler, '<td class="saml-raekke__celle saml-raekke__celle--fjernet" role="cell"></td>').join('')
          + (plads ? '<td class="ret-ny3" role="cell"></td>' : '') + '</tr>';
      }).join('');
      return '<tbody class="saml-gruppe' + (tomIGruppen === synligeFelter.length ? ' saml-gruppe--tom' : '') + '" role="rowgroup">'
        + '<tr class="saml-gruppe__titelraekke" role="row">'
        + '<th scope="rowgroup" role="rowheader" colspan="' + spalter + '" class="saml-gruppe__titel">'
        + esc(g.titel) + '</th></tr>'
        + raekker + '</tbody>';
    }).join('');

    var navne = robotter.map(function (r) { return r.navn; }).join(', ');
    var caption = String(DATA.tekst.tabel_caption || '').replace('{robotter}', navne);

    sidsteOmregnelige = omregneligeAntal(robotter);

    var vaerktoejHTML = '<div class="saml-vaerktoej">'
      + invitationHTML(eksempel, n >= DATA.maksAntal && !eksempel, !eksempel && !(DATA.klasseTekst && DATA.klasseTekst[aktivKlasse]) && klasseOrd('flt') ? fyld(NYT.vaelg_knap, { noun: klasseOrd('flt') }) : '')
      + '<span class="saml-vaerktoej__knapper">' + diffKnapHTML(antalForskelle) + tommeKnapHTML(antalTomme) + '</span>'
      + '</div>';

    var matrixStart = '<table class="saml-matrix' + (diffAktiv ? ' saml-matrix--diff' : '') + (skjulTomme ? ' saml-matrix--skjul-tomme' : '')
      + '" role="table" aria-labelledby="' + CAPTION_ID + '">';

    return vaerktoejHTML
      + (sidsteOmregnelige ? enhedslinjeHTML() : '')
      + matrixStart
      + '<caption id="' + CAPTION_ID + '" class="kunskaerm">' + esc(caption) + '</caption>'
      + specimenHoved(robotter, n, plads) + grupperHTML + fotoFodHTML(robotter, plads)
      + '</table>' + bjaelkeHTML(robotter);
  }

  var fortryd = null;
  function medGhost(liste, ghostCelle) {
    if (!fortryd) return liste;
    var kopi = liste.slice();
    kopi.splice(Math.min(fortryd.indeks, liste.length), 0, ghostCelle);
    return kopi;
  }

  var status = app.querySelector('[data-saml-status]') || document.querySelector('[data-saml-status]');
  var resultat = app.querySelector('[data-saml-resultat]');
  var fod = app.querySelector('.saml-fod');
  var noegle = app.querySelector('.saml-noegle');
  if (!status || !resultat) return;

  var live = document.createElement('p');
  live.className = 'kunskaerm';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  if (status.parentNode && status.parentNode.insertBefore) status.parentNode.insertBefore(live, status.nextSibling);

  function visStatus(tekst) {
    status.hidden = false;
    status.textContent = tekst;
  }
  function visStatusHTML(html) {
    if (html.indexOf('<') < 0) {
      visStatus(html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'));
      return;
    }
    status.hidden = false;
    status.innerHTML = html;
  }

  function hashBeskedHTML(udenAndre) {
    var T = DATA.tekst;
    var dele = [];
    if (hashUkendt) dele.push(esc(String(hashUkendt === 1 ? T.hash_tabt : T.hash_tabt_flere).replace('{n}', hashUkendt)));
    if (hashLoft.length) dele.push(esc(String(T.hash_loft).replace('{max}', DATA.maksAntal).replace('{navne}', hashLoft.join(', '))));
    var nuKlasse = (DATA.klasseNavne && DATA.klasseNavne[aktivKlasse]) || aktivKlasse;
    for (var i = 0; !udenAndre && i < hashAnden.length; i++) {
      var r = hashAnden[i];
      var egen = (DATA.klasseNavne && DATA.klasseNavne[r.klasse]) || r.klasse;
      dele.push(esc(String(T.hash_klasse).replace('{navn}', r.navn).replace('{klasse}', egen).replace('{nu}', nuKlasse))
        + ' <a href="' + esc((window.location.pathname || '') + '#' + r.slug) + '">'
        + esc(String(r.klasse === 'ai_model' ? T.hash_link_ai : T.hash_link).replace('{navn}', r.navn)) + '</a>');
    }
    return dele.join(' ');
  }
  function skjulStatus() {
    status.hidden = true;
    status.textContent = '';
  }

  function opdaterKontakt() {
    if (enhedsBoks) enhedsBoks.hidden = !sidsteOmregnelige;
    var enhedFod = app.querySelector('[data-saml-enhed]');
    if (enhedFod) enhedFod.hidden = !sidsteOmregnelige;
  }

  var SAML_NOEGLE = 'quad-sammenligning';

  var KLASSER = DATA.klasser || [];
  var aktivKlasse = null;
  function klasseAfSlug(slug) {
    var r = robotAf(slug);
    return r ? r.klasse : null;
  }
  function laesGemt(klasse, kendte) {
    var brug = [];
    try {
      var raa = window.localStorage.getItem(SAML_NOEGLE + ':' + klasse);
      if (raa) {
        var gemt = JSON.parse(raa);
        if (Object.prototype.toString.call(gemt) === '[object Array]') {
          for (var j = 0; j < gemt.length && brug.length < DATA.maksAntal; j++) {
            var v = gemt[j];
            if (typeof v === 'string' && kendte[v] && brug.indexOf(v) < 0
              && klasseAfSlug(v) === klasse) brug.push(v);
          }
        }
      }
    } catch (e) {}
    return brug;
  }
  function erTomtGemt(klasse) {
    try { return window.localStorage.getItem(SAML_NOEGLE + ':' + klasse) === '[]'; } catch (e) { return false; }
  }
  var hashTabt = 0;
  var hashUkendt = 0;
  var hashLoft = [];
  var hashAnden = [];
  function udvalgtSlugs() {
    hashTabt = 0; hashUkendt = 0; hashLoft = []; hashAnden = [];
    var kendte = {};
    for (var i = 0; i < DATA.robotter.length; i++) kendte[DATA.robotter[i].slug] = true;
    var brug = [];

    try {
      if (typeof window !== 'undefined' && window.location && window.location.hash) {
        var hash = window.location.hash.replace(/^#/, '');
        if (hash.indexOf('r=') === 0 || hash.indexOf('robotter=') === 0) {
          hash = hash.split('=')[1] || '';
        }
        var dele = hash.split(/[,+]/);
        for (var k = 0; k < dele.length; k++) {
          var s = decodeURIComponent(dele[k].trim());
          if (!s || brug.indexOf(s) >= 0) continue;
          if (!kendte[s]) { hashTabt++; hashUkendt++; continue; }
          if (brug.length >= DATA.maksAntal) { hashTabt++; hashLoft.push(robotAf(s).navn); continue; }
          if (aktivKlasse === null) aktivKlasse = klasseAfSlug(s);
          if (klasseAfSlug(s) === aktivKlasse) brug.push(s); else { hashTabt++; hashAnden.push(robotAf(s)); }
        }
        if (brug.length) return brug;
      }
    } catch (eHash) {}

    if (aktivKlasse === null) {
      for (var kk = 0; kk < KLASSER.length; kk++) {
        brug = laesGemt(KLASSER[kk], kendte);
        if (brug.length) { aktivKlasse = KLASSER[kk]; return brug; }
      }
      aktivKlasse = KLASSER[0] || null;
      return erTomtGemt(aktivKlasse) ? [] : DATA.standard;
    }
    brug = laesGemt(aktivKlasse, kendte);
    if (brug.length) return brug;
    return aktivKlasse === KLASSER[0] && !erTomtGemt(aktivKlasse) ? DATA.standard : [];
  }

  function klasseKatalogUrl() {
    if (!DATA.katalogUrl) return '';
    return KLASSER.length > 1 && aktivKlasse && DATA.klasseUrl && DATA.klasseUrl[aktivKlasse] ? DATA.klasseUrl[aktivKlasse] : DATA.katalogUrl;
  }
  var standardTekst = null;
  function tegnKlasse() {
    if (!aktivKlasse) return;
    var retur = document.querySelector('[data-saml-retur]');
    if (retur) {
      retur.setAttribute('href', klasseKatalogUrl());
      retur.textContent = (DATA.brodNavne && DATA.brodNavne[aktivKlasse]) || aktivKlasse;
    }
    var h = document.querySelector('[data-saml-titel]');
    var l = document.querySelector('[data-saml-lede]');
    if (!standardTekst) {
      standardTekst = {
        titel: h ? h.textContent : '', lede: l ? l.textContent : '', dok: String(document.title || ''),
        vaelg_titel: DATA.tekst.vaelg_titel, for_faa: DATA.tekst.for_faa,
        felter_naevner: DATA.tekst.felter_naevner,
      };
    }
    var kt = (DATA.klasseTekst && DATA.klasseTekst[aktivKlasse]) || standardTekst;
    var sted = standardTekst.dok.indexOf(' · ') >= 0 ? standardTekst.dok.slice(standardTekst.dok.indexOf(' · ')) : '';
    if (h) h.textContent = kt.titel;
    if (l) l.textContent = kt.lede;
    document.title = kt === standardTekst ? standardTekst.dok : kt.titel + sted;
    DATA.tekst.vaelg_titel = kt.vaelg_titel;
    DATA.tekst.for_faa = kt.for_faa;
    DATA.tekst.felter_naevner = kt.felter_naevner || standardTekst.felter_naevner;
    var punkter = document.querySelectorAll('.daek__nav a[data-klasse]');
    for (var p = 0; p < punkter.length; p++) {
      if (punkter[p].getAttribute('data-klasse') === aktivKlasse) punkter[p].setAttribute('aria-current', 'true');
      else punkter[p].removeAttribute('aria-current');
    }
  }

  function gemUdvalg(liste) {
    try { window.localStorage.setItem(SAML_NOEGLE + ':' + aktivKlasse, JSON.stringify(liste)); } catch (e) {}
    try {
      if (typeof window !== 'undefined' && window.history && window.history.replaceState && window.location) {
        var nytHash = liste && liste.length ? '#' + liste.join(',') : '';
        var nyUrl = (window.location.pathname || '') + (window.location.search || '') + nytHash;
        window.history.replaceState(null, '', nyUrl);
      }
    } catch (eHash) {}
  }

  function fortrydTekst() {
    return fortryd ? String(DATA.tekst.fortryd_fjernet).replace('{navn}', fortryd.navn) : '';
  }
  function fortrydHTML() {
    if (!fortryd) return '';
    return '<span class="saml-fortryd-tekst">' + esc(fortrydTekst()) + '</span>'
      + ' <button type="button" class="saml-fortryd knap knap--kant-moerk" data-saml-fortryd>' + esc(DATA.tekst.fortryd_knap) + '</button>';
  }
  function fjernSlug(slug) {
    var nu = udvalgtSlugs();
    var rest = [];
    for (var i = 0; i < nu.length; i++) if (nu[i] !== slug) rest.push(nu[i]);
    if (rest.length === nu.length) return;
    var r = robotAf(slug);
    fortryd = { slug: slug, navn: r ? r.navn : slug, indeks: nu.indexOf(slug) };
    gemUdvalg(rest);
    opdater();
  }
  function fortrydFjern() {
    if (!fortryd) return;
    var f = fortryd;
    fortryd = null;
    var nu = udvalgtSlugs();
    if (nu === DATA.standard) nu = [];
    if (nu.indexOf(f.slug) < 0 && nu.length < DATA.maksAntal && klasseAfSlug(f.slug) === aktivKlasse) {
      nu.splice(Math.min(f.indeks, nu.length), 0, f.slug);
      gemUdvalg(nu);
    }
    opdater();
    var knap = resultat.querySelector('[data-saml-fjern="' + f.slug + '"]');
    if (knap && typeof knap.focus === 'function') knap.focus({ preventScroll: true });
  }

  function maalFold() {
    var knapper = resultat.querySelectorAll('.foldmere');
    for (var i = 0; i < knapper.length; i++) {
      var k = knapper[i];
      var tekst = k.previousElementSibling;
      var klippet = k.checked || !tekst || tekst.scrollHeight > tekst.clientHeight + 1;
      k.classList[klippet ? 'remove' : 'add']('foldmere--ingen');
    }
  }
  function maalFoldSenere() {
    maalFold();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(maalFold);
  }

  var ledeOrig = null;
  var gemtEl = document.querySelector('[data-saml-gemt]');
  var flereEl = document.querySelector('[data-saml-flere]');
  var alleFelterEl = document.querySelector('[data-saml-allefelter] span');

  function klasseOrd(form) {
    var k = aktivKlasse && NY.klasser[aktivKlasse];
    return k ? k[form] : '';
  }
  function saetLede(el, desktop, mobil) {
    if (mobil) el.innerHTML = '<span class="ret-d">' + esc(desktop) + '</span><span class="ret-m">' + esc(mobil) + '</span>';
    else el.textContent = desktop;
  }
  function andreGemt() {
    var kendte = {};
    for (var i = 0; i < DATA.robotter.length; i++) kendte[DATA.robotter[i].slug] = true;
    var ud = [];
    for (var k = 0; k < KLASSER.length; k++) {
      var l = KLASSER[k] === aktivKlasse ? [] : laesGemt(KLASSER[k], kendte);
      if (l.length) ud.push({ klasse: KLASSER[k], slugs: l });
    }
    return ud;
  }
  function gemtHTML(andre) {
    var sti = window.location.pathname || '';
    return '<span class="ret-gemt__k">' + esc(NYT.gemt_titel) + '</span><ul>' + andre.map(function (a) {
      var navne = NY.klasser[a.klasse];
      var mere = '';
      for (var i = 0; a.slugs.length === 1 && i < hashAnden.length; i++) {
        if (hashAnden[i].slug === a.slugs[0]) {
          mere = ' <a href="' + esc(sti + '#' + a.slugs[0]) + '">' + esc(fyld(NYT.mere_link, { navn: hashAnden[i].navn, noun: navne.flt })) + '</a>.';
        }
      }
      return '<li><a href="' + esc(sti + '#r=' + a.slugs.join(',')) + '">' + esc(navne.gemt) + ' (' + a.slugs.length + ')</a>.' + mere + '</li>';
    }).join('') + '</ul>';
  }

  function opdater() {
    var slugs = udvalgtSlugs();
    tegnKlasse();
    var andre = aktivKlasse && NY.klasser[aktivKlasse] ? andreGemt() : [];
    if (gemtEl) {
      gemtEl.hidden = !andre.length;
      gemtEl.innerHTML = andre.length ? gemtHTML(andre) : '';
    }
    var ledeEl = document.querySelector('[data-saml-lede]');
    if (ledeEl && ledeOrig === null) ledeOrig = ledeEl.textContent;
    if (ledeEl && slugs !== DATA.standard && slugs.length >= DATA.maksAntal && DATA.tekst.lede_fuld) ledeEl.textContent = DATA.tekst.lede_fuld.replace('{n}', slugs.length);
    else if (ledeEl && !aktivKlasse) ledeEl.textContent = ledeOrig;
    if (ledeEl && klasseOrd('flt')) {
      var ord = klasseOrd('flt');
      if (!slugs.length) saetLede(ledeEl, fyld(NYT.lede_tom, { noun: ord }), fyld(NYT.lede_tom_mobil, { noun: ord }));
      else if (slugs.length === 1) saetLede(ledeEl, fyld(NYT.lede_en, { noun: ord }), fyld(NYT.lede_en_mobil, { noun: klasseOrd('ent') }));
      else if (slugs.length > 2) saetLede(ledeEl, ledeEl.textContent, fyld(NYT.lede_mobil_faa, { n: slugs.length }));
      else ledeEl.innerHTML = '<span class="ret-d">' + esc(ledeOrig) + '</span>';
    }
    if (flereEl) {
      var mer = slugs.length - 2;
      flereEl.hidden = mer < 1;
      if (mer > 0) flereEl.textContent = fyld(mer > 1 ? NYT.flere_flere : NYT.flere_en, { n: mer });
    }
    if (ledeEl) ledeEl.hidden = !slugs.length;
    live.textContent = fortrydTekst();
    if (slugs.length < 2) {
      var besked = hashTabt ? hashBeskedHTML(andre.length) : '';
      if (besked) visStatusHTML(besked); else skjulStatus();
      var enkeltHTML = '';
      var vaelg = '';
      if (slugs.length === 1) {
        var enkeltRobot = robotAf(slugs[0]);
        if (enkeltRobot) {
          enkeltHTML = '<div class="saml-enkelt-valgt">'
            + '<div class="specimen specimen--enkelt">'
            + '<span class="specimen__top">' + fotoLinkHTML(enkeltRobot)
            + '<span class="specimen__id">'
            + '<span class="specimen__navn"><a href="' + esc(enkeltRobot.url) + '">' + esc(enkeltRobot.navn) + '</a></span>'
            + '<span class="specimen__meta">' + esc(enkeltRobot.producent) + '</span>'
            + '</span></span>'
            + '<span class="specimen__fod">'
            + '<span class="specimen__taethed figur">' + esc(taethedTekst(enkeltRobot.taethedAntal, enkeltRobot.robottype)) + '</span>'
            + fortrydHTML()
            + '<button type="button" class="specimen__fjern knap knap--kant-moerk" data-saml-fjern="' + esc(enkeltRobot.slug) + '">'
            + '<span aria-hidden="true">' + esc(DATA.tekst.fjern_kort) + '</span>'
            + '<span class="kunskaerm">' + esc(String(DATA.tekst.fjern_navn).replace('{navn}', enkeltRobot.navn)) + '</span>'
            + '</button></span>'
            + '</div></div>';
          if (klasseOrd('ent')) enkeltHTML = '<div class="ret-hoved-par">' + enkeltHTML + pladsHTML(klasseOrd('ent')) + '</div>';
          else vaelg = invitationHTML(true);
        }
      }
      if (!slugs.length) {
        if (fortryd) enkeltHTML = '<div class="saml-tom"><p class="saml-tom__fortryd">' + fortrydHTML() + '</p></div>';
        vaelg = '<div class="ret-plats saml-tom saml-tom--vejledning"><p class="saml-tom__tekst">' + esc(NYT.tom_vejledning) + '</p>'
          + invitationHTML(true, false, klasseOrd('flt') ? fyld(NYT.vaelg_knap, { noun: klasseOrd('flt') }) : '') + '</div>';
      }
      resultat.innerHTML = enkeltHTML + vaelg;
      if (noegle) noegle.hidden = true;
      sidsteOmregnelige = 0;
      if (fod) fod.hidden = true;
      opdaterKontakt();
      return;
    }
    var noter = [];
    var hashBesked = hashTabt ? hashBeskedHTML(andre.length) : '';
    if (hashBesked) noter.push(hashBesked);
    if (slugs === DATA.standard && DATA.tekst.standard_note) noter.push(esc(DATA.tekst.standard_note));
    if (noter.length) visStatusHTML(noter.join(' ')); else skjulStatus();
    resultat.innerHTML = tabelHTML(slugs);
    if (alleFelterEl) alleFelterEl.textContent = feltNaevnerTekst(slugs.map(robotAf).filter(Boolean));
    if (noegle) noegle.hidden = false;
    sikrTabstop();
    opdaterKlaeb();
    maalFoldSenere();
    if (fod) fod.hidden = false;
    opdaterKontakt();
  }

  function fraKataloget(href) {
    if (!document.referrer) return false;
    try {
      var maal = document.createElement('a');
      maal.href = href;
      var kilde = document.createElement('a');
      kilde.href = document.referrer;
      return kilde.protocol === maal.protocol && kilde.host === maal.host
        && kilde.pathname === maal.pathname;
    } catch (e) { return false; }
  }

  // Brug aldrig closest(): mangler i testenes DOM-shim.
  function opefter(el, attr) {
    while (el && el !== resultat) {
      if (el.getAttribute && el.getAttribute(attr) !== null) return el;
      el = el.parentNode;
    }
    return null;
  }

  resultat.addEventListener('click', function (e) {
    var maal = e && (e.target || e.srcElement);
    if (!maal) return;

    if (opefter(maal, 'data-saml-fortryd')) { e.preventDefault(); fortrydFjern(); return; }

    var km = maal.closest && maal.closest('button.kildemaerke');
    if (km) { aabnKilde(km); return; }
    if (maal.closest && maal.closest('#saml-kilde-panel .nx')) { lukKilde(true); return; }

    var diff = opefter(maal, 'data-saml-diff');
    if (diff) {
      e.preventDefault();
      toggleDiff();
      return;
    }

    var tomme = opefter(maal, 'data-saml-tomme');
    if (tomme) {
      e.preventDefault();
      toggleTomme();
      return;
    }

    var fjern = opefter(maal, 'data-saml-fjern');
    if (fjern) {
      e.preventDefault();
      fjernSlug(fjern.getAttribute('data-saml-fjern'));
      var iBjaelke = /saml-bjaelke/.test((fjern.parentNode && fjern.parentNode.className) || '');
      var naesteKnap = (iBjaelke && resultat.querySelector('.saml-bjaelke [data-saml-fjern]'))
        || resultat.querySelector('[data-saml-fjern]') || resultat.querySelector('[data-saml-knap]');
      if (naesteKnap && typeof naesteKnap.focus === 'function') {
        naesteKnap.focus({ preventScroll: true });
      }
      return;
    }

    var invit = opefter(maal, 'data-saml-knap');
    if (invit && fraKataloget(invit.getAttribute('href'))) {
      e.preventDefault();
      window.history.back();
    }
  });

  resultat.addEventListener('focusin', function (e) {
    var maal = e.target;
    if (maal && maal.getAttribute && (maal.getAttribute('class') || '').indexOf('saml-raekke__navn') >= 0) saetTabstop(maal);
  });

  function raekkeMaerker(rk) {
    return Array.prototype.filter.call(rk.querySelectorAll('button.kildemaerke'), function (a) { return a.getClientRects().length > 0; });
  }

  resultat.addEventListener('keydown', function (e) {
    var tast = e && (e.key || e.keyCode);
    if (!tast) return;
    var maal = e.target || e.srcElement;
    if (!maal) return;
    if (tast === 'Escape' && kildePanel) { lukKilde(true); return; }

    var klasse = (maal.getAttribute && maal.getAttribute('class')) || '';
    var erNavnHoved = klasse.indexOf('saml-raekke__navn') >= 0;
    var erMaerke = /(^| )kildemaerke( |$)/.test(klasse);
    if (erMaerke && (tast === 'ArrowRight' || tast === 'ArrowLeft')) {
      var rk = maal.parentNode;
      while (rk && !(rk.classList && rk.classList.contains('saml-raekke'))) rk = rk.parentNode;
      if (!rk) return;
      var ml = raekkeMaerker(rk);
      var mi = ml.indexOf(maal) + (tast === 'ArrowRight' ? 1 : -1);
      e.preventDefault();
      if (mi >= ml.length) return;
      (mi < 0 ? rk.querySelector('.saml-raekke__navn') : ml[mi]).focus();
      return;
    }
    if (erNavnHoved && tast === 'ArrowRight') {
      var foerste = raekkeMaerker(maal.parentNode)[0];
      if (foerste) { e.preventDefault(); foerste.focus(); }
      return;
    }
    if (!erNavnHoved) return;

    var alle = synligeNavne();
    if (!alle.length) return;
    var index = -1;
    for (var i = 0; i < alle.length; i++) {
      if (alle[i] === maal) { index = i; break; }
    }
    if (index < 0) return;

    var naeste = -1;
    if (tast === 'ArrowDown' || tast === 40) {
      naeste = index + 1 < alle.length ? index + 1 : index;
    } else if (tast === 'ArrowUp' || tast === 38) {
      naeste = index - 1 >= 0 ? index - 1 : 0;
    } else if (tast === 'Home' || tast === 36) {
      naeste = 0;
    } else if (tast === 'End' || tast === 35) {
      naeste = alle.length - 1;
    }

    if (naeste >= 0 && naeste !== index && alle[naeste]) {
      e.preventDefault();
      if (typeof alle[naeste].focus === 'function') {
        alle[naeste].focus();
      }
    }
  });

  var fallback = document.querySelector('[data-sammenligning-fallback-wrap]');
  if (fallback) {
    if (typeof fallback.remove === 'function') {
      fallback.remove();
    } else {
      fallback.hidden = true;
    }
  }
  app.hidden = false;

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('hashchange', function () {
      aktivKlasse = null;
      fortryd = null;
      opdater();
    });
  }

  function opdaterKlaeb() {
    var tabel = resultat.querySelector('.saml-matrix');
    var bar = resultat.querySelector('.saml-bjaelke');
    var hoved = tabel && tabel.querySelector('thead');
    if (!tabel || !bar || !hoved || !tabel.getBoundingClientRect) return;
    var t = tabel.getBoundingClientRect();
    var vis = hoved.getBoundingClientRect().bottom < 0 && t.bottom > 62;
    bar.classList[vis ? 'add' : 'remove']('saml-bjaelke--aaben');
    if (vis) bar.setAttribute('data-klaebet', ''); else bar.removeAttribute('data-klaebet');
    if (!vis) return;
    bar.style.left = t.left + 'px';
    bar.style.width = t.width + 'px';
    var th = hoved.querySelectorAll('th, td');
    var celler = bar.querySelectorAll('.saml-bjaelke__hjoerne, .saml-bjaelke__celle');
    var sidste = null;
    for (var i = 0; i < celler.length && i < th.length; i++) {
      var bredde = th[i].getBoundingClientRect().width;
      celler[i].style.width = bredde + 'px';
      celler[i].style.paddingRight = '';
      if (bredde > 0) sidste = celler[i];
    }
    if (sidste) sidste.style.paddingRight = '44px';
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('scroll', opdaterKlaeb, { passive: true });
    window.addEventListener('resize', opdaterKlaeb);
    window.addEventListener('resize', maalFold);
    window.addEventListener('load', maalFold);
  }

  opdater();
}());
