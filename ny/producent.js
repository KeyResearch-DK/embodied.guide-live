/* Sorteringsmarkup tegnes herfra, aldrig af skabelonen: ellers får tabellen uden JS døde knapper. */
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

    tabel.sorterIgen = function () {
      sorterRaekker(tabel, th, type, retning, sprog);
    };
    tabel.sorterIgen();
  }

  function navnAfRaekke(r) {
    var l = r.querySelector("td a");
    return l ? l.textContent.trim() : "";
  }

  function sorterRaekker(tabel, th, type, retning, sprog) {
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
        var an = parseTal(A && A.hasAttribute("data-total") ? A.getAttribute("data-total") : Atekst);
        var bn = parseTal(B && B.hasAttribute("data-total") ? B.getAttribute("data-total") : Btekst);
        // Manglende tal står altid sidst, uanset retning: "ikke oplyst" må ikke ligne et meget højt eller lavt tal.
        if (an === null && bn === null) return navnAfRaekke(a).localeCompare(navnAfRaekke(b), sprog);
        if (an === null) return 1;
        if (bn === null) return -1;
        return (an - bn) * faktor || navnAfRaekke(a).localeCompare(navnAfRaekke(b), sprog);
      }
      return Atekst.localeCompare(Btekst, sprog) * faktor || navnAfRaekke(a).localeCompare(navnAfRaekke(b), sprog);
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
      // Kun klassen ikon på svg'en, ikke dens lille-variant (test 57 beskytter den); to ikoner i feltet: neutral ↕ og pilen på den sorterede (--synlig).
      ikonSpan.innerHTML =
        '<svg class="ikon prod-tabel__neutral" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9.5 12 5.5l4 4"/><path d="M8 14.5l4 4 4-4"/></svg>' +
        '<svg class="ikon prod-tabel__pil" aria-hidden="true"><use href="#i-pil"></use></svg>';
      knap.appendChild(ikonSpan);

      th.appendChild(knap);
      th.classList.add("prod-tabel__th--sorterbar");

      knap.addEventListener("click", function () {
        klik(tabel, th, sorterbareTh, sprog);
        synkValg();
      });
    });

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

    var valgBoks = document.querySelector("[data-prod-sort]");
    var valg = valgBoks && valgBoks.querySelector("select");
    function synkValg() {
      if (!valg) return;
      for (var i = 0; i < valg.options.length; i++) {
        var v = valg.options[i].value.split(":");
        if (sorterbareTh[+v[0]] && sorterbareTh[+v[0]].getAttribute("aria-sort") === v[1]) {
          valg.selectedIndex = i;
          return;
        }
      }
    }
    if (valg) {
      valgBoks.hidden = false;
      synkValg();
      valg.addEventListener("change", function () {
        var v = valg.value.split(":");
        var kol = sorterbareTh[+v[0]];
        for (var i = 0; i < 2 && kol.getAttribute("aria-sort") !== v[1]; i++) klik(tabel, kol, sorterbareTh, sprog);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

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
    var klasse = "";
    var byGamle = null;
    var byUd = [];
    var zoom = null;
    var hentet = {};
    var gang = 0;

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

    var soegFelt = document.querySelector("[data-prodsoeg] input[type=search]");
    var taeller = document.querySelector("[data-prod-taeller]");
    var tom = document.querySelector("[data-prod-tom]");
    var navnAf = new Map();
    raekker.forEach(function (tr) {
      var a = tr.querySelector("td a");
      navnAf.set(tr, a ? a.textContent.toLowerCase() : "");
    });

    var modeller = new Map();
    raekker.forEach(function (tr) {
      modeller.set(tr, Array.prototype.slice.call(tr.querySelectorAll("td.prod-navne a")).map(function (a) {
        return { a: a, tekst: a.textContent, lav: a.textContent.toLowerCase(), hit: false };
      }));
    });
    var landTekst = new Map();
    raekker.forEach(function (tr) {
      var c = tr.querySelector("td[data-land]");
      var p = tr.querySelector(".pland");
      landTekst.set(tr, { c: c ? c.textContent : "", p: p ? p.textContent : "" });
    });
    var sogRyd = document.querySelector("[data-prod-sog-ryd]");
    var nulstil = document.querySelector("[data-prod-reset]");
    var valgEl = document.querySelector("[data-prod-valg]");
    var sorterValg = document.querySelector("[data-prod-sort] select");
    var katalogLink = tom && tom.querySelector("[data-prod-tom-katalog]");
    var KATALOG = katalogLink ? JSON.parse(katalogLink.getAttribute("data-stier") || "{}") : {};
    var sogData = null;
    var MAKS_NAVNE = 6;
    var tast = false;
    document.addEventListener("keydown", function () { tast = true; }, true);
    document.addEventListener("pointerdown", function () { tast = false; }, true);
    function fokusTip(b) {
      if (tast) visTip(b);
    }

    function markerModeller(tr, q) {
      var traef = false;
      modeller.get(tr).forEach(function (m) {
        var k = q && !m.a.hidden ? m.lav.indexOf(q) : -1;
        if (k === -1) {
          if (m.hit) {
            m.a.textContent = m.tekst;
            m.hit = false;
            m.a.classList.remove("pr-hit");
          }
          return;
        }
        traef = true;
        if (m.hit) return;
        var mk = document.createElement("mark");
        mk.className = "pr-traef";
        mk.textContent = m.tekst.substr(k, q.length);
        m.a.textContent = "";
        m.a.appendChild(document.createTextNode(m.tekst.slice(0, k)));
        m.a.appendChild(mk);
        m.a.appendChild(document.createTextNode(m.tekst.slice(k + q.length)));
        m.hit = true;
        m.a.classList.add("pr-hit");
      });
      return traef;
    }

    function begraensNavne(tr) {
      var td = tr.querySelector("td.prod-navne");
      if (!td) return;
      var flere = td.querySelector(".pr-flere");
      if (flere) flere.parentNode.removeChild(flere);
      Array.prototype.slice.call(td.querySelectorAll(".pr-skjult")).forEach(function (e) { e.classList.remove("pr-skjult"); });
      var as = modeller.get(tr).map(function (m) { return m.a; }).filter(function (a) { return !a.hidden; });
      if (as.length <= MAKS_NAVNE) return;
      var synlige = 0;
      as.forEach(function (a, i) {
        if (i < MAKS_NAVNE || a.classList.contains("pr-hit")) synlige += 1;
        else a.classList.add("pr-skjult");
      });
      if (synlige === as.length) return;
      Array.prototype.slice.call(td.querySelectorAll(".etiket")).forEach(function (e) {
        var t = e.getAttribute("data-type");
        var af = as.filter(function (a) { return a.getAttribute("data-type") === t; });
        if (t && af.length && af.every(function (a) { return a.classList.contains("pr-skjult"); })) e.classList.add("pr-skjult");
      });
      var link = tr.querySelector("td a");
      var f = document.createElement("a");
      f.className = "pr-flere";
      f.href = link.getAttribute("href");
      f.textContent = tabel.getAttribute("data-flere").replace("{n}", as.length - synlige).replace("{navn}", link.textContent);
      td.appendChild(f);
    }

    function kortFolgerSoegning(aktiv) {
      var tael = {};
      if (aktiv) {
        raekker.forEach(function (tr) {
          var c = tr.querySelector("td[data-land]");
          if (!tr.hidden && c) tael[c.getAttribute("data-land")] = (tael[c.getAttribute("data-land")] || 0) + 1;
        });
      }
      var maks = Math.max.apply(null, [1].concat(Object.keys(tael).map(function (k) { return tael[k]; })));
      sektion.classList.toggle("pr-sogt", aktiv);
      landeBobler.forEach(function (b) {
        var tal = b.querySelector(".verdenskort__tal");
        var kode = b.getAttribute("data-boble");
        if (!tal || !kode || b.hasAttribute("data-ud")) return;
        if (b.getAttribute("data-pr-o") === null) {
          b.setAttribute("data-pr-o", tal.textContent);
          b.setAttribute("data-pr-d", b.style.getPropertyValue("--d"));
        }
        var n = aktiv ? tael[kode] || 0 : +b.getAttribute("data-pr-o");
        if (n && aktiv) b.style.setProperty("--d", Math.max(1.63, 14 * Math.sqrt(n / maks)).toFixed(2));
        else if (!aktiv) b.style.setProperty("--d", b.getAttribute("data-pr-d"));
        if (tal.textContent !== String(n)) tal.textContent = n;
        b.classList.toggle("pr-ingen", aktiv && n === 0);
        if (b.getAttribute("data-pr-e") === null) {
          b.setAttribute("data-pr-e", b.getAttribute("aria-label"));
          b.setAttribute("data-pr-t", b.getAttribute("data-tip") || "");
        }
        var land = b.getAttribute("data-pr-e").split(": ")[0];
        var prod = sektion.getAttribute(n === 1 ? "data-sogt-prod-en" : "data-sogt-prod").replace("{n}", n).replace(" ", " ");
        var sogt = function (skabelon) { return skabelon.replace("{land}", land).replace("{producenter}", prod); };
        b.setAttribute("aria-label", aktiv ? sogt(sektion.getAttribute("data-sogt-etiket")) : b.getAttribute("data-pr-e"));
        b.setAttribute("data-tip", aktiv ? sogt(sektion.getAttribute("data-sogt-tip")) : b.getAttribute("data-pr-t"));
      });
      Array.prototype.slice.call(landeliste.querySelectorAll("li")).forEach(function (li) {
        var a = li.querySelector(".verdenskort__antal");
        var k = li.querySelector("[data-boble]");
        if (!a || !k) return;
        if (a.getAttribute("data-pr-o") === null) a.setAttribute("data-pr-o", a.textContent);
        var n = aktiv ? tael[k.getAttribute("data-boble")] || 0 : +a.getAttribute("data-pr-o");
        if (a.textContent !== String(n)) a.textContent = n;
        li.classList.toggle("pr-ingen", aktiv && n === 0);
      });
      var fold = landeliste.querySelector(".verdenskort__fold details");
      if (fold) {
        if (aktiv && !fold.open) {
          fold.open = true;
          fold.setAttribute("data-pr-aabnet", "");
        } else if (!aktiv && fold.hasAttribute("data-pr-aabnet")) {
          fold.open = false;
          fold.removeAttribute("data-pr-aabnet");
        }
      }
      sektion.dispatchEvent(new CustomEvent("kort-opdateret"));
    }

    function tomKatalogLink(soeg) {
      if (!katalogLink) return;
      katalogLink.hidden = !soeg;
      if (!soeg) return;
      katalogLink.textContent = katalogLink.getAttribute("data-tekst").replace("{q}", soeg);
      (sogData || (sogData = fetch(katalogLink.getAttribute("data-sog")).then(function (r) { return r.json(); }))).then(function (data) {
        var ord = soeg.toLowerCase().split(/\s+/);
        var bedst = "ai_model";
        var mest = 0;
        Object.keys(KATALOG).forEach(function (k) {
          var n = (data[k] || []).filter(function (x) { return ord.every(function (o) { return x.indexOf(o) >= 0; }); }).length;
          if (n > mest) {
            mest = n;
            bedst = k;
          }
        });
        if (KATALOG[bedst]) katalogLink.href = KATALOG[bedst] + "?s=" + encodeURIComponent(soeg);
      }, function () {});
    }

    function byKolonne() {
      var by = {};
      if (zoom && valgt) {
        Object.keys(zoom.data.valg).forEach(function (k) {
          zoom.data.valg[k].slugs.forEach(function (s) { by[s] = navnFoerKolon(zoom.data.valg[k].valgt); });
        });
      }
      var alleMed = !!(zoom && valgt);
      raekker.forEach(function (tr) {
        var c = tr.querySelector("td[data-land]");
        var p = tr.querySelector(".pland");
        var o = landTekst.get(tr);
        var b = by[slugAf.get(tr)];
        if (!tr.hidden && !b) alleMed = false;
        if (c) c.textContent = b || o.c;
        if (p) p.textContent = b ? b + ", " + o.p : o.p;
      });
      var th = tabel.querySelector("thead th:nth-child(2) .prod-tabel__sortnavn");
      if (th) {
        if (th.getAttribute("data-pr-o") === null) th.setAttribute("data-pr-o", th.textContent);
        th.textContent = alleMed ? tabel.getAttribute("data-kolonne-by") : th.getAttribute("data-pr-o");
      }
      if (sorterValg) {
        Array.prototype.slice.call(sorterValg.options).forEach(function (o) {
          if (!o.hasAttribute("data-tekst-by")) return;
          if (o.getAttribute("data-pr-o") === null) o.setAttribute("data-pr-o", o.text);
          o.text = alleMed ? o.getAttribute("data-tekst-by") : o.getAttribute("data-pr-o");
        });
      }
    }

    function valgtLand() {
      if (!valgEl) return;
      var navn = valgt && info[valgt] ? navnFoerKolon(info[valgt]).trim() : "";
      valgEl.hidden = !navn;
      if (!navn) return;
      valgEl.querySelector(".pr-valg__navn").textContent = navn;
      valgEl.querySelector("button").setAttribute("aria-label", valgEl.getAttribute("data-tekst-fjern").replace("{land}", navn));
    }
    var tabtNote = "";
    function navnFoerKolon(tekst) {
      return String(tekst || "").split(":")[0];
    }
    function aktiveFiltre() {
      var f = [];
      var byValg = zoom && by ? zoom.data.valg[by] : null;
      if (valgt) f.push(navnFoerKolon(info[valgt]));
      if (byValg) f.push(navnFoerKolon(byValg.valgt));
      typeknapper.forEach(function (b) {
        if (klasse && b.getAttribute("data-prodtype") === klasse) f.push(b.textContent.trim());
      });
      return f;
    }
    function filtrer() {
      var slugs = null;
      if (zoom && by && zoom.data.valg[by]) slugs = zoom.data.valg[by].slugs;
      var q = soegFelt ? soegFelt.value.trim().toLowerCase() : "";
      var synlige = 0;
      raekker.forEach(function (tr) {
        var celle = tr.querySelector("td[data-land]");
        var land = celle ? celle.getAttribute("data-land") : "";
        var skjul = slugs
          ? slugs.indexOf(slugAf.get(tr)) === -1
          : !!valgt && land !== valgt;
        tr.hidden = skjul || (!!klasse && !(harType.get(tr) || {})[klasse]);
        var traef = markerModeller(tr, tr.hidden ? "" : q);
        if (q && !tr.hidden && !traef && navnAf.get(tr).indexOf(q) === -1) tr.hidden = true;
        if (!tr.hidden) synlige += 1;
      });
      raekker.forEach(begraensNavne);
      if (taeller) {
        var n = raekker.length;
        taeller.textContent = (n === 1 ? taeller.getAttribute("data-tekst-en") : taeller.getAttribute("data-tekst"))
          .replace("{n}", synlige)
          .replace("{total}", n) + (tabtNote ? ". " + tabtNote : "");
      }
      if (tom) {
        tom.hidden = synlige > 0;
        if (!tom.hidden) {
          var soeg = soegFelt ? soegFelt.value.trim() : "";
          var filtre = aktiveFiltre();
          var tomTekst = soeg && filtre.length ? tom.getAttribute("data-tekst-sog-filter") : soeg ? tom.getAttribute("data-tekst-sog") : tom.getAttribute("data-tekst-filter");
          tom.querySelector("[data-prod-tom-tekst]").textContent = tomTekst.replace("{q}", soeg).replace("{filtre}", filtre.join(" · "));
          tom.querySelector("[data-prod-tom-ryd]").hidden = !soeg;
          tom.querySelector("[data-prod-tom-filtre]").hidden = !filtre.length;
          tomKatalogLink(soeg);
        }
      }
      if (sogRyd) sogRyd.hidden = !(soegFelt && soegFelt.value);
      if (nulstil) nulstil.hidden = !(q || valgt || klasse);
      kortFolgerSoegning(!!q && !valgt);
      byKolonne();
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
      if (visAlle) visAlle.textContent = valgt && info[valgt] && tilVerdenTekst ? tilVerdenTekst.replace("{land}", navnFoerKolon(info[valgt]).trim()) : visAlleTekst;
      valgtLand();
      byKolonne();
    }

    function skubAdresse(erstat) {
      var u = new URL(window.location.href);
      if (valgt) u.searchParams.set(PARAM, valgt);
      else u.searchParams.delete(PARAM);
      if (valgt && by) u.searchParams.set(BY_PARAM, by);
      else u.searchParams.delete(BY_PARAM);
      try {
        window.history[erstat ? "replaceState" : "pushState"](
          { verdenskort: valgt, by: by },
          "",
          u.pathname + u.search + u.hash,
        );
      } catch (e) {
        // file:// (en lokal kopi af siden) kan afvise pushState. Filtret
        // er allerede lagt; kun adressen bliver staaende.
      }
    }

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

    // Smal skærm: flade og lag gøres s gange højere, så et højt land (Japan) fylder mindst halvdelen af bredden; kassen beskæres i siderne.
    var MIN_ANDEL = 0.52;
    var MAKS_HOEJDE = 420;
    function laegHoejere(lag, kort, fr) {
      var f = lag.querySelector(".verdenskort__fokus");
      var viewBox = lag.querySelector("svg").viewBox.baseVal;
      var s = 1;
      if (f && window.innerWidth < 900 && viewBox.width) {
        var bb = f.getBBox();
        var x0 = bb.x / viewBox.width;
        var x1 = (bb.x + bb.width) / viewBox.width;
        var side = Math.max(0.5 - x0, x1 - 0.5);
        s = Math.min(MIN_ANDEL / (x1 - x0), 0.5 / side, MAKS_HOEJDE / fr.height);
      }
      if (!(s > 1.05)) return 1;
      kort.style.width = s * 100 + "%";
      kort.style.marginLeft = -(s - 1) * 50 + "%";
      lag.style.width = s * 100 + "%";
      lag.style.left = -(s - 1) * 50 + "%";
      lag.style.right = "auto";
      return s;
    }

    function iZoom(boble, vis, fr, s) {
      var x = parseFloat(boble.style.getPropertyValue("--x"));
      var y = parseFloat(boble.style.getPropertyValue("--y"));
      var k = 100 / vis[2];
      s = s || 1;
      return {
        x: (((x - vis[0]) * k) / 100) * fr.width * s - ((s - 1) / 2) * fr.width,
        y: (((y - vis[1]) * k) / 100) * fr.height * s,
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

    function zoomInd(kode, data, bevaeg) {
      if (klasse && data.typer && data.typer[klasse]) data = Object.assign({}, data, data.typer[klasse]);
      skjulTip();
      saetNaer(null);
      var fr = flade.getBoundingClientRect();
      var vis = data.vis;
      flade.style.setProperty("--vk-x", vis[0]);
      flade.style.setProperty("--vk-y", vis[1]);
      flade.style.setProperty("--vk-k", 100 / vis[2]);
      sektion.classList.add("verdenskort--klip");

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
      var kortImg = flade.querySelector(".verdenskort__kort");
      var s = laegHoejere(lag, kortImg, fr);
      landeliste.insertAdjacentHTML("afterend", data.linje);
      var linje = landeliste.nextElementSibling;
      landeliste.hidden = true;
      var z = { kode: kode, data: data, lag: lag, linje: linje, bobler: [], knap: {}, s: s };

      Array.prototype.slice.call(lag.querySelectorAll("span.verdenskort__boble")).forEach(function (span) {
        var b = tilKnap(span, "knap " + span.className);
        var id = b.getAttribute("data-by");
        b.setAttribute("aria-label", b.getAttribute("data-etiket") || id);
        b.addEventListener("focus", function () {
          fokusTip(b);
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
      if (byGamle) {
        var gamle = byGamle;
        byGamle = null;
        animerBobler(gamle, z.bobler, "data-by", lag);
        byUd.forEach(function (g) {
          lag.appendChild(g);
        });
        byUd = [];
      }

      if (!bevaeg) return;
      var boble = landBoble(kode);
      var p = boble ? iZoom(boble, vis, fr, s) : null;
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
        var bx = (parseFloat(b.style.getPropertyValue("--x")) / 100) * fr.width * s - ((s - 1) / 2) * fr.width;
        var by0 = (parseFloat(b.style.getPropertyValue("--y")) / 100) * fr.height * s;
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

    function zoomUd(bevaeg) {
      var z = zoom;
      if (!z) return;
      zoom = null;
      by = null;
      var min = gang;
      skjulTip();
      if (z.s > 1) {
        z.lag.style.height = z.lag.getBoundingClientRect().height + "px";
        z.lag.style.bottom = "auto";
        var kortImg = flade.querySelector(".verdenskort__kort");
        kortImg.style.width = "";
        kortImg.style.marginLeft = "";
      }
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
      var boble = landBoble(z.kode);
      if (boble) {
        var fr = flade.getBoundingClientRect();
        var p = iZoom(boble, z.data.vis, fr, z.s);
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
        by = byId && zoom.data.valg[byId] ? byId : null;
        filtrer();
        tekster();
      }, function () {
      });
    }

    function skift(kode, fraTastatur) {
      tabtNote = "";
      if (valgt === kode) {
        vaelg(null, null, true, true);
        return;
      }
      vaelg(kode, null, true, true).then(function () {
        // Landets boble og landelinjen er vaek i zoomet - fokus maa ikke falde ud af siden.
        if (!zoom || zoom.kode !== kode) return;
        var foerste = zoom.bobler[0] || zoom.linje.querySelector("button");
        if (foerste && fraTastatur) {
          foerste.focus({ preventScroll: true });
        }
      });
    }

    function skiftBy(id) {
      tabtNote = "";
      if (!zoom) return;
      vaelg(valgt, by === id ? null : id, true, true);
    }

    function tilVerden() {
      tabtNote = "";
      var foer = valgt;
      vaelg(null, null, true, true);
      // Knappen forsvinder med linjen - fokus maa ikke falde ud af siden.
      if (foer && listeknap[foer]) listeknap[foer].focus({ preventScroll: true });
    }

    /* Radius læses fra CSS-trykfladen (::after): et hårdkodet gulv gør den større trykflade under 680 px død. */
    function naermeste(x, y) {
      var bedst = null;
      var bedstAfstand = Infinity;
      (zoom ? zoom.bobler : landeBobler).forEach(function (b) {
        var r = b.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var radius = Math.max(r.width, parseFloat(getComputedStyle(b, "::after").width) || 24) / 2;
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

    function bindLande() {
      info = {};
      knapper = [];
      landeBobler = [];
      listeknap = {};
      Array.prototype.slice
        .call(flade.querySelectorAll(":scope > span.verdenskort__boble"))
        .forEach(function (span) {
          var b = tilKnap(span, "knap " + span.className);
          var kode = b.getAttribute("data-boble");
          info[kode] = b.getAttribute("data-valgt") || kode;
          b.setAttribute("aria-label", b.getAttribute("data-etiket") || kode);
          knapper.push(b);
          landeBobler.push(b);
          b.addEventListener("focus", function () {
            fokusTip(b);
          });
          b.addEventListener("blur", skjulTip);
        });
      Array.prototype.slice
        .call(landeliste.querySelectorAll("span[data-boble]"))
        .forEach(function (span) {
          var b = tilKnap(span, "knap knap--tekst");
          var kode = b.getAttribute("data-boble");
          listeknap[kode] = b;
          knapper.push(b);
          b.addEventListener("click", function (e) {
            skift(kode, e.detail === 0);
          });
        });
    }

    var typeboks = document.querySelector("[data-prodtyper]");
    var typeknapper = typeboks
      ? Array.prototype.slice.call(typeboks.querySelectorAll("button[data-prodtype]"))
      : [];
    function kortHtml() {
      return Array.prototype.slice
        .call(flade.querySelectorAll(":scope > .verdenskort__streger, :scope > span.verdenskort__boble"))
        .map(function (el) {
          return el.outerHTML;
        })
        .join("\n");
    }
    var lagHtml = { "": { kort: kortHtml(), liste: landeliste.innerHTML } };
    function lagAf(k) {
      if (!lagHtml[k]) {
        var tk = sektion.querySelector('template[data-kortlag="' + k + '"]');
        var tl = sektion.querySelector('template[data-kortliste="' + k + '"]');
        if (!tk || !tl) return null;
        lagHtml[k] = { kort: tk.innerHTML, liste: tl.innerHTML };
      }
      return lagHtml[k];
    }
    var typetekster = Array.prototype.slice
      .call(document.querySelectorAll("[data-typetekst]"))
      .map(function (el) {
        var t = {};
        try {
          t = JSON.parse(el.getAttribute("data-typetekst"));
        } catch (e) {
        }
        return { el: el, alle: el.textContent, t: t };
      });
    var typeceller = raekker.map(function (tr) {
      var celle = tr.querySelector("td[data-typer]");
      var tal = {};
      if (celle) {
        celle.getAttribute("data-typer").split(" ").forEach(function (led) {
          var d = led.split(":");
          if (d.length === 2) tal[d[0]] = d[1];
        });
      }
      return { tr: tr, celle: celle, alle: celle ? celle.innerHTML : "", total: celle ? celle.getAttribute("data-total") : null, tal: tal };
    });
    var harType = new Map();
    typeceller.forEach(function (c) {
      harType.set(c.tr, c.tal);
    });

    function animerBobler(gamle, nye, attr, lag) {
      var valg = { duration: TID, easing: SLYNG };
      var stod = "translate(-50%, -50%)";
      var fr = flade.getBoundingClientRect();
      var v = function (el, n) {
        return parseFloat(el.style.getPropertyValue(n));
      };
      nye.forEach(function (b) {
        var g = gamle.get(b.getAttribute(attr));
        gamle.delete(b.getAttribute(attr));
        var nu = v(b, "--d");
        var foer = g ? v(g, "--d") : NaN;
        if (g && foer > 0 && nu > 0) {
          var dx = ((v(g, "--x") - v(b, "--x")) / 100) * fr.width;
          var dy = ((v(g, "--y") - v(b, "--y")) / 100) * fr.height;
          if (foer !== nu || dx || dy) {
            animer(b, [
              { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(" + foer / nu + ")" },
              { transform: stod },
            ], valg);
          }
        } else if (!g) {
          animer(b, [{ opacity: 0 }, { opacity: 1 }], valg);
        }
      });
      gamle.forEach(function (g) {
        var a = animer(g, [{ opacity: 1 }, { opacity: 0 }], valg);
        if (!a) return;
        g.setAttribute("aria-hidden", "true");
        g.setAttribute("data-ud", "");
        g.tabIndex = -1;
        lag.appendChild(g);
        a.onfinish = function () {
          if (g.parentNode) g.parentNode.removeChild(g);
        };
      });
    }

    function visType(k, bevaeg) {
      var lag = lagAf(k);
      if (!lag) return false;
      var gamle = new Map();
      // Udtonende bobler ([data-ud]) må ikke tages med igen - ellers blinker de op til fuld ved hurtige skift.
      if (bevaeg) {
        Array.prototype.slice.call(flade.querySelectorAll(":scope > .verdenskort__boble:not([data-ud])")).forEach(function (b) {
          gamle.set(b.getAttribute("data-boble"), b);
        });
      }
      Array.prototype.slice
        .call(flade.querySelectorAll(":scope > .verdenskort__streger, :scope > .verdenskort__boble:not([data-ud])"))
        .forEach(function (el) {
          el.parentNode.removeChild(el);
        });
      if (tip) tip.insertAdjacentHTML("beforebegin", lag.kort);
      else flade.insertAdjacentHTML("beforeend", lag.kort);
      landeliste.innerHTML = lag.liste;
      bindLande();
      if (bevaeg) animerBobler(gamle, landeBobler, "data-boble", flade);
      typetekster.forEach(function (x) {
        x.el.textContent = k && x.t[k] ? x.t[k] : x.alle;
      });
      typeceller.forEach(function (c) {
        if (!c.celle) return;
        if (k) c.celle.textContent = c.tal[k] || "";
        else c.celle.innerHTML = c.alle;
        if (c.total !== null) c.celle.setAttribute("data-total", k ? c.tal[k] || "" : c.total);
      });
      if (tabel.sorterIgen) tabel.sorterIgen();
      Array.prototype.slice.call(tabel.querySelectorAll("[data-type]")).forEach(function (el) {
        el.hidden = !!k && (el.getAttribute("data-type") !== k || el.classList.contains("etiket"));
      });
      typeknapper.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-prodtype") === k ? "true" : "false");
      });
      return true;
    }

    function vaelgType(k, skub) {
      if (k === klasse || !lagAf(k)) return;
      var foerLand = valgt;
      var foerBy = by;
      var foerNavn = foerLand && info[foerLand] ? navnFoerKolon(info[foerLand]) : "";
      tabtNote = "";
      if (zoom) {
        if (skub && !rolig.matches) {
          byGamle = new Map();
          zoom.bobler.forEach(function (b) {
            if (!b.hasAttribute("data-ud")) byGamle.set(b.getAttribute("data-by"), b);
          });
          // Udtonende bybobler flyttes med til det nye lag - ellers forsvinder de i et hug ved hurtige skift.
          byUd = Array.prototype.slice.call(zoom.lag.querySelectorAll("[data-ud]"));
        }
        zoomUd(false);
      }
      klasse = k;
      visType(k, !!skub);
      if (foerLand && !info[foerLand] && tom) {
        tabtNote = tom.getAttribute("data-tekst-land-tabt").replace("{type}", typeknapper.filter(function (b) { return b.getAttribute("data-prodtype") === k; }).map(function (b) { return b.textContent.trim(); })[0] || "").replace("{land}", foerNavn);
      }
      if (skub) {
        var u = new URL(window.location.href);
        try {
          window.history.replaceState(window.history.state, "", u.pathname + u.search + (k ? "#type-" + k : ""));
        } catch (e) {
          // file:// kan afvise replaceState; valget er lagt alligevel.
        }
      }
      var land = foerLand && info[foerLand] ? foerLand : null;
      vaelg(land, foerBy, land !== foerLand, false).then(function () {
        if (land && foerBy && by !== foerBy) skubAdresse(true);
      });
    }

    function typeFraAdressen() {
      var m = /^#type-([a-z_]+)$/.exec(window.location.hash);
      return m && lagAf(m[1]) ? m[1] : "";
    }

    bindLande();
    if (soegFelt) {
      soegFelt.closest("[data-prodsoeg]").hidden = false;
      var q0 = new URL(window.location.href).searchParams.get("q");
      if (q0) soegFelt.value = q0;
      soegFelt.addEventListener("input", function () {
        filtrer();
        var u = new URL(window.location.href);
        var v = soegFelt.value.trim();
        if (v) u.searchParams.set("q", v);
        else u.searchParams.delete("q");
        try {
          window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
        } catch (e) {
          // file://: adressen følger ikke søgningen.
        }
      });
      var fjernFiltre = tom && tom.querySelector("[data-prod-tom-filtre]");
      if (fjernFiltre) {
        fjernFiltre.addEventListener("click", function () {
          vaelg(null, null, true, true);
          vaelgType("", true);
          soegFelt.focus();
        });
      }
      if (sogRyd) {
        sogRyd.addEventListener("click", function () {
          soegFelt.value = "";
          soegFelt.dispatchEvent(new Event("input"));
          soegFelt.focus();
        });
      }
      if (nulstil) {
        nulstil.addEventListener("click", function () {
          if (soegFelt.value) {
            soegFelt.value = "";
            soegFelt.dispatchEvent(new Event("input"));
          }
          if (valgt) tilVerden();
          if (klasse) vaelgType("", true);
        });
      }
      var valgRyd = valgEl && valgEl.querySelector("button");
      if (valgRyd) valgRyd.addEventListener("click", tilVerden);
      var ryd = tom && tom.querySelector("[data-prod-tom-ryd]");
      if (ryd) {
        ryd.addEventListener("click", function () {
          soegFelt.value = "";
          soegFelt.dispatchEvent(new Event("input"));
          soegFelt.focus();
        });
      }
      filtrer();
    }
    typeknapper.forEach(function (b) {
      b.addEventListener("click", function () {
        vaelgType(b.getAttribute("data-prodtype") || "", true);
      });
    });
    if (typeboks) typeboks.setAttribute("data-klar", "");
    window.addEventListener("hashchange", function () {
      vaelgType(typeFraAdressen(), false);
    });

    // Svævetekst og tryk følger samme regel; klikket lyttes på KORTET, ikke på hver boble, for mousedown og mouseup kan ramme to bobler i en klynge (målt ved 390).
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

    // Document, ikke sektion: efter museklik skjules den klikkede boble og fokus falder til body.
    var klikIKort = false;
    document.addEventListener("pointerdown", function (e) { klikIKort = sektion.contains(e.target); }, true);
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !valgt || !(sektion.contains(e.target) || (e.target === document.body && klikIKort))) return;
      e.preventDefault();
      if (by) vaelg(valgt, null, true, true);
      else tilVerden();
    });

    window.addEventListener("popstate", function () {
      var a = fraAdressen();
      vaelg(a.kode, a.by, false, true);
    });

    var startType = typeFraAdressen();
    if (startType) vaelgType(startType, false);
    var start = fraAdressen();
    if (!start.kode && new URL(window.location.href).searchParams.get(PARAM)) skubAdresse(true);
    if (start.kode) vaelg(start.kode, start.by, false, false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
