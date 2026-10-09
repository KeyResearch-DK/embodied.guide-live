/* assets/producent.js — sortering af producentsidens tabel (spor/prodsort,
 * 15. sep 2026, JPK ordret: "På producentsidne skal man kunne sorterer på
 * kolonne niveau hhv stigende/faldne ved klik på kolonneoverskrifterne
 * Manufacturer, Country og Count."
 *
 * UDEN DENNE FIL ER TABELLEN PRAECIS DEN, DEN VAR FOER SPORET — det er
 * JPK's egen beslutning (popup 15. sep 2026): ingen doede knapper. Al
 * markup, der goer et kolonnehoved klikbart (knappen, aria-sort, pilen),
 * bliver derfor foerst tegnet HERFRA, aldrig af tools/skabelon/producent.mjs.
 * `tools/skabelon/producent.mjs`s FIRE <th>-tags roeres IKKE — de er
 * byte-identiske med foer sporet (K11 i tests/dele/09-katalog-producent-
 * sider.mjs laaser deres praecise streng). Sorterbarheden laeses derfor
 * positionelt af de klasser, skabelonen ALLEREDE satte foer dette spor:
 * enhver <th> UDEN class="prod-navne" er sorterbar, og class="figur" (kun
 * Count) er signalet om at sortere som TAL frem for tekst. Kun tabellens
 * EGEN <table>-tag faar tre nye, usynlige data-attributter (data-sorter-
 * stigende/-faldende/-hjaelp) til oversat tekst — samme facon som
 * data-antal-en/-flere i assets/katalog.js.
 *
 * Modellernes kolonne (4., class="prod-navne") kan ikke sorteres — JPK
 * navngav kun de tre foerste.
 */
(function () {
  "use strict";

  function parseTal(tekst) {
    var raat = String(tekst || "").replace(/[^\d-]/g, "");
    if (raat === "" || raat === "-") return null;
    var n = parseInt(raat, 10);
    return Number.isNaN(n) ? null : n;
  }

  function typeAf(th) {
    return th.classList.contains("figur") ? "tal" : "tekst";
  }

  function klik(tabel, th, alleTh, sprog) {
    var type = typeAf(th);
    var nuvaerende = th.getAttribute("aria-sort");
    var retning = nuvaerende === "ascending" ? "descending" : "ascending";
    var stigendeTekst = tabel.getAttribute("data-sorter-stigende") || "";
    var faldendeTekst = tabel.getAttribute("data-sorter-faldende") || "";

    alleTh.forEach(function (t) {
      t.removeAttribute("aria-sort");
      var ikon = t.querySelector(".prod-tabel__sortikon");
      if (ikon) {
        ikon.classList.remove(
          "prod-tabel__sortikon--synlig",
          "prod-tabel__sortikon--asc",
          "prod-tabel__sortikon--desc",
        );
      }
      var knap = t.querySelector(".prod-tabel__sorterknap");
      if (knap) knap.title = stigendeTekst;
    });

    th.setAttribute("aria-sort", retning);
    var aktivIkon = th.querySelector(".prod-tabel__sortikon");
    if (aktivIkon) {
      aktivIkon.classList.add(
        "prod-tabel__sortikon--synlig",
        retning === "ascending"
          ? "prod-tabel__sortikon--asc"
          : "prod-tabel__sortikon--desc",
      );
    }
    var aktivKnap = th.querySelector(".prod-tabel__sorterknap");
    if (aktivKnap) {
      // Titlen fortaeller, hvad NAESTE klik goer — ikke den nuvaerende
      // tilstand, som aria-sort allerede baerer for skaermlaesere.
      aktivKnap.title =
        retning === "ascending" ? faldendeTekst : stigendeTekst;
    }

    var index = Array.prototype.indexOf.call(th.parentElement.children, th);
    var tbody = tabel.querySelector("tbody");
    if (!tbody) return;
    var raekker = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
    var faktor = retning === "ascending" ? 1 : -1;

    raekker.sort(function (a, b) {
      var A = a.children[index];
      var B = b.children[index];
      var Atekst = A ? A.textContent.trim() : "";
      var Btekst = B ? B.textContent.trim() : "";
      if (type === "tal") {
        var an = parseTal(Atekst);
        var bn = parseTal(Btekst);
        // Manglende tal staar altid sidst, uanset retning — "ikke oplyst"
        // maa ikke skifte plads afhaengigt af stigende/faldende, ellers
        // ligner en tom celle et tal, der bare er meget hoejt eller lavt.
        if (an === null && bn === null) return 0;
        if (an === null) return 1;
        if (bn === null) return -1;
        return (an - bn) * faktor;
      }
      return Atekst.localeCompare(Btekst, sprog) * faktor;
    });

    raekker.forEach(function (r) {
      tbody.appendChild(r);
    });
  }

  function init() {
    var tabel = document.querySelector(".prod-tabel");
    if (!tabel) return;
    var sorterbareTh = Array.prototype.slice.call(
      tabel.querySelectorAll("thead th"),
    ).filter(function (th) {
      return !th.classList.contains("prod-navne");
    });
    if (sorterbareTh.length === 0) return;

    var sprog = document.documentElement.lang || "en";
    var hjaelpTekst = tabel.getAttribute("data-sorter-hjaelp") || "";
    var stigendeTekst = tabel.getAttribute("data-sorter-stigende") || "";

    if (hjaelpTekst) {
      var hjaelp = document.createElement("p");
      hjaelp.className = "kunskaerm";
      hjaelp.textContent = hjaelpTekst;
      var wrap = tabel.closest(".prod-tabel-wrap") || tabel.parentElement;
      wrap.parentElement.insertBefore(hjaelp, wrap);
    }

    sorterbareTh.forEach(function (th) {
      var navn = th.textContent.trim();
      th.textContent = "";

      var knap = document.createElement("button");
      knap.type = "button";
      knap.className = "prod-tabel__sorterknap";
      knap.title = stigendeTekst;

      var navnSpan = document.createElement("span");
      navnSpan.className = "prod-tabel__sortnavn";
      navnSpan.textContent = navn;
      knap.appendChild(navnSpan);

      var ikonSpan = document.createElement("span");
      ikonSpan.className = "prod-tabel__sortikon";
      ikonSpan.setAttribute("aria-hidden", "true");
      // KUN klassen ikon paa svg'en - IKKE dens lille-variant (skrevet uden
      // anfoerselstegn her med vilje, saa denne kommentar ikke selv scanner
      // som en brug af den i tests/dele/57-doed-css.mjs). Den variant staar
      // paa 57-doed-css.mjs' beskyttede doedliste, fordi EU-sektionen (dens
      // eneste tidligere forbruger) blev fjernet 4. sep 2026 - genbruges den
      // her, bliver den levende igen, og testen ville fejle paa et tal, der
      // ikke laengere passer. Vores egen 14px staar i
      // .prod-tabel__sortikon .ikon i generator.css i stedet.
      // F4 (Å425, 5. okt 2026): to ikoner i samme felt. Det neutrale (↕, to
      // vinkler) vises paa de kolonner, der KAN sorteres men ikke er det;
      // pilen vises kun paa den sorterede (--synlig). CSS skifter dem.
      ikonSpan.innerHTML =
        '<svg class="ikon prod-tabel__neutral" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9.5 12 5.5l4 4"/><path d="M8 14.5l4 4 4-4"/></svg>' +
        '<svg class="ikon prod-tabel__pil" aria-hidden="true"><use href="#i-pil"></use></svg>';
      knap.appendChild(ikonSpan);

      th.appendChild(knap);
      th.classList.add("prod-tabel__th--sorterbar");

      knap.addEventListener("click", function () {
        klik(tabel, th, sorterbareTh, sprog);
      });
    });

    // Tabellen staar sorteret efter foerste kolonne (producentnavn, stigende),
    // som skabelonen skriver raekkerne. Det skal ses fra start: aria-sort og
    // synlig pil paa den kolonne, uden at roere raekkerne.
    var start = sorterbareTh[0];
    start.setAttribute("aria-sort", "ascending");
    var startIkon = start.querySelector(".prod-tabel__sortikon");
    if (startIkon) {
      startIkon.classList.add(
        "prod-tabel__sortikon--synlig",
        "prod-tabel__sortikon--asc",
      );
    }
    var startKnap = start.querySelector(".prod-tabel__sorterknap");
    if (startKnap) startKnap.title = tabel.getAttribute("data-sorter-faldende") || "";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* Verdenskortet (L210, Å391; tools/skabelon/producent.mjs' verdenskort())
 * og bykortet (L214, Å398).
 *
 * UDEN DENNE FIL er kortet et billede med bobler og en tekstlinje med alle
 * lande og tal (DESIGN.md «Gør og lad være»: en betjening er brugbar uden
 * JavaScript, eller skjult til JS taender den). Herfra bliver hver boble og
 * hvert land en knap, der filtrerer tabellen til landets producenter.
 *
 *   - Et land vaelges (boble eller landelinje): tabellen filtreres med det
 *     samme. Har siden et bykort (data-bykort), hentes landets fil
 *     (bykort-<kode>.json), og kortet ZOOMER ind paa landet og viser én boble
 *     pr. by; landelinjen bliver til en bylinje med "city not stated" sidst.
 *     Et tryk paa en by filtrerer tabellen til byens producenter.
 *   - "Back to world", Escape og tilbage-knappen gaar by -> land -> verden.
 *     Samme by igen gaar tilbage til landet.
 *   - Adressen: ?country=<ADM0_A3>&city=<by-id> (fx ?country=chn&city=shenzhen,
 *     city=none for "city not stated") - sprogneutralt. Indlaesning med
 *     parametrene giver samme tilstand; pushState + popstate.
 *   - Kan bykortet ikke hentes (file://, offline), er landet stadig valgt og
 *     tabellen filtreret - kortet zoomer bare ikke (L210's opfoersel).
 *   - Raekkerne findes paa landecellens data-land (land) og paa raekkens link
 *     (by: bykortets slugs); sorteringen ovenfor roerer ikke `hidden`.
 *   - Al tekst kommer fra skabelonen (data-tip/-etiket/-valgt og bykortets
 *     fil), aldrig herfra.
 *
 * BEVAEGELSEN (DESIGN.md «Verdenskortet», punkt 10): zoomet er én bevaegelse
 * paa --tid med --slyng (system.css): verdenskortet forstoerres, til landet
 * fylder fladen, de andre lande-bobler toner ud, landets boble foelger med ind
 * og DELER SIG i byerne - bybobler, hvis areal tilsammen er landets, flyver ud
 * fra landets boble til deres by. Ud igen er hurtigere. prefers-reduced-motion:
 * ingen overgang overhovedet - tilstanden skifter paa stedet (A2).
 */
(function () {
  "use strict";

  var PARAM = "country";
  var BY_PARAM = "city";

  function init() {
    var sektion = document.querySelector("[data-verdenskort]");
    var tabel = document.querySelector(".prod-tabel");
    if (!sektion || !tabel) return;
    var flade = sektion.querySelector(".verdenskort__flade");
    var tip = sektion.querySelector("[data-korttip]");
    var status = sektion.querySelector("[data-kortstatus]");
    var statusTekst = sektion.querySelector("[data-kortstatus-tekst]");
    var melding = sektion.querySelector("[data-kortmelding]");
    var visAlle = sektion.querySelector("[data-kortnulstil]");
    var tilbage = sektion.querySelector("[data-korttilbage]");
    var kunBy = sektion.querySelector("[data-kun-by]");
    var helLand = sektion.querySelector("[data-korthelland]");
    var landeliste = sektion.querySelector("[data-kortlande]");
    var noegleValg = sektion.querySelector("[data-kun-kortvalg]");
    var bykortSti = sektion.getAttribute("data-bykort");
    var visAlleTekst = visAlle ? visAlle.textContent : "";
    var tilVerdenTekst = visAlle ? visAlle.getAttribute("data-til-verden") : null;
    var noegleTekst = noegleValg ? noegleValg.textContent : "";
    var info = {};
    var knapper = [];
    var landeBobler = [];
    var listeknap = {};
    var valgt = null;
    var by = null;
    var zoom = null; // { kode, data, lag, linje, bobler: [], knap: {} }
    var hentet = {};
    var gang = 0; // skifter ved hvert valg - en sen fil eller timer ser, den er foraeldet

    var raekker = Array.prototype.slice.call(tabel.querySelectorAll("tbody tr"));
    var slugAf = new Map();
    raekker.forEach(function (tr) {
      var a = tr.querySelector("td a");
      if (a) slugAf.set(tr, (a.getAttribute("href") || "").replace(/\/$/, ""));
    });

    var rolig = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false };
    var TID = (function () {
      var v = getComputedStyle(document.documentElement).getPropertyValue("--tid").trim();
      var n = parseFloat(v);
      if (Number.isNaN(n)) return 420;
      return /ms$/.test(v) ? n : n * 1000;
    })();
    var SLYNG =
      getComputedStyle(document.documentElement).getPropertyValue("--slyng").trim() || "ease-out";

    function animer(el, rammer, valg) {
      if (rolig.matches || !el.animate) return null;
      return el.animate(rammer, valg);
    }

    function tilKnap(span, klasse) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = klasse;
      Array.prototype.slice.call(span.attributes).forEach(function (a) {
        if (a.name === "class" || a.name === "aria-hidden") return;
        b.setAttribute(a.name, a.value);
      });
      b.setAttribute("aria-pressed", "false");
      while (span.firstChild) b.appendChild(span.firstChild);
      span.parentNode.replaceChild(b, span);
      return b;
    }

    function visTip(b) {
      if (!tip) return;
      tip.textContent = b.getAttribute("data-tip") || "";
      tip.hidden = false;
      var fr = flade.getBoundingClientRect();
      var br = b.getBoundingClientRect();
      var tw = tip.offsetWidth;
      var th = tip.offsetHeight;
      var cx = br.left + br.width / 2 - fr.left;
      var venstre = Math.max(0, Math.min(fr.width - tw, cx - tw / 2));
      var top = br.top - fr.top - th - 6;
      if (top < 0) top = br.bottom - fr.top + 6;
      tip.style.left = venstre + "px";
      tip.style.top = top + "px";
    }

    function skjulTip() {
      if (tip) tip.hidden = true;
    }

    /* ------------------------------------------------ tabel og tekster */

    function filtrer() {
      var slugs = null;
      if (zoom && by && zoom.data.valg[by]) slugs = zoom.data.valg[by].slugs;
      raekker.forEach(function (tr) {
        if (slugs) {
          tr.hidden = slugs.indexOf(slugAf.get(tr)) === -1;
          return;
        }
        var celle = tr.querySelector("td[data-land]");
        var land = celle ? celle.getAttribute("data-land") : "";
        tr.hidden = !!valgt && land !== valgt;
      });
    }

    function tekster() {
      var byValg = zoom && by ? zoom.data.valg[by] : null;
      knapper.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-boble") === valgt ? "true" : "false");
      });
      if (zoom) {
        Object.keys(zoom.knap).forEach(function (id) {
          zoom.knap[id].forEach(function (b) {
            b.setAttribute("aria-pressed", id === by ? "true" : "false");
          });
        });
      }
      var tekst = byValg ? byValg.valgt : valgt ? info[valgt] : "";
      statusTekst.textContent = tekst;
      melding.textContent = tekst;
      status.hidden = !valgt;
      if (tilbage) tilbage.hidden = !valgt;
      if (kunBy) kunBy.hidden = !byValg;
      if (helLand && zoom) helLand.textContent = zoom.data.helLand;
      if (visAlle) visAlle.textContent = zoom && tilVerdenTekst ? tilVerdenTekst : visAlleTekst;
    }

    function skubAdresse() {
      var u = new URL(window.location.href);
      if (valgt) u.searchParams.set(PARAM, valgt);
      else u.searchParams.delete(PARAM);
      if (valgt && by) u.searchParams.set(BY_PARAM, by);
      else u.searchParams.delete(BY_PARAM);
      try {
        window.history.pushState(
          { verdenskort: valgt, by: by },
          "",
          u.pathname + u.search + u.hash,
        );
      } catch (e) {
        // file:// (en lokal kopi af siden) kan afvise pushState. Filtret
        // er allerede lagt; kun adressen bliver staaende.
      }
    }

    /* ------------------------------------------------------- bykortet */

    function hent(kode) {
      if (!bykortSti) return Promise.reject(new Error("intet bykort"));
      if (!hentet[kode]) {
        hentet[kode] = fetch(bykortSti + kode + ".json").then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        });
        hentet[kode].catch(function () {
          delete hentet[kode];
        });
      }
      return hentet[kode];
    }

    /** Landets boble som punkt i zoomets ramme, i px fra fladens hjoerne. */
    function iZoom(boble, vis, fr) {
      var x = parseFloat(boble.style.getPropertyValue("--x"));
      var y = parseFloat(boble.style.getPropertyValue("--y"));
      var k = 100 / vis[2];
      return {
        x: (((x - vis[0]) * k) / 100) * fr.width,
        y: (((y - vis[1]) * k) / 100) * fr.height,
        fx: (x / 100) * fr.width,
        fy: (y / 100) * fr.height,
      };
    }

    function landBoble(kode) {
      for (var i = 0; i < landeBobler.length; i++) {
        if (landeBobler[i].getAttribute("data-boble") === kode) return landeBobler[i];
      }
      return null;
    }

    /** Laegger landets bylag og bylinje ind og zoomer. */
    function zoomInd(kode, data, bevaeg) {
      // Svaeveteksten og musen-over hoerer til en boble, der nu forsvinder.
      skjulTip();
      saetNaer(null);
      var fr = flade.getBoundingClientRect();
      var vis = data.vis;
      flade.style.setProperty("--vk-x", vis[0]);
      flade.style.setProperty("--vk-y", vis[1]);
      flade.style.setProperty("--vk-k", 100 / vis[2]);
      sektion.classList.add("verdenskort--klip");

      // Bylaget: landets omrids (stidata fra bykortets fil, hav + naboer +
      // landet) under byernes bobler og streger (skabelonens markup).
      var lag = document.createElement("div");
      lag.className = "verdenskort__bylag";
      lag.setAttribute("data-bylag", kode);
      var b0 = data.kort[0];
      var h0 = data.kort[1];
      lag.innerHTML =
        '<svg class="verdenskort__land" viewBox="0 0 ' + b0 + " " + h0 +
        '" aria-hidden="true" focusable="false"><rect width="' + b0 + '" height="' + h0 +
        '"/><path class="verdenskort__nabo" d="' + data.naboer +
        '"/><path class="verdenskort__fokus" d="' + data.fokus + '"/></svg>' + data.html;
      flade.appendChild(lag);
      landeliste.insertAdjacentHTML("afterend", data.linje);
      var linje = landeliste.nextElementSibling;
      landeliste.hidden = true;
      var z = { kode: kode, data: data, lag: lag, linje: linje, bobler: [], knap: {} };

      Array.prototype.slice.call(lag.querySelectorAll("span.verdenskort__boble")).forEach(function (span) {
        var b = tilKnap(span, "knap " + span.className);
        var id = b.getAttribute("data-by");
        b.setAttribute("aria-label", b.getAttribute("data-etiket") || id);
        b.addEventListener("focus", function () {
          visTip(b);
        });
        b.addEventListener("blur", skjulTip);
        z.bobler.push(b);
        (z.knap[id] = z.knap[id] || []).push(b);
      });
      Array.prototype.slice.call(linje.querySelectorAll("span[data-by]")).forEach(function (span) {
        if (span.parentNode.tagName !== "LI") return;
        var b = tilKnap(span, "knap knap--tekst");
        var id = b.getAttribute("data-by");
        (z.knap[id] = z.knap[id] || []).push(b);
        b.addEventListener("click", function () {
          skiftBy(id);
        });
      });
      if (noegleValg) {
        noegleValg.textContent = data.noegle ? " " + data.noegle : "";
      }
      zoom = z;
      sektion.classList.add("verdenskort--zoom");

      if (!bevaeg) return;
      // Landets boble foelger med ind og deler sig i byerne. Positionerne er
      // regnet i px ved starten (FLIP); slutpositionerne er procent, saa en
      // aendret bredde bagefter ikke flytter noget.
      var boble = landBoble(kode);
      var p = boble ? iZoom(boble, vis, fr) : null;
      if (boble && p) {
        var dx = p.x - p.fx;
        var dy = p.y - p.fy;
        animer(boble, [
          { transform: "translate(-50%, -50%)", opacity: 1, visibility: "visible" },
          { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))", opacity: 1, visibility: "visible", offset: 0.75 },
          { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))", opacity: 0, visibility: "visible" },
        ], { duration: TID * 1.35, easing: SLYNG });
      }
      var kortet = lag.querySelector(".verdenskort__land");
      if (kortet) {
        animer(kortet, [{ opacity: 0 }, { opacity: 1 }], {
          duration: TID * 0.5, delay: TID * 0.55, easing: "ease-out", fill: "backwards",
        });
      }
      var streger = lag.querySelector(".verdenskort__streger");
      if (streger) {
        animer(streger, [{ opacity: 0 }, { opacity: 1 }], {
          duration: TID * 0.4, delay: TID * 1.2, easing: "ease-out", fill: "backwards",
        });
      }
      z.bobler.forEach(function (b, i) {
        var bx = (parseFloat(b.style.getPropertyValue("--x")) / 100) * fr.width;
        var by0 = (parseFloat(b.style.getPropertyValue("--y")) / 100) * fr.height;
        var fra = p
          ? "translate(calc(-50% + " + (p.x - bx) + "px), calc(-50% + " + (p.y - by0) + "px))"
          : "translate(-50%, -50%) scale(0.6)";
        animer(b, [
          { transform: fra, opacity: 0 },
          { transform: fra, opacity: 1, offset: 0.15 },
          { transform: "translate(-50%, -50%)", opacity: 1 },
        ], {
          duration: TID * 0.9,
          delay: TID * 0.7 + Math.min(i * 16, 120),
          easing: SLYNG,
          fill: "backwards",
        });
      });
    }

    /** Fjerner bylaget og zoomer ud til verden. */
    function zoomUd(bevaeg) {
      var z = zoom;
      if (!z) return;
      zoom = null;
      by = null;
      var min = gang;
      skjulTip();
      sektion.classList.remove("verdenskort--zoom");
      landeliste.hidden = false;
      if (z.linje.parentNode) z.linje.parentNode.removeChild(z.linje);
      if (noegleValg) noegleValg.textContent = noegleTekst;
      var fjern = function () {
        if (z.lag.parentNode) z.lag.parentNode.removeChild(z.lag);
        if (gang === min && !zoom) sektion.classList.remove("verdenskort--klip");
      };
      if (!bevaeg || rolig.matches || !z.lag.animate) {
        fjern();
        if (!zoom) sektion.classList.remove("verdenskort--klip");
        return;
      }
      z.bobler.forEach(function (b) {
        b.tabIndex = -1;
      });
      z.lag.style.pointerEvents = "none";
      var ud = z.lag.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: TID * 0.45, easing: "ease-in", fill: "forwards",
      });
      // Landets boble samler sig igen og glider tilbage paa sin plads.
      var boble = landBoble(z.kode);
      if (boble) {
        var fr = flade.getBoundingClientRect();
        var p = iZoom(boble, z.data.vis, fr);
        var dx = p.x - p.fx;
        var dy = p.y - p.fy;
        animer(boble, [
          { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))", opacity: 0, visibility: "visible" },
          { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))", opacity: 1, visibility: "visible", offset: 0.3 },
          { transform: "translate(-50%, -50%)", opacity: 1, visibility: "visible" },
        ], { duration: TID * 1.1, easing: SLYNG });
      }
      ud.onfinish = fjern;
      window.setTimeout(fjern, TID * 1.2);
    }

    /* ---------------------------------------------------------- valg */

    /** Hele tilstanden: land (eller null), by (eller null). */
    function vaelg(kode, byId, skub, bevaeg) {
      gang += 1;
      var min = gang;
      var nyt = kode && info[kode] ? kode : null;
      if (zoom && zoom.kode !== nyt) zoomUd(bevaeg && !nyt);
      valgt = nyt;
      by = zoom && byId && zoom.data.valg[byId] ? byId : null;
      filtrer();
      tekster();
      if (skub) skubAdresse();
      if (!valgt || zoom || !bykortSti) return Promise.resolve();
      return hent(valgt).then(function (data) {
        if (min !== gang || zoom) return;
        zoomInd(valgt, data, bevaeg);
        by = byId && data.valg[byId] ? byId : null;
        filtrer();
        tekster();
      }, function () {
        // Intet bykort: landet er valgt og tabellen filtreret som i L210.
      });
    }

    function skift(kode, fraTastatur) {
      if (valgt === kode) {
        vaelg(null, null, true, true);
        return;
      }
      vaelg(kode, null, true, true).then(function () {
        // Landets boble og landelinjen er vaek i zoomet - fokus maa ikke
        // falde ud af siden. Foerste by, ellers "city not stated".
        if (!zoom || zoom.kode !== kode) return;
        var foerste = zoom.bobler[0] || zoom.linje.querySelector("button");
        if (foerste && fraTastatur) {
          foerste.focus({ preventScroll: true });
        }
      });
    }

    function skiftBy(id) {
      if (!zoom) return;
      vaelg(valgt, by === id ? null : id, true, true);
    }

    function tilVerden() {
      var foer = valgt;
      vaelg(null, null, true, true);
      // Knappen forsvinder med linjen - fokus maa ikke falde ud af siden.
      if (foer && listeknap[foer]) listeknap[foer].focus({ preventScroll: true });
    }

    /* Hvilken boble et tryk gaelder. Trykfladerne har et gulv paa 24 x 24 px
     * (generator.css), saa i en klynge (Europa ved 390 px, byerne i Kinas
     * Pearl River-delta) ligger et tryk i flere boblers flade, og den oeverste
     * - den mindste - ville vinde, ogsaa midt paa en anden boble (maalt:
     * Schweiz' midte ramte Spanien). Reglen: af de bobler, hvis trykflade
     * rummer punktet, vinder den, hvis midtpunkt er naermest. Rummer ingen
     * punktet, er svaret null. I zoomet er det byernes bobler, der gaelder. */
    function naermeste(x, y) {
      var bedst = null;
      var bedstAfstand = Infinity;
      (zoom ? zoom.bobler : landeBobler).forEach(function (b) {
        var r = b.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var radius = Math.max(r.width, 24) / 2;
        var afstand = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
        if (afstand <= radius && afstand < bedstAfstand) {
          bedst = b;
          bedstAfstand = afstand;
        }
      });
      return bedst;
    }

    function fraAdressen() {
      var q = new URLSearchParams(window.location.search);
      var k = q.get(PARAM);
      k = k ? k.toLowerCase() : null;
      var b = q.get(BY_PARAM);
      return { kode: k && info[k] ? k : null, by: b ? b.toLowerCase() : null };
    }

    Array.prototype.slice
      .call(flade.querySelectorAll("span.verdenskort__boble"))
      .forEach(function (span) {
        var b = tilKnap(span, "knap " + span.className);
        var kode = b.getAttribute("data-boble");
        info[kode] = b.getAttribute("data-valgt") || kode;
        b.setAttribute("aria-label", b.getAttribute("data-etiket") || kode);
        knapper.push(b);
        landeBobler.push(b);
        b.addEventListener("focus", function () {
          visTip(b);
        });
        b.addEventListener("blur", skjulTip);
      });

    // Svaeveteksten foelger samme regel som trykket, saa den aldrig navngiver
    // et andet land end det, et klik paa samme sted vaelger.
    // Klikket lyttes paa KORTET, ikke paa hver boble: i en klynge kan
    // mousedown og mouseup ramme to forskellige bobler (den trykkede flytter
    // sig 1 px med .knap:active), og saa gaar klikket til kortet og ingen
    // boble (maalt ved 390: Frankrigs midtpunkt valgte intet). Tastatur
    // (Enter/mellemrum) giver detail 0 og intet punkt: den fokuserede boble
    // gaelder. Mus og tryk: naermeste midtpunkt.
    flade.addEventListener("click", function (e) {
      var fokus = e.target.closest ? e.target.closest("button.verdenskort__boble") : null;
      var ramt = e.detail === 0 ? fokus : naermeste(e.clientX, e.clientY);
      if (!ramt) return;
      var byId = ramt.getAttribute("data-by");
      if (byId) {
        skiftBy(byId);
      } else {
        skift(ramt.getAttribute("data-boble"), e.detail === 0);
      }
      if (byId && e.detail !== 0 && ramt !== document.activeElement) ramt.focus({ preventScroll: true });
    });

    var naer = null;
    function saetNaer(b) {
      if (naer === b) return;
      if (naer) naer.classList.remove("verdenskort__boble--naer");
      naer = b;
      if (b) b.classList.add("verdenskort__boble--naer");
    }
    flade.addEventListener("mousemove", function (e) {
      var b = naermeste(e.clientX, e.clientY);
      saetNaer(b);
      if (b) visTip(b);
      else skjulTip();
    });
    flade.addEventListener("mouseleave", function () {
      saetNaer(null);
      skjulTip();
    });

    Array.prototype.slice
      .call(sektion.querySelectorAll("[data-kortlande] span[data-boble]"))
      .forEach(function (span) {
        var b = tilKnap(span, "knap knap--tekst");
        var kode = b.getAttribute("data-boble");
        listeknap[kode] = b;
        knapper.push(b);
        b.addEventListener("click", function (e) {
          skift(kode, e.detail === 0);
        });
      });

    if (visAlle) visAlle.addEventListener("click", tilVerden);
    if (helLand) {
      helLand.addEventListener("click", function () {
        var foer = by;
        vaelg(valgt, null, true, true);
        if (zoom && foer && zoom.knap[foer]) {
          var b = zoom.knap[foer][zoom.knap[foer].length - 1];
          if (b) b.focus({ preventScroll: true });
        }
      });
    }

    // Escape gaar ét trin tilbage: by -> land -> verden.
    sektion.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !valgt) return;
      e.preventDefault();
      if (by) vaelg(valgt, null, true, true);
      else tilVerden();
    });

    window.addEventListener("popstate", function () {
      var a = fraAdressen();
      vaelg(a.kode, a.by, false, true);
    });

    var start = fraAdressen();
    if (start.kode) vaelg(start.kode, start.by, false, false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
