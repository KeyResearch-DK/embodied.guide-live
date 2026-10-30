(function () {
  "use strict";

  var felter = document.querySelectorAll(
    '[data-sog="katalog"],[data-sog="forside"]',
  );
  for (var i = 0; i < felter.length; i++) {
    felter[i].removeAttribute("hidden");
  }

  /* Forsidens soegefelt foerer til kataloget; staar foer den tidlige `return` nedenfor. */
  var forside = document.querySelector('form[data-sog="forside"]');
  if (forside) {
    forside.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = forside.querySelector("input").value.trim();
      // Hardkodet med vilje: skema.mjs kan ikke importeres af klientkode (spor/engelskeurler).
      window.location.href =
        "robots/" + (v ? "?s=" + encodeURIComponent(v) : "");
    });
  }

  /* Staar FOER den tidlige `return`, ellers virker samlknapperne ikke paa forsiden. Udvalget ligger i localStorage (ikke URL'en), saa det kan samles paa tvaers af sider. */
  var SAML_NOEGLE = 'quad-sammenligning';

  var klasseRadioer = document.querySelectorAll("input.f-klasse");
  var styrEl = document.getElementById("styr");
  function klasseNu() {
    for (var kr = 0; kr < klasseRadioer.length; kr++) {
      if (klasseRadioer[kr].checked) return klasseRadioer[kr].value;
    }
    return styrEl ? styrEl.getAttribute("data-klasse") || "" : "";
  }
  function samlNoegle() {
    return SAML_NOEGLE + ":" + klasseNu();
  }
  function klasseFraAdresse() {
    var h = window.location.hash ? window.location.hash.slice(1) : "";
    if (h.indexOf("type-") !== 0) return "";
    var el = document.getElementById(h);
    return el && el.classList && el.classList.contains("f-klasse") ? el.value : "";
  }
  function markerDaek(klasse) {
    var punkter = document.querySelectorAll(".daek__nav a[data-klasse]");
    for (var dp = 0; dp < punkter.length; dp++) {
      if (punkter[dp].getAttribute("data-klasse") === klasse)
        punkter[dp].setAttribute("aria-current", "page");
      else punkter[dp].removeAttribute("aria-current");
    }
  }
  /* Saetter afkrydsningen OG defaultChecked, saa formularens nulstil-knap
     ikke skifter klassen tilbage. Returnerer true, hvis klassen skiftede. */
  function saetKlasse(klasse) {
    var skiftet = false;
    for (var kr = 0; kr < klasseRadioer.length; kr++) {
      var er = klasseRadioer[kr].value === klasse;
      if (er && !klasseRadioer[kr].checked) skiftet = true;
      klasseRadioer[kr].checked = er;
      klasseRadioer[kr].defaultChecked = er;
    }
    if (klasseRadioer.length) markerDaek(klasse);
    return skiftet;
  }
  var klasseLyttere = [];
  function foelgAdressensKlasse() {
    var k = klasseFraAdresse();
    if (!k) return;
    if (saetKlasse(k)) for (var kl = 0; kl < klasseLyttere.length; kl++) klasseLyttere[kl](k);
  }
  /* Lytteren staar FOER filtrenes hashchange-lytter, saa klassen er skiftet, foer taellerne regnes. */
  if (klasseRadioer.length) {
    var kFoerst = klasseFraAdresse();
    if (kFoerst) {
      saetKlasse(kFoerst);
      var nulstilFokus = function () {
        setTimeout(function () {
          document.body.setAttribute("tabindex", "-1");
          document.body.focus({ preventScroll: true });
          document.body.removeAttribute("tabindex");
        }, 0);
      };
      if (document.readyState === "complete") nulstilFokus();
      else window.addEventListener("load", nulstilFokus);
    } else markerDaek(klasseNu());
    window.addEventListener("hashchange", foelgAdressensKlasse);
  }
  /* SKAL STEMME MED `maksAntal` i tools/skabelon/sammenligning.mjs; tests/dele/41-samlknap.mjs
     vogter, at de er ens. */
  var SAML_MAKS = 3;

  var samlKnapper = document.querySelectorAll("[data-saml]");
  if (samlKnapper.length) {
    var samlTaeller = document.querySelector("[data-saml-taeller]");
    var samlTal = document.querySelector("[data-saml-tal]");
    var samlOrd = document.querySelector("[data-saml-ord]");
    var samlGraense = document.querySelector("[data-saml-graense]");
    var samlRyd = document.querySelector("[data-saml-ryd]");
    var samlSkabelon = samlTaeller
      ? samlTaeller.getAttribute("data-saml-skabelon")
      : "";
    var samlMaksTekst = samlTaeller
      ? samlTaeller.getAttribute("data-saml-maks-tekst")
      : "";
    var samlFjernKort = samlTaeller
      ? samlTaeller.getAttribute("data-saml-fjern-kort")
      : "";
    var samlFjernNavn = samlTaeller
      ? samlTaeller.getAttribute("data-saml-fjern-navn")
      : "";

    /* Bygges KUN i DOM'en her, aldrig serverrenderet, saa den ikke findes uden JavaScript. */
    var samlNavne = {};
    var klaebebar = null;
    var klaebebarValg = null;
    var klaebebarGaa = null;
    var klaebebarGaaHref = "";
    var klaebebarKvote = null;
    var klaebebarAntal = null;
    var samlAntalSkabelon = samlTaeller
      ? samlTaeller.getAttribute("data-saml-antal") || ""
      : "";

    if (samlTaeller) {
      for (var sn = 0; sn < samlKnapper.length; sn++) {
        var kortEl = samlKnapper[sn].parentElement;
        while (kortEl && kortEl.classList && !kortEl.classList.contains("kort"))
          kortEl = kortEl.parentElement;
        var navnEl = kortEl ? kortEl.querySelector(".kort__navn") : null;
        var slugAttr = samlKnapper[sn].getAttribute("data-saml");
        if (slugAttr && navnEl) samlNavne[slugAttr] = navnEl.textContent.trim();
      }

      var gaaLink = samlTaeller.querySelector(".saml-taeller__gaa");
      klaebebarGaaHref = gaaLink ? gaaLink.getAttribute("href") : "";

      klaebebar = document.createElement("div");
      klaebebar.className = "klaebebar";
      klaebebar.setAttribute("hidden", "");
      klaebebar.setAttribute("role", "region");
      klaebebar.setAttribute(
        "aria-label",
        samlTaeller.getAttribute("data-klaebebar-etiket") || "",
      );

      klaebebarValg = document.createElement("ul");
      klaebebarValg.className = "klaebebar__valg";
      klaebebarValg.setAttribute("aria-live", "polite");

      klaebebarGaa = document.createElement("a");
      // classList.add med hver klasse som egen streng: tests/dele/57's doede-klasse-detektor kraever det.
      klaebebarGaa.classList.add("klaebebar__gaa", "knap");
      var gaaSkabelon = gaaLink ? gaaLink.textContent : "";

      var klaebebarRyd = document.createElement("button");
      klaebebarRyd.type = "button";
      klaebebarRyd.classList.add("klaebebar__ryd", "knap", "knap--tekst-moerk");
      var samlRydEl = document.querySelector("[data-saml-ryd]");
      klaebebarRyd.textContent = samlRydEl ? samlRydEl.textContent : "";
      klaebebarRyd.addEventListener("click", function () {
        skrivUdvalg([]);
        sigGraense("");
        tegnSaml();
      });

      klaebebarKvote = document.createElement("span");
      klaebebarKvote.className = "klaebebar__kvote";
      klaebebarKvote.setAttribute("aria-hidden", "true");

      klaebebarAntal = document.createElement("span");
      klaebebarAntal.className = "klaebebar__antal";

      var klaebebarSpor = document.createElement("div");
      klaebebarSpor.className = "klaebebar__spor";
      klaebebarSpor.appendChild(klaebebarValg);
      klaebebarSpor.appendChild(klaebebarRyd);

      klaebebar.appendChild(klaebebarKvote);
      klaebebar.appendChild(klaebebarAntal);
      klaebebar.appendChild(klaebebarSpor);
      klaebebar.appendChild(klaebebarGaa);

      if (samlGraense) klaebebar.appendChild(samlGraense);

      /* FOER <main>, ikke sidst i <body>: tastaturbrugeren skal ikke forbi 240 fokusstop
         (spor/bundbar D5). position:fixed goer, at pladsen ikke flytter noget visuelt. */
      var hoveddel = document.querySelector("main");
      if (hoveddel && hoveddel.parentNode)
        hoveddel.parentNode.insertBefore(klaebebar, hoveddel);
      else document.body.appendChild(klaebebar);
    }

    /* Lokalt lager kan KASTE (privat vindue, blokeret lager, fuld kvote); en fejl giver et tomt udvalg. */
    function laesUdvalg() {
      try {
        var raa = window.localStorage.getItem(samlNoegle());
        if (!raa) return [];
        var a = JSON.parse(raa);
        if (Object.prototype.toString.call(a) !== "[object Array]") return [];
        var ud = [];
        for (var i2 = 0; i2 < a.length && ud.length < SAML_MAKS; i2++) {
          if (typeof a[i2] === "string" && a[i2]) ud.push(a[i2]);
        }
        return ud;
      } catch (e) {
        return [];
      }
    }
    function skrivUdvalg(a) {
      try {
        window.localStorage.setItem(samlNoegle(), JSON.stringify(a));
        window.localStorage.setItem(SAML_NOEGLE + ":sidst", JSON.stringify(klasseNu()));
      } catch (e) {
      }
    }

    function byggValgLed(slug) {
      var navn = samlNavne[slug] || slug;
      var led = document.createElement("li");
      led.classList.add("klaebebar__chip");

      var navnEl2 = document.createElement("span");
      navnEl2.className = "klaebebar__navn";
      navnEl2.textContent = navn;

      var fjern = document.createElement("button");
      fjern.type = "button";
      // classList.add med hver klasse som egen streng: tests/dele/57's doede-klasse-detektor.
      fjern.classList.add("klaebebar__fjern", "knap", "knap--tekst-moerk");
      fjern.setAttribute("data-saml-fjern", slug);

      var synligt = document.createElement("span");
      synligt.setAttribute("aria-hidden", "true");
      synligt.textContent = "×";
      if (samlFjernKort) fjern.setAttribute("title", samlFjernKort);

      var forSkaermlaeser = document.createElement("span");
      forSkaermlaeser.className = "kunskaerm";
      forSkaermlaeser.textContent = (samlFjernNavn || "").replace(
        "{navn}",
        navn,
      );

      fjern.appendChild(synligt);
      fjern.appendChild(forSkaermlaeser);
      fjern.addEventListener("click", function () {
        fjernValg(slug);
      });

      led.appendChild(navnEl2);
      led.appendChild(fjern);
      return led;
    }

    function fjernValg(slug) {
      var valgt = laesUdvalg();
      var p2 = valgt.indexOf(slug);
      if (p2 < 0) return;
      valgt.splice(p2, 1);
      skrivUdvalg(valgt);
      sigGraense("");
      tegnSaml();
      flytFokusEfterFjern(slug, p2);
    }

    function saetBarplads() {
      var rod = document.documentElement;
      if (!klaebebar || klaebebar.hasAttribute("hidden")) {
        rod.style.setProperty("--barplads", "0px");
        return;
      }
      var kasse = klaebebar.getBoundingClientRect();
      rod.style.setProperty(
        "--barplads",
        Math.ceil(window.innerHeight - kasse.top) + 12 + "px",
      );
    }

    window.addEventListener("resize", saetBarplads);

    function flytFokusEfterFjern(slug, plads) {
      // To vaern om samme tavse fejl: fokus paa et skjult element giver activeElement = <body>.
      var synlig = klaebebar && !klaebebar.hasAttribute("hidden");
      var tilbage =
        synlig && klaebebarValg
          ? klaebebarValg.querySelectorAll(".klaebebar__fjern")
          : [];
      if (tilbage.length) {
        tilbage[Math.min(plads, tilbage.length - 1)].focus();
        return;
      }
      var kortKnap = document.querySelector('[data-saml="' + slug + '"]');
      if (kortKnap && kortKnap.offsetParent !== null) {
        kortKnap.focus();
        return;
      }
      var soegefelt = document.getElementById("sog-katalog");
      if (soegefelt) soegefelt.focus();
    }

    function sigGraense(tekst) {
      if (samlGraense) samlGraense.textContent = tekst || "";
    }

    function tegnSaml() {
      var valgt = laesUdvalg();
      window.quadSaml.opdater();
      if (samlTaeller) {
        /* Elementet maa IKKE slettes: bjaelken laeser sin tekst af det (textContent, ikke innerText). */
        if (samlTal) samlTal.textContent = String(valgt.length);
        if (samlOrd)
          samlOrd.textContent = samlSkabelon.replace(
            "{n}",
            String(valgt.length),
          );
      }
      if (klaebebar) {
        if (valgt.length) {
          var antalTekst = samlAntalSkabelon.replace("{n}", String(valgt.length)).replace("{max}", String(window.quadSaml.maks()));
          if (klaebebarKvote) klaebebarKvote.textContent = antalTekst;
          if (klaebebarAntal) klaebebarAntal.textContent = antalTekst;
          var enhedKlasse = klasseNu() === "ai_model" ? "-ai_model" : "";
          var enhedNoegle = "data-saml-enhed-" + (valgt.length === 1 ? "en" : "flere") + enhedKlasse;
          klaebebarGaa.textContent = gaaSkabelon.replace("{n}", String(valgt.length))
            .replace("{enhed}", samlTaeller.getAttribute(enhedNoegle) || "");
          klaebebarValg.textContent = "";
          for (var vn = 0; vn < valgt.length; vn++) {
            klaebebarValg.appendChild(byggValgLed(valgt[vn]));
          }
          klaebebarGaa.setAttribute(
            "href",
            (klaebebarGaaHref || "") + "#" + valgt.map(encodeURIComponent).join(","),
          );
          klaebebar.removeAttribute("hidden");
          saetBarplads();
        } else {
          // Tom bjaelke er stoej. Listen toemmes ogsaa, ellers finder fokusreglen en Fjern-knap
          // i den skjulte bjaelke og fokus falder til <body> (spor/bundbar punkt 2).
          klaebebarValg.textContent = '';
          klaebebar.setAttribute('hidden', '');
          saetBarplads();
        }
      }
    }

    for (var s = 0; s < samlKnapper.length; s++) {
      samlKnapper[s].addEventListener("click", function (e) {
        e.preventDefault();
        var slug = this.getAttribute("data-saml");
        var valgt = laesUdvalg();
        var p = valgt.indexOf(slug);
        if (p >= 0) {
          valgt.splice(p, 1);
          sigGraense("");
        } else if (valgt.length >= window.quadSaml.maks()) {
          return;
        } else {
          valgt.push(slug);
          sigGraense("");
        }
        skrivUdvalg(valgt);
        tegnSaml();
        if (valgt.length) saetTilvalg(true);
        /* U4: fokus gaar til tilvalgsknappen, naar et fravalgt kort mister sin kontrol (ellers <body>). */
        if (this.offsetParent === null && tilvalgKnap && tilvalgKnap.offsetParent !== null)
          tilvalgKnap.focus();
        if (klaebebar && !klaebebar.hasAttribute("hidden")) {
          klaebebar.classList.remove("klaebebar--kvitter");
          void klaebebar.offsetWidth;
          klaebebar.classList.add("klaebebar--kvitter");
        }
      });
    }

    if (samlRyd) {
      samlRyd.addEventListener("click", function () {
        skrivUdvalg([]);
        sigGraense("");
        tegnSaml();
      });
    }

    var tilvalgKnap = document.querySelector("[data-saml-tilvalg-knap]");
    var tilvalgMelding = document.querySelector("[data-saml-tilvalg-melding]");
    var resultatSektion = tilvalgKnap ? tilvalgKnap.closest(".resultat") : null;
    var saetTilvalg = function (til) {
      if (!tilvalgKnap || !resultatSektion) return;
      tilvalgKnap.setAttribute("aria-pressed", til ? "true" : "false");
      if (til) resultatSektion.setAttribute("data-saml-tilvalg", "");
      else resultatSektion.removeAttribute("data-saml-tilvalg");
    };
    if (tilvalgKnap && resultatSektion) {
      tilvalgKnap.removeAttribute("hidden");
      saetTilvalg(laesUdvalg().length > 0);
      tilvalgKnap.addEventListener("click", function () {
        var til = tilvalgKnap.getAttribute("aria-pressed") !== "true";
        saetTilvalg(til);
        if (!til) {
          skrivUdvalg([]);
          sigGraense("");
          tegnSaml();
        }
        if (tilvalgMelding)
          tilvalgMelding.textContent =
            // Mellemrummet foran: ellers laeses "116 robots in the default viewCompare boxes".
            " " + (tilvalgMelding.getAttribute(til ? "data-til" : "data-fra") || "");
      });
    }

    klasseLyttere.push(function () {
      sigGraense("");
      tegnSaml();
      saetTilvalg(laesUdvalg().length > 0);
    });

    window.addEventListener("storage", function (e) {
      if (!e.key || e.key.indexOf(SAML_NOEGLE) === 0) tegnSaml();
    });

    tegnSaml();
  }

  var gitter = document.getElementById("alle");
  var input = document.getElementById("sog-katalog");
  var form = document.getElementById("styr");
  if (!gitter || !input || !form) return;

  /* `eg` er den ene facet, hvor flere markeringer INDSNAEVRER (uafhaengige betingelser); CSS
     goer det samme (katalog.mjs' filhoved). */
  var OG_FACET = "eg";

  var tomt = document.querySelector("[data-tomt]");
  var tomtSoeg = document.querySelector('[data-tomt-grund="soeg"]');
  var tomtFilter = document.querySelector('[data-tomt-grund="filter"]');
  var tomtFoto = document.querySelector("[data-tomt-foto]"), fjernFoto = document.querySelector("[data-fjern-foto]");
  var tomtAnden = document.querySelector("[data-tomt-anden]"), tomtSkift = document.querySelector("[data-tomt-skift]");
  var sorterEl = form.querySelector("fieldset.sorter"), sorterHjem = sorterEl && form.querySelector(".resultat__hoved"), filterNet = form.querySelector(".facetter__net");
  if (sorterEl && filterNet && window.matchMedia) {
    var sorterMq = window.matchMedia("(min-width:1180px) and (not (pointer:coarse))");
    var placerSorter = function () {
      var knapEl = document.querySelector("[data-saml-tilvalg-knap]");
      if (sorterMq.matches) {
        filterNet.appendChild(sorterEl);
        if (knapEl) filterNet.appendChild(knapEl);
      } else {
        sorterHjem.appendChild(sorterEl);
        if (knapEl) sorterHjem.appendChild(knapEl);
      }
    };
    placerSorter();
    sorterMq.addEventListener("change", placerSorter);
  }
  var fotoBoks = document.getElementById("f-foto-har");
  var bokse = form.querySelectorAll(".facetter__net input[type=checkbox]");
  var hovedTaeller = form.querySelector(".taeller__tal");
  var resultatTitel = form.querySelector(".resultat__titel");
  var forrigeSynligeIalt = -1;
  var landKlasse = null;

  var facetGrupper = form.querySelectorAll("[data-facetgruppe]");

  klasseLyttere.push(function () {
    for (var tb = 0; tb < bokse.length; tb++) {
      if (bokse[tb].name === "type") {
        bokse[tb].checked = false;
        bokse[tb].defaultChecked = false;
      }
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
  });

  /* Escape i capture-fasen og stopper haendelsen, ellers nulstiller tastaturgenvejen filtrene. */
  var dropdowns = form.querySelectorAll(".facetter__net details.facet");
  var flere = form.querySelector("[data-flere]");
  function aabneDropdowns() {
    var ud = [];
    for (var d = 0; d < dropdowns.length; d++) if (dropdowns[d].open) ud.push(dropdowns[d]);
    return ud;
  }
  function lukDropdown(d) {
    d.open = false;
    var inde = d.querySelectorAll("details.facet[open]");
    for (var di = 0; di < inde.length; di++) inde[di].open = false;
  }
  form.addEventListener("toggle", function (e) {
    var d = e.target;
    if (!d || !d.classList || !d.classList.contains("facet")) return;
    if (!d.open) {
      if (d === flere) lukDropdown(d);
      return;
    }
    var aabne = aabneDropdowns();
    for (var a = 0; a < aabne.length; a++) {
      if (aabne[a] !== d && !aabne[a].contains(d)) lukDropdown(aabne[a]);
    }
    holdPanelIVindue(d);
  }, true);
  /* Fjern ikke: breakpoint-listen i stil-katalog.css daekker ikke alle bredder (ai-models 900-1280). */
  function holdPanelIVindue(d) {
    var panel = d.querySelector(":scope > .facet__panel");
    if (!panel) return;
    panel.style.removeProperty("--versk");
    if (getComputedStyle(panel).position !== "absolute") return;
    var r = panel.getBoundingClientRect();
    var rand = 16;
    var dx = Math.min(0, document.documentElement.clientWidth - rand - r.right);
    if (r.left + dx < rand) dx = rand - r.left;
    if (dx) panel.style.setProperty("--versk", Math.round(dx) + "px");
  }
  document.addEventListener("click", function (e) {
    var aabne = aabneDropdowns();
    if (!aabne.length) return;
    for (var a = 0; a < aabne.length; a++) if (aabne[a].contains(e.target)) return;
    for (var b = 0; b < aabne.length; b++) lukDropdown(aabne[b]);
  });
  document.addEventListener("keydown", function (e) {
    var tast = e && (e.key || e.keyCode);
    if (!(tast === "Escape" || tast === 27 || tast === "Esc")) return;
    if (sorterFold && sorterFold.open) {
      e.preventDefault();
      e.stopImmediatePropagation();
      sorterFold.open = false;
      sorterFold.querySelector("summary").focus();
      return;
    }
    var aabne = aabneDropdowns();
    if (!aabne.length) return;
    var inderst = aabne[0];
    for (var a = 0; a < aabne.length; a++) {
      var rummer = false;
      for (var b = 0; b < aabne.length; b++) if (a !== b && aabne[a].contains(aabne[b])) rummer = true;
      if (!rummer) inderst = aabne[a];
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    lukDropdown(inderst);
    var knap = inderst.querySelector("summary");
    if (knap) knap.focus();
  }, true);
  function aabnFlereVedAdresse() {
    if (!flere || !location.hash) return;
    var m = document.getElementById(location.hash.slice(1));
    if (m && flere.contains(m)) flere.open = true;
  }
  aabnFlereVedAdresse();
  window.addEventListener("hashchange", aabnFlereVedAdresse);

  var FACETTER = [];
  var poster = [];
  var kort = gitter.querySelectorAll(".kort");
  for (i = 0; i < kort.length; i++) {
    var k = kort[i];
    var navnEl = k.querySelector(".kort__navn");
    var post = { el: k, ydre: null, v: {}, tal: {}, sog: "", navn: navnEl ? navnEl.textContent.trim().toLowerCase() : "" };
    var el = k.parentElement;
    while (el && el.classList && el.classList.contains("lag")) {
      for (var c = 0; c < el.classList.length; c++) {
        var navn = el.classList[c];
        if (navn.indexOf("lag-") !== 0) continue;
        var f = navn.slice(4);
        if (FACETTER.indexOf(f) === -1) FACETTER.push(f);
        post.v[f] = (el.getAttribute("data-" + f) || "")
          .split(/\s+/)
          .filter(Boolean);
        /* Skalalagenes raa tal: attributten findes kun paa robotter, der oplyser feltet, saa
           fravaer = "ikke oplyst" (`hasAttribute`; et maalt nul er et tal, haard begraensning 5). */
        if (el.hasAttribute("data-" + f + "-tal")) {
          var raat = parseFloat(el.getAttribute("data-" + f + "-tal"));
          if (!isNaN(raat)) post.tal[f] = raat;
        }
      }
      if (el.hasAttribute("data-sog")) {
        post.sog = el.getAttribute("data-sog") || "";
        post.ydre = el;
      }
      el = el.parentElement;
    }
    poster.push(post);
  }

  var skalaer = [];
  var SKALA_NAVNE = [];

  var skalaEl = form.querySelectorAll("[data-skala]");
  for (i = 0; i < skalaEl.length; i++) {
    (function (rod) {
      var navn = rod.getAttribute("data-skala");
      var grebMin = rod.querySelector(".skala__greb--min");
      var grebMaks = rod.querySelector(".skala__greb--maks");
      if (!grebMin || !grebMaks) return;
      var knuder = (rod.getAttribute("data-skala-knuder") || "")
        .split(/\s+/)
        .map(parseFloat)
        .filter(function (n) {
          return !isNaN(n);
        });
      if (knuder.length < 2) return;
      var s = {
        navn: navn,
        rod: rod,
        bane: rod.querySelector(".skala__bane"),
        minEl: grebMin,
        maksEl: grebMaks,
        retning: rod.getAttribute("data-skala-retning") || "mindst",
        enhed: rod.getAttribute("data-skala-enhed") || "",
        aar: rod.hasAttribute("data-skala-aar"),
        enhedImp: rod.getAttribute("data-skala-enhed-imperial") || "",
        impOpslag: (function () {
          try {
            return JSON.parse(rod.getAttribute("data-skala-imperial") || "null");
          } catch (e) {
            return null;
          }
        })(),
        ordMindst: rod.getAttribute("data-skala-ord-mindst") || "",
        ordHoejst: rod.getAttribute("data-skala-ord-hoejst") || "",
        ordMellem: rod.getAttribute("data-skala-ord-mellem") || "",
        intervalSkabelon:
          rod.getAttribute("data-skala-interval") || "{min}-{maks}",
        hviletekst: rod.getAttribute("data-skala-hviletekst") || "",
        traefSkabelon:
          rod.getAttribute("data-skala-traef-skabelon") || "{n}/{m}",
        traefHvile: rod.getAttribute("data-skala-traef-hvile"),
        knuder: knuder,
        afrund: parseFloat(rod.getAttribute("data-skala-afrund")) || 1,
        ordEl: rod.querySelector("[data-skala-visord]"),
        talEl: rod.querySelector("[data-skala-vistal]"),
        enhedEl: rod.querySelector("[data-skala-visenhed]"),
        traefEl: rod.querySelector("[data-skala-traef]"),
        chip: form.querySelector('[data-valg-skala="' + navn + '"]'),
        min: 0,
        maks: 0,
      };
      s.mindste = knuder[0];
      s.stoerste = knuder[knuder.length - 1];
      s.chipNavn = s.chip
        ? s.chip.querySelector("[data-valg-skala-navn]")
        : null;
      s.uoplyst = null;
      var alle = form.querySelectorAll('input[name="' + navn + '"]');
      for (var j = 0; j < alle.length; j++) {
        if (alle[j].value === "ikke_oplyst") s.uoplyst = alle[j];
      }
      s.traerskler = [];
      for (j = 0; j < alle.length; j++) {
        if (alle[j].value !== "ikke_oplyst") s.traerskler.push(alle[j]);
      }
      skalaer.push(s);
      SKALA_NAVNE.push(navn);
    })(skalaEl[i]);
  }

  function erSkala(navn) {
    return SKALA_NAVNE.indexOf(navn) !== -1;
  }

  var SPROG = document.documentElement.getAttribute("lang") || "da";
  function nformat(n) {
    try {
      return Number(n).toLocaleString(SPROG);
    } catch (e) {
      return String(n);
    }
  }

  function sformat(s, n) {
    return s.aar ? String(n) : nformat(n);
  }

  function tilVaerdi(s, p) {
    var led = s.knuder.length - 1;
    var x = (p / 100) * led;
    var i2 = Math.min(Math.floor(x), led - 1);
    var f2 = x - i2;
    var v = s.knuder[i2] + f2 * (s.knuder[i2 + 1] - s.knuder[i2]);
    return Math.round(v / s.afrund) * s.afrund;
  }

  function tilStilling(s, v) {
    var led = s.knuder.length - 1;
    if (v <= s.knuder[0]) return 0;
    if (v >= s.knuder[led]) return 100;
    for (var i2 = 0; i2 < led; i2++) {
      if (v <= s.knuder[i2 + 1]) {
        var spaend = s.knuder[i2 + 1] - s.knuder[i2];
        var f2 = spaend ? (v - s.knuder[i2]) / spaend : 0;
        return Math.round(((i2 + f2) / led) * 100);
      }
    }
    return 100;
  }

  function skalaAktiv(s) {
    return s.min > s.mindste || s.maks < s.stoerste;
  }

  function klem(s, hvem) {
    var pMin = parseFloat(s.minEl.value);
    var pMaks = parseFloat(s.maksEl.value);
    if (isNaN(pMin)) pMin = 0;
    if (isNaN(pMaks)) pMaks = 100;
    if (pMin > pMaks) {
      if (hvem === "min") s.minEl.value = String(pMaks);
      else s.maksEl.value = String(pMin);
    }
  }

  function facetgruppeAntal() {
    for (var g = 0; g < facetGrupper.length; g++) {
      var gruppe = facetGrupper[g];
      var navn = gruppe.getAttribute("data-facetgruppe");
      var mrk = gruppe.querySelector("[data-facet-antal]");
      if (!navn || !mrk) continue;
      var antal = 0;
      if (gruppe.hasAttribute("data-flere")) {
        for (var b3 = 0; b3 < bokse.length; b3++) {
          if (bokse[b3].checked && gruppe.contains(bokse[b3])) antal++;
        }
        for (var s3 = 0; s3 < skalaer.length; s3++) {
          if (skalaAktiv(skalaer[s3]) && gruppe.contains(skalaer[s3].minEl)) antal++;
        }
      } else if (erSkala(navn)) {
        for (var si = 0; si < skalaer.length; si++) {
          if (skalaer[si].navn === navn && skalaAktiv(skalaer[si])) antal = 1;
        }
      } else {
        for (var b2 = 0; b2 < bokse.length; b2++) {
          if (bokse[b2].name === navn && bokse[b2].checked) antal++;
        }
      }
      mrk.removeAttribute("data-standard");
      if (antal > 0) {
        mrk.textContent = nformat(antal);
        mrk.removeAttribute("hidden");
      } else {
        mrk.setAttribute("hidden", "");
      }
    }
  }

  function skalaPasser(post, s) {
    if (!skalaAktiv(s) || !post.v[s.navn]) return true;
    var v = post.tal[s.navn];
    if (v === undefined) return !!(s.uoplyst && s.uoplyst.checked);
    return v >= s.min && v <= s.maks;
  }

  function skalaerPasser(post, spring) {
    for (var i2 = 0; i2 < skalaer.length; i2++) {
      if (skalaer[i2].navn === spring) continue;
      if (!skalaPasser(post, skalaer[i2])) return false;
    }
    return true;
  }

  function tvilling(el, met, imp) {
    el.textContent = "";
    if (imp === null || imp === undefined) {
      el.textContent = met;
      return;
    }
    var m = document.createElement("span");
    m.className = "enhedsvis enhedsvis--metrisk";
    m.textContent = met;
    var i3 = document.createElement("span");
    i3.className = "enhedsvis enhedsvis--imperial";
    i3.textContent = imp;
    el.appendChild(m);
    el.appendChild(i3);
  }
  var enhedsBoks = document.getElementById("enhedsskift");
  function imperialValgt() {
    return !!(enhedsBoks && enhedsBoks.checked);
  }
  if (enhedsBoks) {
    enhedsBoks.addEventListener("change", function () {
      for (var s4 = 0; s4 < skalaer.length; s4++) tegnSkala(skalaer[s4]);
    });
  }

  function tegnSkala(s) {
    var pMin = parseFloat(s.minEl.value);
    var pMaks = parseFloat(s.maksEl.value);
    if (isNaN(pMin)) pMin = 0;
    if (isNaN(pMaks)) pMaks = 100;
    s.min = tilVaerdi(s, pMin);
    s.maks = tilVaerdi(s, pMaks);
    var aktivMin = s.min > s.mindste;
    var aktivMaks = s.maks < s.stoerste;
    var aktiv = aktivMin || aktivMaks;

    var ordDel = s.hviletekst;
    var talDel = "";
    if (aktivMin && aktivMaks) {
      ordDel = s.ordMellem;
      talDel = s.intervalSkabelon
        .replace("{min}", sformat(s, s.min))
        .replace("{maks}", sformat(s, s.maks));
    } else if (aktivMin) {
      ordDel = s.ordMindst;
      talDel = sformat(s, s.min);
    } else if (aktivMaks) {
      ordDel = s.ordHoejst;
      talDel = sformat(s, s.maks);
    }
    var helt = aktiv ? (ordDel + " " + talDel + " " + s.enhed).trim() : s.hviletekst;

    var talImp = null;
    var heltImp = null;
    if (s.impOpslag && s.enhedImp) {
      var slaa = function (v) {
        var k = String(Math.round(v * 1e6) / 1e6);
        return Object.prototype.hasOwnProperty.call(s.impOpslag, k) ? s.impOpslag[k] : null;
      };
      if (aktivMin && aktivMaks) {
        var ia = slaa(s.min);
        var ib = slaa(s.maks);
        if (ia !== null && ib !== null)
          talImp = s.intervalSkabelon.replace("{min}", ia).replace("{maks}", ib);
      } else if (aktivMin) talImp = slaa(s.min);
      else if (aktivMaks) talImp = slaa(s.maks);
      if (talImp !== null) heltImp = ordDel + " " + talImp + " " + s.enhedImp;
    }

    if (s.ordEl) s.ordEl.textContent = ordDel;
    if (s.talEl) tvilling(s.talEl, talDel, talImp);
    if (s.enhedEl) tvilling(s.enhedEl, aktiv ? s.enhed : "", aktiv && talImp !== null ? s.enhedImp : null);
    var heltMet = helt;
    if (heltImp !== null && imperialValgt()) helt = heltImp;
    s.minEl.setAttribute("aria-valuetext", helt);
    s.maksEl.setAttribute("aria-valuetext", helt);

    if (s.bane) {
      s.bane.style.setProperty("--f0", pMin + "%");
      s.bane.style.setProperty("--f1", pMaks + "%");
    }
    s.minEl.style.zIndex = pMin > 50 ? "4" : "2";

    if (s.chip) {
      if (aktiv) {
        s.chip.removeAttribute("hidden");
        if (s.chipNavn) tvilling(s.chipNavn, heltMet, heltImp);
      } else s.chip.setAttribute("hidden", "");
    }
  }

  function fraTraerskler() {
    var haendt = false;
    var maal = location.hash ? location.hash.slice(1) : "";
    for (var i2 = 0; i2 < skalaer.length; i2++) {
      var s = skalaer[i2];
      var valgt = null;
      for (var j = 0; j < s.traerskler.length; j++) {
        var b = s.traerskler[j];
        if (!b.checked && b.id !== maal) continue;
        var v = parseFloat(b.value);
        if (isNaN(v)) continue;
        if (valgt === null) valgt = v;
        else
          valgt =
            s.retning === "mindst" ? Math.min(valgt, v) : Math.max(valgt, v);
        b.checked = false;
        haendt = true;
      }
      if (valgt !== null) {
        if (s.retning === "mindst") s.minEl.value = String(tilStilling(s, valgt));
        else s.maksEl.value = String(tilStilling(s, valgt));
        haendt = true;
      }
      tegnSkala(s);
    }
    return haendt;
  }

  function nulstilSkala(s) {
    s.minEl.value = "0";
    s.maksEl.value = "100";
    tegnSkala(s);
  }

  function markering() {
    var m = {};
    for (var a = 0; a < FACETTER.length; a++) m[FACETTER[a]] = [];
    for (var b = 0; b < bokse.length; b++) {
      if (bokse[b].checked && m[bokse[b].name])
        m[bokse[b].name].push(bokse[b].value);
    }
    if (m.klasse) m.klasse = [klasseNu()];
    var h = location.hash ? location.hash.slice(1) : "";
    if (h) {
      var e = document.getElementById(h);
      if (
        e &&
        e.type === "checkbox" &&
        m[e.name] &&
        m[e.name].indexOf(e.value) === -1
      ) {
        m[e.name].push(e.value);
      }
    }
    return m;
  }

  function nogenMarkering(m, undtag) {
    for (var b = 0; b < bokse.length; b++) {
      if (bokse[b] !== undtag && bokse[b].checked !== bokse[b].defaultChecked) return true;
    }
    for (var s2 = 0; s2 < skalaer.length; s2++) {
      if (skalaAktiv(skalaer[s2])) return true;
    }
    var h = location.hash ? location.hash.slice(1) : "";
    if (h) {
      var e = document.getElementById(h);
      if (e && e.type === "checkbox") return true;
    }
    return false;
  }

  function passer(post, m, spring) {
    for (var f in m) {
      if (f === spring || !m[f].length) continue;
      // Skalaernes facetter haandteres af skalaPasser(); to haandhaevelser ville filtrere to gange.
      if (erSkala(f)) continue;
      if (!post.v[f]) continue;
      var mine = post.v[f];
      var j;
      if (f === OG_FACET) {
        for (j = 0; j < m[f].length; j++) {
          if (mine.indexOf(m[f][j]) === -1) return false;
        }
      } else {
        var traf = false;
        for (j = 0; j < m[f].length; j++) {
          if (mine.indexOf(m[f][j]) !== -1) {
            traf = true;
            break;
          }
        }
        if (!traf) return false;
      }
    }
    return true;
  }

  function boej(vaert, n) {
    var kl = klasseNu();
    var en = vaert.getAttribute("data-antal-en-" + kl) || vaert.getAttribute("data-antal-en");
    var flere = vaert.getAttribute("data-antal-flere-" + kl) || vaert.getAttribute("data-antal-flere");
    return n === 1
      ? en || String(n)
      : (flere || "{n}").replace(
          "{n}",
          String(n),
        );
  }

  var FLIP_LOFT = 160;
  var flipForrige = null;
  var flipKoerer = [];
  var sidstBrugt = -1e9;
  ["input", "change", "click", "keydown"].forEach(function (t) {
    document.addEventListener(t, function () { sidstBrugt = Date.now(); }, true);
  });
  window.addEventListener("hashchange", function () { sidstBrugt = Date.now(); }, true);

  function flipToken(navn, standard) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(navn).trim();
    return v || standard;
  }
  function flipStilling(g) {
    var s = [];
    for (var a = 0; a < poster.length; a++) {
      var r = poster[a].el.getBoundingClientRect();
      s.push(r.width ? { x: r.left - g.left, y: r.top - g.top, h: r.height } : null);
    }
    return s;
  }
  function flip() {
    var g = gitter.getBoundingClientRect();
    var stille = !gitter.animate || !window.matchMedia
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var foer = flipForrige;
    if (foer && flipKoerer.length) {
      var bredde0 = foer.bredde;
      foer = foer.slice();
      foer.bredde = bredde0;
      for (var f = 0; f < flipKoerer.length; f++) {
        var an = flipKoerer[f];
        if (an.anim.playState === "running" && foer[an.i]) {
          var rv = poster[an.i].el.getBoundingClientRect();
          if (rv.width) foer[an.i] = { x: rv.left - g.left, y: rv.top - g.top, h: rv.height };
        }
        an.anim.cancel();
      }
    }
    flipKoerer = [];
    var efter = flipStilling(g);
    var bredde = Math.round(g.width);
    var maaGlide = !stille && foer && foer.bredde === bredde
      && Date.now() - sidstBrugt < 1000;
    efter.bredde = bredde;
    flipForrige = efter;
    if (!maaGlide) return;

    var tid = parseFloat(flipToken("--tid", ".42s")) * 1000 || 420;
    var slyng = flipToken("--slyng", "ease-out");
    var vh = window.innerHeight;
    var top = -g.top - vh / 2, bund = -g.top + vh * 1.5;
    var naer = function (p) { return p && p.y + p.h > top && p.y < bund; };
    for (var a = 0; a < poster.length && flipKoerer.length < FLIP_LOFT; a++) {
      var fra = foer[a], til = efter[a];
      if (!til || !(naer(fra) || naer(til))) continue;
      var anim = null;
      if (fra && Math.abs(fra.y - til.y) < vh * 1.5) {
        var dx = fra.x - til.x, dy = fra.y - til.y;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
        anim = poster[a].el.animate(
          [{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }],
          { duration: tid, easing: slyng });
      } else if (naer(til)) {
        anim = poster[a].el.animate([{ opacity: 0 }, { opacity: 1 }],
          { duration: tid, easing: slyng });
      }
      if (anim) flipKoerer.push({ i: a, anim: anim });
    }
  }

  function traef(tekst, q) {
    var ord = q.split(/\s+/);
    for (var o = 0; o < ord.length; o++) if ((tekst || "").indexOf(ord[o]) === -1) return false;
    return true;
  }

  function skalaTraef(q, m) {
    for (var t = 0; t < skalaer.length; t++) {
      var s = skalaer[t];
      if (!s.traefEl) continue;
      var n = 0;
      var ialt = 0;
      for (var y = 0; y < poster.length; y++) {
        var po = poster[y];
        if (q && !traef(po.sog, q)) continue;
        var v = po.tal[s.navn];
        if (v === undefined || !skalaerPasser(po, s.navn) || !passer(po, m, "")) continue;
        ialt++;
        if (!skalaAktiv(s) || (v >= s.min && v <= s.maks)) n++;
      }
      s.traefEl.textContent = (!skalaAktiv(s) && s.traefHvile ? s.traefHvile : s.traefSkabelon)
        .replace("{n}", nformat(n))
        .replace("{m}", nformat(ialt));
    }
  }

  var valgChips = {};
  var valgEl = form.querySelectorAll("[data-valg]");
  for (i = 0; i < valgEl.length; i++) valgChips[valgEl[i].getAttribute("data-valg")] = valgEl[i];

  var pladsRobot = input.placeholder, pladsAi = input.getAttribute("data-pladsholder-ai"), pladsQuad = input.getAttribute("data-pladsholder-quad");
  var tomtRobot = tomtSoeg ? tomtSoeg.textContent : "", tomtAi = tomtSoeg ? tomtSoeg.getAttribute("data-tekst-ai") : "";
  var tomtFilterRobot = tomtFilter ? tomtFilter.textContent : "", tomtFilterAi = tomtFilter ? tomtFilter.getAttribute("data-tekst-ai") : "";
  var andenIndeks = null, andenHentet = false;
  function opdater() {
    var q = input.value.trim().toLowerCase();
    var klNu = klasseNu(), erAi = klNu === "ai_model";
    if (pladsAi) input.placeholder = erAi ? pladsAi : (klNu === "quadruped" && pladsQuad ? pladsQuad : pladsRobot);
    if (tomtAi) tomtSoeg.textContent = erAi ? tomtAi : tomtRobot;
    if (tomtFilter && tomtFilterAi) tomtFilter.textContent = erAi ? tomtFilterAi : tomtFilterRobot;
    var m = markering();
    var filtrerer = nogenMarkering(m);
    var a;

    for (a = 0; a < poster.length; a++) {
      var pa = poster[a];
      if (!pa.ydre) continue;
      var vis = (!q || traef(pa.sog, q)) && skalaerPasser(pa, "") &&
        passer(pa, m, "");
      /* L392: data-skjult og ikke hidden - hver hidden-aendring gen-evaluerer alle :has()-regler paa .styr. */
      if (vis) pa.ydre.removeAttribute("data-skjult");
      else pa.ydre.setAttribute("data-skjult", "");
      pa.vist = vis;
      // Tom order uden søgning, ellers brydes den valgte sortering.
      pa.el.style.order = q && vis && pa.navn === q ? "-1" : "";
    }

    skalaTraef(q, m);

    var synligeIalt = 0;
    for (a = 0; a < poster.length; a++) {
      if (!poster[a].ydre ? poster[a].el.getClientRects().length === 0 : !poster[a].vist) continue;
      synligeIalt++;
    }

    if (synligeIalt !== forrigeSynligeIalt && forrigeSynligeIalt !== -1) {
      if (hovedTaeller) {
        hovedTaeller.classList.remove("taeller--tick");
        void hovedTaeller.offsetWidth;
        hovedTaeller.classList.add("taeller--tick");
      }
      if (resultatTitel) {
        var rtTick = resultatTitel.querySelector(".antal__tal");
        if (rtTick) {
          rtTick.classList.remove("taeller--tick");
          void rtTick.offsetWidth;
          rtTick.classList.add("taeller--tick");
        }
      }
    }
    forrigeSynligeIalt = synligeIalt;
    if (hovedTaeller) hovedTaeller.textContent = String(synligeIalt);
    if (resultatTitel) {
      var rt = resultatTitel.querySelector(".antal__tal");
      if (rt) rt.textContent = boej(resultatTitel, synligeIalt);
      var antalMelding = document.querySelector("[data-antal-melding]");
      if (antalMelding && rt) antalMelding.textContent = rt.textContent;
      var rs = resultatTitel.querySelector(".antal__smal");
      if (rs) {
        var kls = klasseNu();
        rs.textContent = (resultatTitel.getAttribute("data-af-flere-" + kls) || resultatTitel.getAttribute("data-af-flere")).replace("{n}", String(synligeIalt)).replace("{m}", resultatTitel.getAttribute("data-total-" + kls));
      }
    }

    for (a = 0; a < bokse.length; a++) {
      var boks = bokse[a];
      var antal = 0;
      for (var y = 0; y < poster.length; y++) {
        var po = poster[y];
        if (q && !traef(po.sog, q)) continue;
        if ((po.v[boks.name] || []).indexOf(boks.value) === -1) continue;
        if (!passer(po, m, boks.name === OG_FACET ? "" : boks.name)) continue;
        // Skalaerne holdes fast undtagen boksens egen, ellers staar "ikke oplyst"-raekken altid paa 0.
        if (!skalaerPasser(po, erSkala(boks.name) ? boks.name : "")) continue;
        antal++;
      }
      var etiket = boks.nextElementSibling;
      var felt = etiket ? etiket.querySelector(".antal__tal") : null;
      if (felt) felt.textContent = String(antal);
      if (etiket) etiket.classList.toggle("facet-tom", antal === 0);
    }

    // Kun ved første kørsel og fanevalg, ellers flytter rækkerne sig under musen.
    if (landKlasse !== klNu) {
      landKlasse = klNu;
      var landPanel = form.querySelector('[data-facetgruppe="land"] .facet__panel');
      var landRk = landPanel ? [].slice.call(landPanel.querySelectorAll(".rk")) : [];
      var landNavn = function (r) { return r.querySelector(".rk__navn").textContent; };
      var landTal = function (r) { return Number(r.querySelector(".antal__tal").textContent); };
      landRk.sort(function (x, y) { return landTal(y) - landTal(x) || landNavn(x).localeCompare(landNavn(y)); });
      for (var lr = 0; lr < landRk.length; lr++) landPanel.appendChild(landRk[lr]);
    }

    facetgruppeAntal();

    var hashId = location.hash ? location.hash.slice(1) : "";
    for (a = 0; a < bokse.length; a++) {
      var chip = valgChips[bokse[a].id];
      if (!chip || erSkala(bokse[a].name)) continue;
      var paa = bokse[a].checked || bokse[a].id === hashId;
      if (paa !== chip.hasAttribute("data-valgt")) {
        if (paa) chip.setAttribute("data-valgt", "");
        else chip.removeAttribute("data-valgt");
      }
    }

    if (tomt) {
      tomt.hidden = synligeIalt !== 0;
      var tomtFiltrerer = nogenMarkering(m, fotoBoks);
      var andenKlasse = "", andenAntal = 0;
      var egne = false;
      for (a = 0; a < poster.length && !egne; a++) egne = traef(poster[a].sog, q);
      if (tomtAnden && synligeIalt === 0 && q && !tomtFiltrerer && !egne) {
        if (!andenIndeks && !andenHentet) {
          andenHentet = true;
          fetch(tomtAnden.getAttribute("data-indeks")).then(function (sv) { return sv.json(); }).then(function (j) { andenIndeks = j; opdater(); }).catch(function () {});
        }
        for (var kn in andenIndeks || {}) {
          if (kn === klNu) continue;
          var tr = 0;
          for (a = 0; a < andenIndeks[kn].length; a++) if (traef(andenIndeks[kn][a], q)) tr++;
          if (tr > andenAntal) { andenKlasse = kn; andenAntal = tr; }
        }
      }
      if (andenKlasse) {
        var skabAnden = tomtAnden.getAttribute(andenAntal === 1 ? "data-tekst-en" : "data-tekst");
        tomtAnden.textContent = skabAnden.replace("{her}", tomtAnden.getAttribute("data-flere-" + klNu)).replace("{q}", function () { return input.value.trim(); }).replace("{n}", String(andenAntal)).replace("{der}", tomtAnden.getAttribute((andenAntal === 1 ? "data-en-" : "data-flere-") + andenKlasse));
        tomtSkift.textContent = tomtAnden.getAttribute("data-knap").replace("{der}", tomtAnden.getAttribute("data-flere-" + andenKlasse));
        tomtSkift.setAttribute("href", tomtAnden.getAttribute("data-side-" + andenKlasse) + "?s=" + encodeURIComponent(input.value.trim()));
      }
      if (tomtAnden) { tomtAnden.hidden = !andenKlasse; tomtSkift.hidden = !andenKlasse; }
      if (tomtSoeg) tomtSoeg.hidden = tomtFiltrerer || !!andenKlasse;
      if (synligeIalt === 0) form.setAttribute("data-tom", ""); else form.removeAttribute("data-tom");
      if (tomtFilter) tomtFilter.hidden = !tomtFiltrerer;
      var fotoPaa = !tomtFiltrerer && !andenKlasse && fotoBoks && fotoBoks.checked;
      if (tomtFoto) tomtFoto.hidden = !fotoPaa;
      if (fjernFoto) fjernFoto.hidden = !fotoPaa;
    }

    flip();
    skrivAdresse();
  }

  /* Flaget slukker de statiske forbehold i CSS; saettes FOER foerste opdater(). */
  var sortRadioer = form.querySelectorAll('input[name="sort"]');
  function synkSort() {
    var r = form.querySelector('input[name="sort"]:checked');
    form.setAttribute('data-sort', r ? r.value : '');
  }
  for (i = 0; i < sortRadioer.length; i++) sortRadioer[i].addEventListener('change', synkSort);
  var sorterFold = form.querySelector(".sorter__fold");
  // Kun klik/tryk (detail > 0) lukker; piletaster bladrer i radiogruppen og må ikke lukke folden.
  if (sorterFold) sorterFold.addEventListener("click", function (e) {
    if (e.detail && e.target.closest(".sortervalg label, .sortervalg input")) sorterFold.open = false;
  });
  synkSort();
  form.setAttribute('data-levende', '');

  /* Skalaerne taendes EFTER `data-levende`, ellers staar to oploesninger aktive og et klik filtrerer to gange. */
  for (i = 0; i < skalaer.length; i++) {
    skalaer[i].rod.removeAttribute("hidden");
  }
  fraTraerskler();

  for (i = 0; i < skalaer.length; i++) {
    (function (s) {
      var lyt = function (el, hvem) {
        var haandter = function () {
          klem(s, hvem);
          tegnSkala(s);
          opdater();
        };
        el.addEventListener("input", haandter);
        // `change` fyrer ogsaa efter tastaturbetjening, hvor `input` ikke goer.
        el.addEventListener("change", haandter);
      };
      lyt(s.minEl, "min");
      lyt(s.maksEl, "maks");
      if (s.bane) {
        (function (bane) {
          var greb = null;
          var stil = function (e) {
            var r = bane.getBoundingClientRect();
            var v = ((e.clientX - r.left - 6.5) / (r.width - 13)) * 100;
            if (v < 0) v = 0;
            if (v > 100) v = 100;
            return Math.round(v);
          };
          var flyt = function (e) {
            var v = stil(e);
            if (greb === null) {
              var a = parseFloat(s.minEl.value);
              var z = parseFloat(s.maksEl.value);
              var dA = Math.abs(v - a);
              var dZ = Math.abs(v - z);
              greb = dA < dZ ? s.minEl : dZ < dA ? s.maksEl : v > a ? s.maksEl : s.minEl;
              greb.focus({ preventScroll: true });
            }
            greb.value = String(v);
            greb.dispatchEvent(new Event("input", { bubbles: true }));
          };
          bane.addEventListener("pointerdown", function (e) {
            if (e.target !== bane || (e.pointerType === "mouse" && e.button !== 0)) return;
            e.preventDefault();
            greb = null;
            if (bane.setPointerCapture) bane.setPointerCapture(e.pointerId);
            flyt(e);
          });
          bane.addEventListener("pointermove", function (e) {
            if (greb !== null && e.buttons) flyt(e);
          });
          var slip = function () {
            greb = null;
          };
          bane.addEventListener("pointerup", slip);
          bane.addEventListener("pointercancel", slip);
        })(s.bane);
      }
      var kryds = form.querySelector('[data-valg-skala-ryd="' + s.navn + '"]');
      if (kryds) {
        kryds.addEventListener("click", function () {
          nulstilSkala(s);
          opdater();
        });
      }
    })(skalaer[i]);
  }

  function synkSogStatus() {
    var beholder = input.parentElement;
    while (beholder && beholder.classList && !beholder.classList.contains("sog")) {
      beholder = beholder.parentElement;
    }
    if (beholder) {
      beholder.classList.toggle("sog--har-tekst", input.value.trim().length > 0);
    }
  }

  input.addEventListener("input", function () {
    synkSogStatus();
    opdater();
  });
  synkSogStatus();

  // Et felt i adressens #f-… vises som valgt (:target); replaceState rydder ikke :target, location.replace gør.
  function ryddFilterAdresse() {
    var f = location.hash && document.getElementById(location.hash.slice(1));
    if (!f || f.type !== "checkbox") return;
    var y = window.scrollY;
    location.replace("#");
    window.scrollTo({ top: y, behavior: "instant" });
  }

  for (i = 0; i < bokse.length; i++)
    bokse[i].addEventListener('change', function (e) {
      if (location.hash === "#" + e.target.id) {
        e.target.checked = false;
        ryddFilterAdresse();
      }
      opdater();
    });
  window.addEventListener('hashchange', function () {
    fraTraerskler();
    opdater();
  });

  document.addEventListener("keydown", function (e) {
    var tast = e && (e.key || e.keyCode);
    var tag = (e.target && e.target.tagName) || "";
    var erInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target && e.target.isContentEditable);

    if (tast === "Escape" || tast === 27 || tast === "Esc") {
      if (input.value) {
        e.preventDefault();
        input.value = "";
        synkSogStatus();
        opdater();
        return;
      }
      var m = markering();
      if (nogenMarkering(m)) {
        e.preventDefault();
        for (var b = 0; b < bokse.length; b++) {
          bokse[b].checked = bokse[b].defaultChecked;
        }
        for (var s2 = 0; s2 < skalaer.length; s2++) {
          nulstilSkala(skalaer[s2]);
        }
        if (location.hash) {
          try {
            history.replaceState(null, "", location.pathname + location.search);
          } catch (ex) {}
        }
        var nulstilKnapper = form.querySelectorAll('button[type="reset"]');
        for (var nk = 0; nk < nulstilKnapper.length; nk++) {
          nulstilKnapper[nk].classList.remove("knap--puls");
          void nulstilKnapper[nk].offsetWidth;
          nulstilKnapper[nk].classList.add("knap--puls");
        }
        opdater();
        return;
      }
      if (document.activeElement === input) {
        input.blur();
      }
      return;
    }

    if (erInput) return;
    if ((tast === "/" || tast === 191) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      var lupEl = document.querySelector(".klaebbar[data-klaebet] .sog__lup");
      if (lupEl && lupEl.offsetParent !== null && lupEl.getAttribute("aria-expanded") !== "true") lupEl.click();
      input.focus();
      if (typeof input.select === "function") input.select();
    }
  });

  /* NULSTIL er en <button type="reset"> (virker uden JavaScript, L56); browseren nulstiller
     foerst efter haendelsen, saa opdateringen venter et hak. Skalaerne tegnes bare om. */
  function vendSortering(etiket) {
    var naturlig = document.getElementById(etiket.getAttribute("for"));
    var vendt = document.getElementById(etiket.getAttribute("data-vend"));
    if (!naturlig || !vendt) return false;
    var til = naturlig.checked ? vendt : vendt.checked ? naturlig : null;
    if (!til) return false;
    til.checked = true;
    til.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  var skiftEtiketter = document.querySelectorAll("label[data-vend]");
  for (var se = 0; se < skiftEtiketter.length; se++) {
    (function (etiket) {
      etiket.addEventListener("click", function (h) {
        if (vendSortering(etiket)) h.preventDefault();
      });
      var radioer = [
        document.getElementById(etiket.getAttribute("for")),
        document.getElementById(etiket.getAttribute("data-vend")),
      ];
      for (var sr = 0; sr < radioer.length; sr++) {
        if (!radioer[sr]) continue;
        radioer[sr].addEventListener("keydown", function (h) {
          if ((h.key === " " || h.key === "Enter") && this.checked) {
            h.preventDefault();
            vendSortering(etiket);
            var nu = document.getElementById(etiket.getAttribute("for"));
            var nyFokus = nu && nu.checked ? nu : document.getElementById(etiket.getAttribute("data-vend"));
            if (nyFokus) nyFokus.focus();
          }
        });
      }
    })(skiftEtiketter[se]);
  }

  form.addEventListener("reset", function () {
    setTimeout(function () {
      ryddFilterAdresse();
      for (var s2 = 0; s2 < skalaer.length; s2++) tegnSkala(skalaer[s2]);
      opdater();
    }, 0);
  });

  var ryd = document.querySelectorAll("[data-ryd]");
  for (i = 0; i < ryd.length; i++) {
    ryd[i].addEventListener("click", function () {
      for (var b = 0; b < bokse.length; b++) bokse[b].checked = false;
      for (var s2 = 0; s2 < skalaer.length; s2++) nulstilSkala(skalaer[s2]);
      input.value = "";
      ryddFilterAdresse();
      opdater();
    });
  }

  if (fjernFoto && fotoBoks) {
    fjernFoto.addEventListener("click", function () {
      fotoBoks.checked = false;
      opdater();
    });
  }

  var adresseKlar = false, adresseTid = 0;
  function skrivAdresse() {
    if (!adresseKlar) return;
    clearTimeout(adresseTid);
    adresseTid = setTimeout(function () {
      var p = new URLSearchParams();
      var sg = input.value.trim();
      if (sg) p.set("s", sg);
      var sr = form.querySelector('input[name="sort"]:checked');
      if (sr && !sr.defaultChecked) p.set("sort", sr.value);
      var paa = [], fra = [];
      for (var b = 0; b < bokse.length; b++) {
        if (erSkala(bokse[b].name) || bokse[b].checked === bokse[b].defaultChecked) continue;
        (bokse[b].checked ? paa : fra).push(bokse[b].id);
      }
      if (paa.length) p.set("f", paa.join(","));
      if (fra.length) p.set("uden", fra.join(","));
      for (var k = 0; k < skalaer.length; k++) {
        if (skalaAktiv(skalaer[k])) p.set("skala-" + skalaer[k].navn, skalaer[k].minEl.value + "-" + skalaer[k].maksEl.value);
      }
      var q = p.toString();
      try {
        history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash);
      } catch (ex) {}
    }, 150);
  }
  (function laesAdresse() {
    var p = new URLSearchParams(window.location.search);
    if (p.has("s")) input.value = p.get("s");
    var so = p.get("sort");
    for (var r = 0; so && r < sortRadioer.length; r++) {
      if (sortRadioer[r].value === so) sortRadioer[r].checked = true;
    }
    synkSort();
    var saet = function (liste, vaerdi) {
      var ider = (liste || "").split(",");
      for (var b = 0; b < bokse.length; b++) {
        if (ider.indexOf(bokse[b].id) !== -1) bokse[b].checked = vaerdi;
      }
    };
    saet(p.get("f"), true);
    saet(p.get("uden"), false);
    for (var k = 0; k < skalaer.length; k++) {
      var v = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(p.get("skala-" + skalaer[k].navn) || "");
      if (!v) continue;
      skalaer[k].minEl.value = v[1];
      skalaer[k].maksEl.value = v[2];
      tegnSkala(skalaer[k]);
    }
    adresseKlar = true;
  })();

  (function () {
    var bar = document.querySelector(".klaebbar");
    var sog = bar && bar.querySelector(".sog");
    var lup = sog && sog.querySelector(".sog__lup");
    var liste = bar && bar.querySelector(".valgliste");
    if (!lup || !liste) return;
    var enRaekke = window.matchMedia("(min-width:1180px) and (min-height:500px) and (not (pointer:coarse))");
    var flere = document.createElement("span");
    flere.className = "valg-flere";
    flere.setAttribute("aria-hidden", "true");
    flere.setAttribute("data-tom", "");
    liste.parentNode.insertBefore(flere, liste.nextSibling);

    function klaebet() {
      return bar.hasAttribute("data-klaebet");
    }
    function maalHoejde() {
      if (!klaebet()) document.documentElement.style.setProperty("--kb-h", bar.offsetHeight + "px");
    }
    function pasChips() {
      var chips = liste.querySelectorAll(".valg");
      var c, antal = 0;
      for (c = 0; c < chips.length; c++) chips[c].removeAttribute("data-over");
      if (!klaebet() || !enRaekke.matches) {
        flere.setAttribute("data-tom", "");
        return;
      }
      var synlige = [];
      for (c = 0; c < chips.length; c++) if (chips[c].offsetParent !== null) synlige.push(chips[c]);
      function passer() {
        var venstre = liste.getBoundingClientRect().left, plads = liste.clientWidth - 2, sidste = -1;
        for (var k = 0; k < synlige.length; k++) {
          if (synlige[k].getBoundingClientRect().right - venstre > plads) break;
          sidste = k;
        }
        return sidste;
      }
      flere.setAttribute("data-tom", "");
      var sidste = passer();
      if (sidste < synlige.length - 1) {
        flere.textContent = "+" + synlige.length;
        flere.removeAttribute("data-tom");
        sidste = passer();
      }
      for (c = sidste + 1; c < synlige.length; c++) {
        synlige[c].setAttribute("data-over", "");
        antal++;
      }
      if (antal) flere.textContent = "+" + antal;
      else flere.setAttribute("data-tom", "");
    }
    var tegner = 0;
    function planlaeg() {
      cancelAnimationFrame(tegner);
      tegner = requestAnimationFrame(pasChips);
    }

    function luk(fokus) {
      if (!sog.hasAttribute("data-aaben")) return;
      sog.removeAttribute("data-aaben");
      lup.setAttribute("aria-expanded", "false");
      if (fokus) lup.focus({ preventScroll: true });
    }
    lup.addEventListener("click", function () {
      if (sog.hasAttribute("data-aaben")) return luk(true);
      sog.setAttribute("data-aaben", "");
      lup.setAttribute("aria-expanded", "true");
      input.focus({ preventScroll: true });
    });
    sog.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !sog.hasAttribute("data-aaben") || input.value) return;
      e.preventDefault();
      e.stopPropagation();
      luk(true);
    });
    sog.addEventListener("focusout", function (e) {
      if (!sog.contains(e.relatedTarget)) luk(false);
    });

    /* Chrome ruller ved fokus til knappens plads uden klæbning; gendan rulningen. */
    var tabY = null, fokusY = null;
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      tabY = window.scrollY;
      /* Uden auto glider fokusrulningen (html scroll-behavior:smooth) forbi gendannelsen. */
      if (bar.hasAttribute("data-klaebet") || bar.querySelector(".valgbaand[data-klaebet]")) document.documentElement.style.scrollBehavior = "auto";
      setTimeout(function () { tabY = null; fokusY = null; document.documentElement.style.scrollBehavior = ""; }, 100);
    }, true);
    bar.addEventListener("focusin", function () {
      if (tabY !== null && (bar.hasAttribute("data-klaebet") || bar.querySelector(".valgbaand[data-klaebet]"))) fokusY = tabY;
    });
    window.addEventListener("scroll", function () {
      if (fokusY === null) return;
      var y = fokusY;
      fokusY = null;
      if (Math.abs(window.scrollY - y) > 2) window.scrollTo({ top: y, behavior: "instant" });
    }, { passive: true });

    maalHoejde();
    if ("ResizeObserver" in window) {
      new ResizeObserver(maalHoejde).observe(bar);
      new ResizeObserver(planlaeg).observe(liste);
    }
    new MutationObserver(function () {
      if (!klaebet()) luk(false);
      planlaeg();
    }).observe(bar, { attributes: true, attributeFilter: ["data-klaebet"] });
    new MutationObserver(planlaeg).observe(liste, { attributes: true, subtree: true, attributeFilter: ["hidden"] });
    ["change", "reset"].forEach(function (t) {
      form.addEventListener(t, planlaeg);
    });
  })();

  /* Ret aldrig alene: mq skal svare til @media i stil-katalog.css og være det omvendte af sorterMq, enRaekke og skabelon-ny/katalog.mjs. */
  (function () {
    var bar = document.querySelector(".klaebbar");
    var knap = bar && bar.querySelector(".tilfilter");
    var liste = bar && bar.querySelector(".valgliste");
    if (!knap || !liste || !window.matchMedia) return;
    var mq = window.matchMedia("(max-width:1179px),(pointer:coarse)");
    var panel = document.createElement("div");
    panel.className = "filtre-panel";
    panel.id = "filtre-panel";
    panel.hidden = true;
    bar.appendChild(panel);
    knap.setAttribute("role", "button");
    knap.setAttribute("aria-controls", "filtre-panel");
    knap.setAttribute("aria-expanded", "false");
    var dele = [];
    function husk(el) {
      var maerke = document.createComment("");
      el.parentNode.insertBefore(maerke, el);
      dele.push({ el: el, maerke: maerke });
    }
    var fra = [bar.querySelector(".valgbaand__mrk"), bar.querySelector(".valgbaand__maal [data-nulstil]"), liste]
      .concat([].slice.call(bar.querySelectorAll(".facetter__net>.facetter__hold")), [bar.querySelector(".facet-omfang")]);
    fra.forEach(function (el) { if (el) husk(el); });
    function aabn(vis) {
      panel.hidden = !vis;
      knap.setAttribute("aria-expanded", vis ? "true" : "false");
      if (vis) panel.scrollIntoView({ block: "nearest" });
    }
    function placer() {
      if (mq.matches) dele.forEach(function (d) { panel.appendChild(d.el); });
      else {
        aabn(false);
        dele.forEach(function (d) { d.maerke.parentNode.insertBefore(d.el, d.maerke.nextSibling); });
      }
    }
    function taelFiltre() {
      var n = form.querySelectorAll("[data-valg][data-valgt], .valg--skala:not([hidden])").length;
      knap.setAttribute("data-n", String(n));
      panel.setAttribute("data-n", String(n));
    }
    knap.addEventListener("click", function (e) {
      if (!mq.matches) return;
      e.preventDefault();
      aabn(panel.hidden);
    });
    knap.addEventListener("keydown", function (e) {
      if (e.key !== " " || !mq.matches) return;
      e.preventDefault();
      aabn(panel.hidden);
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !bar.contains(e.target)) aabn(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || panel.hidden) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      aabn(false);
      knap.focus({ preventScroll: true });
    }, true);
    new MutationObserver(taelFiltre).observe(liste, { attributes: true, subtree: true, attributeFilter: ["hidden", "data-valgt"] });
    mq.addEventListener("change", placer);
    placer();
    taelFiltre();
  })();

  /* Foerste opdatering koerer to gange og den anden taeller: `:target` er foerst sat ved readyState "complete", men filen koerer med `defer` foer da. */
  opdater();
  if (document.readyState === 'complete') opdater();
  else window.addEventListener('load', opdater);
})();
