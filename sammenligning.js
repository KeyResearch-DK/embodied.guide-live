/* sammenligning.js — felt-for-felt-matricen paa /compare/. Forbedrer kun: uden JS staar den
   server-renderede liste. Data fra inline JSON, aldrig fetch() (siden skal virke fra file://). */
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

  // L147: naevneren pr. type fra DATA.naevnerPrType; faldback til det faste tal (fail open).
  var FELT_ANTAL_FALDBACK = Object.keys(DATA.feltNavne).length;
  function feltAntalFor(robottype) {
    var pr = DATA.naevnerPrType || {};
    return (robottype && pr[robottype] !== undefined) ? pr[robottype] : FELT_ANTAL_FALDBACK;
  }
  function taethedTekst(a, robottype) {
    return String(DATA.tekst.taethed_skabelon).replace('{a}', a).replace('{b}', feltAntalFor(robottype));
  }

  // Forbeholdet staar i title og .kunskaerm; intet synligt maerke (JPK 27. aug 2026).
  function fnote(tekst) {
    return '<abbr class="forbehold--skjult" title="' + esc(tekst) + '">'
      + '<span class="kunskaerm">' + esc(DATA.tekst.advarsel) + ': ' + esc(tekst) + '</span></abbr>';
  }

  /** Figuren som tekst (tal eller interval), i samme form som side.mjs' tal() og kildeform. */
  function figurAf(v, min, maks, enhed) {
    if (min !== null && min !== undefined) return fmt(min) + '–' + fmt(maks);
    if (typeof v === 'number' && !enhed && v >= 1e6) return kortAntal(v); // L538: som side.mjs' kortAntal()
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

  /* Oprindelsen af et imperialt tal staar kun i .kunskaerm, som paa robotsiden (JPK 2.-3. sep 2026);
     producentens eget tal (imp.egen) og vores omregning faar hver sin saetning. */
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
      // L239 (2): kort operatorform under 480 px; CSS vaelger.
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
    if (f.forbehold) noter.push(f.forbehold);
    // Forbeholdet staar uden for enhedstvillingerne: det gaelder tallet, ikke enheden.
    var noteHTML = noter.length ? fnote(noter.join(' · ')) : '';

    var metrisk = vaerdiSpan(figurAf(f.vaerdi, f.min, f.maks, f.enhed), f.enhed, f.tilstand === 'nul', op);
    // Producentens egen form i title; kun paa den metriske tvilling (en omregning har ingen kilde).
    if (f.kildeform) {
      var titel = String(DATA.tekst.kilde_original_form || '').replace('{figur}', f.kildeform);
      metrisk = '<span class="original-enhed" title="' + esc(titel) + '">' + metrisk + '</span>';
    }

    /* Begge figurer staar i markup'en, CSS viser én (.enhedsvis); f.imp er regnet server-side.
       Nul afgoeres paa ny for den imperiale figur: 0 °C er 32 °F (haard begraensning 5). */
    if (!f.imp) return metrisk + noteHTML;
    var imp = f.imp;
    var impFigur = figurAf(imp.vaerdi, imp.min, imp.maks);
    var imperial = vaerdiSpan(impFigur, imp.enhed, imp.vaerdi === 0, op) + omregnetHTML(f, imp);
    return '<span class="enhedsvis enhedsvis--metrisk">' + metrisk + '</span>'
      + '<span class="enhedsvis enhedsvis--imperial">' + imperial + '</span>'
      + noteHTML;
  }

  /* L476: samme kildemaerke-markup som side.mjs' kildemaerke(), linket til robottens kildeliste.
     tabindex -1: matricen faar ikke ~100 nye tab-stop. */
  function kildemaerke(r, bogstav, sek) {
    if (!bogstav) return '';
    var navn = String(DATA.tekst[sek ? 'kilde_navn_sekundaer' : 'kilde_navn_primaer'] || '').replace('{bogstav}', bogstav);
    return '⁠<a class="kildemaerke' + (sek ? ' kildemaerke--sek' : '') + '" href="' + esc(r.url) + '#kilde-' + esc(bogstav)
      + '" aria-label="' + esc(navn) + '" title="' + esc(sek ? DATA.tekst.kilde_sek_forklaring : DATA.tekst.kilde_primaer)
      + '" tabindex="-1">' + esc(bogstav) + '</a>';
  }

  function renderFelt(f, r) {
    if (!f) f = { tilstand: 'ikke_oplyst' };
    var ud0 = renderFeltUdenKilde(f, r);
    return f.tilstand === 'ikke_oplyst' || !r ? ud0 : ud0 + kildemaerke(r, f.kb, f.ks); // L554: aldrig på not stated
  }

  function renderFeltUdenKilde(f, r) {
    var forbeholdHTML = f.forbehold ? fnote(f.forbehold) : '';
    switch (f.tilstand) {
      case 'nej':
        return '<span class="v v-nej"><i class="mrk"></i>' + esc(DATA.tekst.nej) + '</span>' + forbeholdHTML;
      case 'ja':
        return '<span class="v v-ja"><i class="mrk"></i>' + esc(DATA.tekst.ja) + '</span>' + forbeholdHTML;
      case 'kun_billede':
        return '<span class="v v-billede"><i class="mrk"></i><span class="ord">' + esc(DATA.tekst.kun_billede) + '</span></span>' + forbeholdHTML;
      case 'tekst': {
        var ud = '<span class="v v-tekst">' + esc(f.tekst) + '</span>';
        if (f.links) { // L421: koblede robotter som links
          ud = '<span class="v v-tekst">' + f.links.map(function (l) {
            return '<a href="' + esc(l[1]) + '">' + esc(l[0]) + '</a>' + (r ? kildemaerke(r, l[2]) : '');
          }).join(', ') + '</span>';
        }
        if (f.min !== null && f.min !== undefined) {
          // Et tekstfelt med et maalbart interval skifter enhed som ethvert andet interval.
          ud += ' ' + renderTal({ tilstand: 'tal', vaerdi: null, min: f.min, maks: f.maks, enhed: f.enhed, operator: null, imp: f.imp });
        }
        return ud + forbeholdHTML;
      }
      case 'tal':
      case 'nul':
        return renderTal(f);
      case 'ikke_oplyst':
      default:
        // L239 (4): ordet i egen span, saa CSS kan vise den kompakte boks under 480 px.
        return '<span class="v v-ikke"><i class="mrk"></i><span class="v-ikke__ord">' + esc(DATA.tekst.ikke_oplyst) + '</span></span>' + forbeholdHTML;
    }
  }

  /* Aa54: matricen er en rigtig tabel; de eksplicitte ARIA-roller bevarer tabelsemantikken,
     naar CSS aendrer display. Captionens id navngiver tabellen. */
  var CAPTION_ID = 'saml-tabel-caption';

  // Samme id som sammenligning.mjs, robot.mjs og enhed.js (test 44 holder dem sammen).
  var ENHED_ID = 'enhedsskift';
  var enhedsBoks = document.getElementById(ENHED_ID);
  var sidsteOmregnelige = 0;

  /* L370: fotofeltet foelger klassen (humanoid staaende). Mangler fotoet, den tomme plade
     (DESIGN.md «Den tomme plade»), ikke en tom kasse. */
  function fotofeltHTML(r) {
    if (r.klasse === 'ai_model') return ''; // L421: en model har intet fotofelt
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
      + ' loading="lazy" decoding="async"></picture></span>';
  }

  /* Kolonnehovedet er tabellens <thead> (Aa54) og klaeber; .specimen-klasserne laeses af test 29.
     Hjoernecellen er et <td>: et <th> uden kolonne ville vaere en overskrift uden kolonne. */
  function specimenHoved(robotter, n) {
    var celler = robotter.map(function (r) {
      return '<th scope="col" role="columnheader" class="specimen">'
        + '<span class="specimen__top">' + fotofeltHTML(r)
        + '<span class="specimen__id">'
        // Typemaerket (DESIGN.md «Typemærket»): faerdig etiket fra serveren, katalogkortets klasse.
        + (r.typeMrk ? '<span class="kort__mrk kort__mrk--moerk">' + esc(r.typeMrk) + '</span>' : '')
        // Navnet linker til robotsiden (JPK 15. sep 2026).
        + '<span class="specimen__navn"><a href="' + esc(r.url) + '">' + esc(r.navn) + '</a></span>'
        + '<span class="specimen__meta">' + esc(r.producent) + '</span>'
        // L476: modeltypen under producenten, som katalogkortets maerker; ikke oplyst giver intet.
        + (r.modeltyper ? '<span class="kort__modeltype"><span class="kunskaerm">' + esc(DATA.feltNavne.modeltype) + ': </span>'
          + r.modeltyper.map(function (v) { return '<span class="kort__mrk kort__mrk--moerk">' + esc(v) + '</span>'; }).join('') + '</span>' : '')
        + '</span></span>'
        /* Fjern-knappen virker paa sin egen kolonne (JPK 2. sep 2026); man tilfoejer kun fra kataloget (L73).
           Lang tekst i .kunskaerm, saa tre knapper ikke hedder det samme. */
        + '<span class="specimen__fod">'
        // L239 (5): lang og kort form; CSS vaelger efter bredden.
        + '<span class="specimen__taethed figur">'
        + '<span class="specimen__taethed-lang" aria-hidden="true">' + esc(taethedTekst(r.taethedAntal, r.robottype)) + '</span>'
        + '<span class="specimen__taethed-kort" aria-hidden="true">' + esc(String(DATA.tekst.taethed_kort || '').replace('{a}', r.taethedAntal).replace('{b}', feltAntalFor(r.robottype))) + '</span>'
        + '<span class="kunskaerm">' + esc(taethedTekst(r.taethedAntal, r.robottype)) + '</span>'
        + '</span>'
        + '<button type="button" class="specimen__fjern knap knap--kant-moerk" data-saml-fjern="' + esc(r.slug) + '">'
        + '<span class="specimen__fjern-ord" aria-hidden="true">' + esc(DATA.tekst.fjern_kort || '') + '</span>'
        + '<span class="specimen__fjern-tegn" aria-hidden="true">' + esc(DATA.tekst.fjern_tegn || '') + '</span>'
        + '<span class="kunskaerm">'
        + esc(String(DATA.tekst.fjern_navn || '').replace('{navn}', r.navn)) + '</span>'
        + '</button>'
        + '</span>'
        + '</th>';
    }).join('');
    return '<thead class="specimen-hoved" role="rowgroup">'
      + '<tr class="specimen-hoved__raekke" role="row">'
      + '<td class="specimen-hoved__hjoerne" role="cell">'
      + '<span class="saml-hjoerne__ord">' + esc(DATA.tekst.alle_felter) + '</span>'
      + '<span class="saml-hjoerne__note">' + esc(feltNaevnerTekst(robotter)) + '</span>'
      + '</td>' + celler
      + '</tr></thead>';
  }

  // L147, L495: blandede typer har ikke een naevner; hjoernet siger det i stedet for et tal.
  function feltNaevnerTekst(robotter) {
    var b0 = feltAntalFor(robotter[0] && robotter[0].robottype);
    var blandet = robotter.some(function (x) { return feltAntalFor(x.robottype) !== b0; });
    return String((blandet ? DATA.tekst.felter_naevner_blandet : DATA.tekst.felter_naevner) || "").replace("{b}", b0);
  }

  /* Svartaellingen: hvor mange plader oplyser feltet - en taelling, aldrig en vinder (haard
     begraensning 6). `svarer` styrer ogsaa .saml-raekke--tavs. */
  function svarHTML(robotter, feltNavn) {
    var svarer = 0;
    for (var i = 0; i < robotter.length; i++) {
      var f = robotter[i].felter[feltNavn];
      if (f && f.tilstand !== 'ikke_oplyst') svarer++;
    }
    var taelling = String(DATA.tekst.svar_taeller || '')
      .replace('{a}', svarer).replace('{b}', robotter.length);
    return {
      svarer: svarer,
      html: '<span class="kunskaerm">' + esc(taelling) + '</span>',
    };
  }

  /* Fotokreditten pr. kolonne i <tfoot> (JPK 3. sep 2026); kun viste fabrikantfotos krediteres (L314).
     Å407: foto.vist afgoer, om kreditten er producent, forhandler eller fri licens. */
  function fotoCelleTekst(r, f) {
    var hentet = f.hentet ? ' (' + DATA.tekst.hentet + ' ' + f.hentet + ')' : '';
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

  function fotoFodHTML(robotter) {
    var harKredit = false;
    var celler = robotter.map(function (r) {
      var f = r.foto;
      if (!f || !f.vist) {
        return '<td class="saml-fotofod__celle" role="cell"></td>';
      }
      harKredit = true;
      return '<td class="saml-fotofod__celle" role="cell">' + fotoCelleTekst(r, f) + '</td>';
    }).join('');
    if (!harKredit) return '';
    // Hjoernecellen er et <td>, som i specimenHoved().
    return '<tfoot class="saml-fotofod" role="rowgroup">'
      + '<tr class="saml-fotofod__raekke" role="row">'
      + '<td class="saml-fotofod__hjoerne" role="cell"></td>'
      + celler
      + '</tr></tfoot>';
  }

  /* En kontakt, hvor intet skifter, er vaerre end ingen: strimlen udebliver, naar udvalget ingen
     omregnelig figur har (taelles pr. tegning). */
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

  /* Kontaktens etikette og noten om imperiale tal; noten vises kun i imperial tilstand (.enhedsnote). */
  function enhedslinjeHTML() {
    return '<div class="saml-enhedslinje">'
      + '<label class="enhedsskift" for="' + ENHED_ID + '">'
      + '<span class="enhedsskift__spor" aria-hidden="true"><span class="enhedsskift__knop"></span></span>'
      + '<span class="enhedsskift__ord">' + esc(DATA.tekst.enhed_skift_etiket || '') + '</span></label>'
      + '<p class="t-mikro maal enhedsnote">' + esc(DATA.tekst.enhed_skift_forklaring || '') + '</p>'
      + '</div>';
  }

  /* Invitationen tilbage til kataloget, kun ved ledig plads (JPK 2. sep 2026, L73). Over matricen,
     ikke som tom kolonne. data-saml-knap genbruger bfcache-tilbagevejen. */
  function invitationHTML() {
    if (!DATA.katalogUrl) return '';
    return '<p class="saml-invit"><a class="saml-invit__link knap knap--kant" href="'
      + esc(klasseKatalogUrl()) + '" data-saml-knap>'
      + esc(DATA.tekst.vaelg_titel || '') + '</a></p>';
  }

  var diffAktiv = false;

  function erFeltEns(felter) {
    if (!felter || felter.length <= 1) return true;
    function norm(f) {
      if (!f) return 'ikke';
      if (f.tilstand === 'ikke_oplyst') return 'ikke';
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
      + '<span class="saml-diff-knap__taeller figur">' + esc(taellerTekst) + '</span>'
      + '</button>';
  }

  function toggleDiff() {
    diffAktiv = !diffAktiv;
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

  function tabelHTML(slugs) {
    // Hoved og krop bygges af samme liste, saa en ukendt slug ikke forskyder kolonnerne.
    var robotter = slugs.map(robotAf).filter(Boolean);
    var n = robotter.length;
    if (!n) return '';
    var spalter = n + 1;

    // L147/S-H4: etiketterne følger første robots type.
    var delType = robotter[0].robottype;
    var etiketOverride = (DATA.feltEtiketOverride && DATA.feltEtiketOverride[delType]) || {};
    function feltEtiket(feltNavn) {
      return etiketOverride[feltNavn] !== undefined ? etiketOverride[feltNavn] : DATA.feltNavne[feltNavn];
    }

    // Å616, L147/S-H4: en række udelades, når feltet ikke gælder alle valgte robotters type.
    function gaelder(r, feltNavn) {
      var pr = (DATA.ikkeGaelderPrType && DATA.ikkeGaelderPrType[r.robottype]) || [];
      return pr.indexOf(feltNavn) === -1;
    }
    var antalForskelle = 0;
    var grupperHTML = DATA.grupper.map(function (g) {
      var synligeFelter = g.felter.filter(function (feltNavn) { return robotter.every(function (r) { return gaelder(r, feltNavn); }); });
      if (!synligeFelter.length) return '';
      var raekker = synligeFelter.map(function (feltNavn) {
        // data-robot: navnet som cellens mikromaerke paa smal skaerm (kun visuelt).
        var svar = svarHTML(robotter, feltNavn);
        var felter = robotter.map(function (r) { return r.felter[feltNavn]; });
        var ens = erFeltEns(felter);
        if (!ens) antalForskelle++;

        var celler = robotter.map(function (r) {
          var f = r.felter[feltNavn];
          var tavs = !f || f.tilstand === 'ikke_oplyst';
          return '<td class="saml-raekke__celle' + (tavs ? ' saml-raekke__celle--tavs' : '')
            + '" role="cell" data-robot="' + esc(r.navn) + '">'
            + renderFelt(f, r) + '</td>';
        }).join('');
        // Raekker, hvor alle tier, traeder tilbage som helhed.
        var tavsRaekke = svar.svarer === 0 ? ' saml-raekke--tavs' : '';
        var diffKlasse = ens ? ' saml-raekke--ens' : ' saml-raekke--forskel';
        // tabindex="0": raekkemarkeringen skal kunne naas med tastatur (JPK 3. sep 2026).
        return '<tr class="saml-raekke' + tavsRaekke + diffKlasse + '" role="row">'
          + '<th scope="row" role="rowheader" tabindex="0" class="saml-raekke__navn">'
          + '<span class="saml-raekke__ord">' + esc(feltEtiket(feltNavn)) + '</span>'
          + svar.html + '</th>' + celler + '</tr>';
      }).join('');
      return '<tbody class="saml-gruppe" role="rowgroup">'
        + '<tr class="saml-gruppe__titelraekke" role="row">'
        + '<th scope="rowgroup" role="rowheader" colspan="' + spalter + '" class="saml-gruppe__titel">'
        + esc(g.titel) + '</th></tr>'
        + raekker + '</tbody>';
    }).join('');

    // Captionen navngiver tabellen for skaermlaeseren; visuelt skjult (navnene staar i hovedet).
    var navne = robotter.map(function (r) { return r.navn; }).join(', ');
    var caption = String(DATA.tekst.tabel_caption || '').replace('{robotter}', navne);

    sidsteOmregnelige = omregneligeAntal(robotter);

    var vaerktoejHTML = '<div class="saml-vaerktoej">'
      + (n < DATA.maksAntal ? invitationHTML() : '<span class="saml-vaerktoej__fyld"></span>')
      + diffKnapHTML(antalForskelle)
      + '</div>';

    var matrixStart = diffAktiv
      ? '<table class="saml-matrix saml-matrix--diff" role="table" aria-labelledby="' + CAPTION_ID + '">'
      : '<table class="saml-matrix" role="table" aria-labelledby="' + CAPTION_ID + '">';

    return vaerktoejHTML
      + (sidsteOmregnelige ? enhedslinjeHTML() : '')
      + matrixStart
      + '<caption id="' + CAPTION_ID + '" class="kunskaerm">' + esc(caption) + '</caption>'
      + specimenHoved(robotter, n) + grupperHTML + fotoFodHTML(robotter)
      + '</table>';
  }

  var status = app.querySelector('[data-saml-status]');
  var resultat = app.querySelector('[data-saml-resultat]');
  // Foden (fotokreditten) skjules sammen med resultatet, naar der ingen matrix er.
  var fod = app.querySelector('.saml-fod');
  if (!status || !resultat) return;

  function visStatus(tekst) {
    status.hidden = false;
    status.textContent = tekst;
  }
  function skjulStatus() {
    status.hidden = true;
    status.textContent = '';
  }

  function opdaterKontakt() {
    if (enhedsBoks) enhedsBoks.hidden = !sidsteOmregnelige;
  }

  /* Udvalget vaelges paa kataloget (L73). Siden laeser det i udvalgtSlugs() og skriver kun i
     gemUdvalg() (fjern-knappen), saa katalogets bundbjaelke og matricen er enige.
     Et gemt udvalg vinder over standardvalget, ogsaa med én robot. */
  var SAML_NOEGLE = 'quad-sammenligning';

  /* L170/L175: en sammenligning er inden for én klasse; klassen afgoeres én gang og holdes. */
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
    } catch (e) { /* intet lager: standardvalget bruges */ }
    return brug;
  }
  function udvalgtSlugs() {
    var kendte = {};
    for (var i = 0; i < DATA.robotter.length; i++) kendte[DATA.robotter[i].slug] = true;
    var brug = [];

    /* URL deep linking: laes hash hvis tilgaengelig (#slug1,slug2). Kun
       robotter i SAMME klasse som den foerste kendte kommer med. */
    try {
      if (typeof window !== 'undefined' && window.location && window.location.hash) {
        var hash = window.location.hash.replace(/^#/, '');
        if (hash.indexOf('r=') === 0 || hash.indexOf('robotter=') === 0) {
          hash = hash.split('=')[1] || '';
        }
        var dele = hash.split(/[,+]/);
        for (var k = 0; k < dele.length; k++) {
          var s = decodeURIComponent(dele[k].trim());
          if (!s || !kendte[s] || brug.indexOf(s) >= 0 || brug.length >= DATA.maksAntal) continue;
          if (aktivKlasse === null) aktivKlasse = klasseAfSlug(s);
          if (klasseAfSlug(s) === aktivKlasse) brug.push(s);
        }
        if (brug.length) return brug;
      }
    } catch (eHash) { /* tavs */ }

    if (aktivKlasse === null) {
      for (var kk = 0; kk < KLASSER.length; kk++) {
        brug = laesGemt(KLASSER[kk], kendte);
        if (brug.length) { aktivKlasse = KLASSER[kk]; return brug; }
      }
      aktivKlasse = KLASSER[0] || null;
      return DATA.standard;
    }
    brug = laesGemt(aktivKlasse, kendte);
    if (brug.length) return brug;
    // Standardvalget hoerer til standardklassen; en anden klasse uden udvalg
    // viser "vaelg mindst 2" og invitationen tilbage til sin egen klasse.
    return aktivKlasse === KLASSER[0] ? DATA.standard : [];
  }

  /* Returlinket, invitationen og daekket foelger klassen (L170: "Back to
     catalogue" til samme type). Med under to klasser er der intet fragment. */
  function klasseKatalogUrl() {
    if (!DATA.katalogUrl) return '';
    return KLASSER.length > 1 && aktivKlasse ? DATA.katalogUrl + '#type-' + aktivKlasse : DATA.katalogUrl;
  }
  function tegnKlasse() {
    if (!aktivKlasse) return;
    var retur = document.querySelector('[data-saml-retur]');
    if (retur) {
      retur.setAttribute('href', klasseKatalogUrl());
      var ord = (DATA.klasseNavne && DATA.klasseNavne[aktivKlasse]) || aktivKlasse;
      if (DATA.tekst.til_katalog_klasse) retur.textContent = DATA.tekst.til_katalog_klasse.replace('{klasse}', ord);
    }
    // L421: klassens egen overskrift og indledning (AI-modeller).
    var kt = DATA.klasseTekst && DATA.klasseTekst[aktivKlasse];
    if (kt) {
      var h = document.querySelector('[data-saml-titel]');
      var l = document.querySelector('[data-saml-lede]');
      if (h) h.textContent = kt.titel;
      if (l) l.textContent = kt.lede;
      DATA.tekst.vaelg_titel = kt.vaelg_titel;
      DATA.tekst.for_faa = kt.for_faa;
    }
    var punkter = document.querySelectorAll('.daek__nav a[data-klasse]');
    for (var p = 0; p < punkter.length; p++) {
      if (punkter[p].getAttribute('data-klasse') === aktivKlasse) punkter[p].setAttribute('aria-current', 'true');
      else punkter[p].removeAttribute('aria-current');
    }
  }

  /* Den ENESTE skrivning. Tovejs-synkroniserer med URL hash og localStorage. */
  function gemUdvalg(liste) {
    try { window.localStorage.setItem(SAML_NOEGLE + ':' + aktivKlasse, JSON.stringify(liste)); } catch (e) { /* tavs */ }
    try {
      if (typeof window !== 'undefined' && window.history && window.history.replaceState && window.location) {
        var nytHash = liste && liste.length ? '#' + liste.join(',') : '';
        var nyUrl = (window.location.pathname || '') + (window.location.search || '') + nytHash;
        window.history.replaceState(null, '', nyUrl);
      }
    } catch (eHash) { /* tavs */ }
  }

  /* FJERN ÉN ROBOT - hele virkningen af kolonnehovedets knap. */
  function fjernSlug(slug) {
    var nu = udvalgtSlugs();
    var rest = [];
    for (var i = 0; i < nu.length; i++) if (nu[i] !== slug) rest.push(nu[i]);
    if (rest.length === nu.length) return;
    gemUdvalg(rest);
    opdater();
  }

  function opdater() {
    var slugs = udvalgtSlugs();
    tegnKlasse();
    if (slugs.length < 2) {
      visStatus(DATA.tekst.for_faa);
      // 1-robot tilstand: Vis den valgte model i stedet for totalt tomrum
      var enkeltHTML = '';
      if (slugs.length === 1) {
        var enkeltRobot = robotAf(slugs[0]);
        if (enkeltRobot) {
          enkeltHTML = '<div class="saml-enkelt-valgt">'
            + '<div class="specimen specimen--enkelt">'
            + '<span class="specimen__top">' + fotofeltHTML(enkeltRobot)
            + '<span class="specimen__id">'
            + '<span class="specimen__navn">' + esc(enkeltRobot.navn) + '</span>'
            + '<span class="specimen__meta">' + esc(enkeltRobot.producent) + '</span>'
            + '</span></span>'
            + '<span class="specimen__fod">'
            + '<span class="specimen__taethed figur">' + esc(taethedTekst(enkeltRobot.taethedAntal, enkeltRobot.robottype)) + '</span>'
            + '<button type="button" class="specimen__fjern knap knap--kant-moerk" data-saml-fjern="' + esc(enkeltRobot.slug) + '">'
            + '<span aria-hidden="true">' + esc(DATA.tekst.fjern_kort) + '</span>'
            + '<span class="kunskaerm">' + esc(String(DATA.tekst.fjern_navn).replace('{navn}', enkeltRobot.navn)) + '</span>'
            + '</button></span>'
            + '</div></div>';
        }
      }
      resultat.innerHTML = enkeltHTML + invitationHTML();
      sidsteOmregnelige = 0;
      if (fod) fod.hidden = true;
      opdaterKontakt();
      return;
    }
    // R1: standardvalget siges hoejt i sidens eksisterende notits - samme
    // element og form som "vaelg mindst 2" ovenfor, ingen ny komponent.
    if (slugs === DATA.standard && DATA.tekst.standard_note) visStatus(DATA.tekst.standard_note);
    else skjulStatus();
    resultat.innerHTML = tabelHTML(slugs);
    if (fod) fod.hidden = false;
    opdaterKontakt();
  }

  /* Én delegeret lytter paa `resultat` (knapperne tegnes om ved hvert opdater()). Fra kataloget gaar
     invitationen tilbage i historikken, saa bfcache genskaber filtrene. */
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

  /** Naermeste forfader med attributten - `closest()` er ikke i ES5-familien
      og mangler desuden i testenes DOM-shim. */
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

    var diff = opefter(maal, 'data-saml-diff');
    if (diff) {
      e.preventDefault();
      toggleDiff();
      return;
    }

    var fjern = opefter(maal, 'data-saml-fjern');
    if (fjern) {
      e.preventDefault();
      fjernSlug(fjern.getAttribute('data-saml-fjern'));
      var naesteKnap = resultat.querySelector('[data-saml-fjern]') || resultat.querySelector('[data-saml-knap]');
      if (naesteKnap && typeof naesteKnap.focus === 'function') {
        naesteKnap.focus();
      }
      return;
    }

    var invit = opefter(maal, 'data-saml-knap');
    if (invit && fraKataloget(invit.getAttribute('href'))) {
      e.preventDefault();
      window.history.back();
    }
  });

  /* Tastaturnavigation: piletaster mellem specifikationsraekkerne */
  resultat.addEventListener('keydown', function (e) {
    var tast = e && (e.key || e.keyCode);
    if (!tast) return;
    var maal = e.target || e.srcElement;
    if (!maal) return;

    var erNavnHoved = (maal.getAttribute && (maal.getAttribute('class') || '').indexOf('saml-raekke__navn') >= 0);
    if (!erNavnHoved) return;

    var alle = resultat.querySelectorAll('.saml-raekke__navn');
    if (!alle || !alle.length) return;
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

  /* Samme betjeningsflade, to udtryksformer: JS erstatter den statiske
     fallback-liste med den byggede tabel i stedet for at vise begge. */
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
      // En ny adresse kan pege paa en anden klasse (spor D): afgoer den igen.
      aktivKlasse = null;
      opdater();
    });
  }

  opdater();
}());
