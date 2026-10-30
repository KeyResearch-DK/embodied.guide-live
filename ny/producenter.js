/* Kører efter producent.js og rører hverken dets elementer eller klasser. */
(function () {
  "use strict";

  var VB = 1000;
  var VH = 440;
  var LUFT = 3;
  var EU_LUFT = 1.7;
  var EU_MIN = 200;

  function init() {
    var sektion = document.querySelector("[data-verdenskort][data-europa]");
    var flade = sektion && sektion.querySelector(".verdenskort__flade");
    if (!flade) return;
    var EU = sektion.getAttribute("data-europa").split(" ").filter(Boolean);
    var kort = flade.querySelector(".verdenskort__kort");
    var tip = flade.querySelector("[data-korttip]");
    var nulstil = sektion.querySelector("[data-kortnulstil]");
    var aaben = false;
    var aabnetAfValg = false;
    var glid = 0;

    var eb = document.createElement("button");
    eb.type = "button";
    eb.className = "vk-eu";
    eb.hidden = true;
    eb.innerHTML = '<span class="verdenskort__tal"></span>';
    eb.setAttribute("data-navn", sektion.getAttribute("data-europa-navn"));
    var samle = document.createElement("button");
    samle.type = "button";
    samle.className = "vk-samle knap knap--kant";
    var samleP = document.createElement("p");
    samleP.className = "pr-tilbage-hjoerne";
    samleP.hidden = true;
    samleP.appendChild(samle);
    samle.hidden = true;
    samle.textContent = sektion.getAttribute("data-europa-samle");
    var streger = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    streger.setAttribute("class", "vk-streger");
    streger.setAttribute("viewBox", "0 0 " + VB + " " + VH);
    streger.setAttribute("aria-hidden", "true");
    streger.setAttribute("focusable", "false");
    kort.insertAdjacentElement("afterend", streger);
    flade.insertBefore(eb, tip);
    flade.insertBefore(samleP, tip);

    function valgtEuropaeisk() {
      var knap = sektion.querySelector('[data-kortlande] [data-boble][aria-pressed="true"]');
      return !!knap && EU.indexOf(knap.getAttribute("data-boble")) !== -1;
    }

    function europaVindue() {
      var xs = [];
      var ys = [];
      Array.prototype.slice.call(flade.querySelectorAll(":scope > button.verdenskort__boble")).forEach(function (b) {
        var kode = b.getAttribute("data-boble");
        if (EU.indexOf(kode) === -1) return;
        var prik = flade.querySelector(':scope > .verdenskort__streger [data-prik="' + kode + '"]');
        xs.push(prik ? parseFloat(prik.getAttribute("x1")) : parseFloat(b.style.getPropertyValue("--x")) * VB / 100);
        ys.push(prik ? parseFloat(prik.getAttribute("y1")) : parseFloat(b.style.getPropertyValue("--y")) * VH / 100);
      });
      var x0 = Math.min.apply(null, xs);
      var x1 = Math.max.apply(null, xs);
      var y0 = Math.min.apply(null, ys);
      var y1 = Math.max.apply(null, ys);
      // Øverste bånd holdes frit til "Group Europe" i hjørnet, ellers dækker knappen en boble ved 390 (test 205.5).
      var baand = Math.min(52 / (flade.clientHeight || 352), 0.4);
      var vb = Math.max((x1 - x0) * EU_LUFT, (y1 - y0) * EU_LUFT * VB / VH, EU_MIN) / (1 - baand);
      var vh = vb * VH / VB;
      return [Math.min(Math.max((x0 + x1) / 2 - vb / 2, 0), VB - vb), Math.min(Math.max((y0 + y1) / 2 - vh / 2 - baand * vh / 2, 0), VH - vh), vb];
    }

    function euListe(fold) {
      var eu = sektion.classList.contains("vk-euzoom") && !sektion.classList.contains("verdenskort--zoom");
      Array.prototype.slice.call(sektion.querySelectorAll("[data-kortlande] li")).forEach(function (li) {
        var b = li.querySelector("[data-boble]");
        li.classList.toggle("pr-ikke-eu", eu && !!b && EU.indexOf(b.getAttribute("data-boble")) === -1);
      });
      if (!fold) return;
      if (eu && !fold.hasAttribute("data-eu-foer")) { fold.setAttribute("data-eu-foer", fold.open ? "1" : "0"); fold.open = true; }
      if (!eu && fold.hasAttribute("data-eu-foer")) { fold.open = fold.getAttribute("data-eu-foer") === "1"; fold.removeAttribute("data-eu-foer"); }
    }

    function lay() {
      obs.disconnect();
      var zoomet = sektion.classList.contains("verdenskort--zoom");
      Array.prototype.slice.call(flade.querySelectorAll("button.verdenskort__boble")).forEach(function (b) { b.tabIndex = -1; });
      Array.prototype.slice.call(flade.querySelectorAll(".verdenskort__tal")).forEach(function (t) { t.toggleAttribute("data-et", /^1/.test(t.textContent)); });
      var alle = Array.prototype.slice.call(flade.querySelectorAll(":scope > button.verdenskort__boble:not([data-ud]):not(.pr-ingen)"));
      if (!zoomet && alle.length) tegn(alle);
      var fold = sektion.querySelector(".verdenskort__fold details");
      if (fold && fold.querySelector('[aria-pressed="true"]')) fold.open = true;
      euListe(fold);
      obs.observe(flade, { childList: true, subtree: true });
      obs.observe(sektion, { attributes: true, attributeFilter: ["aria-pressed"], subtree: true });
    }

    function tegn(alle) {
      if (valgtEuropaeisk()) {
        if (!aaben) aabnetAfValg = true;
        aaben = true;
      } else if (aabnetAfValg) {
        aaben = false;
        aabnetAfValg = false;
      }
      var anker = {};
      Array.prototype.slice.call(flade.querySelectorAll(":scope > .verdenskort__streger [data-prik]")).forEach(function (p) {
        anker[p.getAttribute("data-prik")] = [parseFloat(p.getAttribute("x1")), parseFloat(p.getAttribute("y1"))];
      });
      var antal = function (b) { return parseInt(b.querySelector(".verdenskort__tal").textContent, 10) || 0; };
      var sted = function (b) { return [parseFloat(b.style.getPropertyValue("--x")) * VB / 100, parseFloat(b.style.getPropertyValue("--y")) * VH / 100]; };

      var euBobler = alle.filter(function (b) { return EU.indexOf(b.getAttribute("data-boble")) !== -1; });
      var grupper = euBobler.length >= 2 && !aaben;
      var euZoom = euBobler.length >= 2 && aaben;
      var vis = euZoom ? europaVindue() : null;
      var kz = vis ? VB / vis[2] : 1;
      var tilVis = function (a) { return vis ? [(a[0] - vis[0]) * kz, (a[1] - vis[1]) * kz] : a; };
      var sand = function (b) { return anker[b.getAttribute("data-boble")] || sted(b); };
      var udenfor = function (b) { var m = tilVis(sand(b)); return m[0] < 0 || m[0] > VB || m[1] < 0 || m[1] > VH; };
      if (sektion.classList.contains("vk-euzoom") !== euZoom) {
        flade.setAttribute("data-glid", "");
        window.clearTimeout(glid);
        glid = window.setTimeout(function () { flade.removeAttribute("data-glid"); }, 700);
      }
      sektion.classList.toggle("vk-euzoom", euZoom);
      if (vis) {
        flade.style.setProperty("--eu-x", (vis[0] / VB * 100).toFixed(3));
        flade.style.setProperty("--eu-y", (vis[1] / VH * 100).toFixed(3));
        flade.style.setProperty("--eu-k", kz.toFixed(3));
      }
      alle.forEach(function (b) {
        b.classList.toggle("vk-skjult", (grupper && euBobler.indexOf(b) !== -1) || (euZoom && udenfor(b)));
      });

      var maks = 1;
      alle.forEach(function (b) { maks = Math.max(maks, antal(b)); });
      var euSum = 0;
      var euX = 0;
      var euY = 0;
      euBobler.forEach(function (b) {
        var a = anker[b.getAttribute("data-boble")] || sted(b);
        var d = parseFloat(b.style.getPropertyValue("--d"));
        euSum += antal(b);
        euX += a[0] * d * d;
        euY += a[1] * d * d;
      });
      eb.hidden = !grupper;
      samle.hidden = samleP.hidden = !(euBobler.length >= 2 && aaben);
      if (grupper) {
        var dsum = euBobler.reduce(function (s, b) { var d = parseFloat(b.style.getPropertyValue("--d")); return s + d * d; }, 0);
        maks = Math.max(maks, euSum);
        eb.style.setProperty("--x", (euX / dsum / VB * 100).toFixed(2));
        eb.style.setProperty("--y", (euY / dsum / VH * 100).toFixed(2));
        eb.style.setProperty("--d", (14 * Math.sqrt(euSum / maks)).toFixed(2));
        eb.querySelector(".verdenskort__tal").textContent = euSum;
        eb.setAttribute("aria-label", sektion.getAttribute("data-europa-etiket").replace("{n}", euSum).replace("{k}", euBobler.length));
        eb.setAttribute("data-anker", "eu");
      }

      var k = flade.clientWidth / VB;
      var p = alle.filter(function (b) { return !b.classList.contains("vk-skjult"); }).concat(grupper ? [eb] : []).map(function (b) {
        var s = sted(b);
        b.style.translate = "";
        var m = vis && b !== eb ? tilVis(sand(b)) : null;
        return { b: b, x0: s[0], y0: s[1], x: m ? m[0] : s[0], y: m ? m[1] : s[1], r: b.offsetWidth / 2 / k, a: m || (b === eb ? s : sand(b)) };
      });
      var fr = flade.getBoundingClientRect();
      var sr = samle.hidden ? null : samle.getBoundingClientRect();
      skub(p, LUFT / k, sr && [(sr.left - fr.left) / k, (sr.top - fr.top) / k, (sr.right - fr.left) / k, (sr.bottom - fr.top) / k]);
      var linjer = "";
      p.forEach(function (q) {
        q.b.style.translate = ((q.x - q.x0) * k).toFixed(2) + "px " + ((q.y - q.y0) * k).toFixed(2) + "px";
        var dx = q.a[0] - q.x;
        var dy = q.a[1] - q.y;
        var d = Math.hypot(dx, dy);
        if (q.b === eb || d <= q.r + 4) return;
        linjer += '<line x1="' + q.a[0].toFixed(1) + '" y1="' + q.a[1].toFixed(1) + '" x2="' + (q.x + dx / d * q.r).toFixed(1) + '" y2="' + (q.y + dy / d * q.r).toFixed(1) + '"/>' +
          '<line class="vk-prik" x1="' + q.a[0].toFixed(1) + '" y1="' + q.a[1].toFixed(1) + '" x2="' + q.a[0].toFixed(1) + '" y2="' + q.a[1].toFixed(1) + '"/>';
      });
      streger.innerHTML = linjer;
    }

    function skub(p, luft, rekt) {
      p.sort(function (a, b) { return b.r - a.r; });
      for (var runde = 0; runde < 600; runde++) {
        var flyttet = false;
        if (rekt) {
          p.forEach(function (q, ix) {
            if (!ix) return;
            var nx = Math.min(Math.max(q.x, rekt[0]), rekt[2]);
            var ny = Math.min(Math.max(q.y, rekt[1]), rekt[3]);
            var dx = q.x - nx;
            var dy = q.y - ny;
            var d = Math.hypot(dx, dy);
            if (d >= q.r + luft - 1e-6) return;
            if (d < 1e-6) { dx = 0; dy = -1; d = 1; }
            var m = q.r + luft - Math.hypot(nx - q.x, ny - q.y);
            q.x += dx / d * m;
            q.y += dy / d * m;
            flyttet = true;
          });
        }
        for (var i = 0; i < p.length; i++) {
          for (var j = i + 1; j < p.length; j++) {
            var a = p[i];
            var b = p[j];
            var kr = a.r + b.r + luft;
            var dx = b.x - a.x;
            var dy = b.y - a.y;
            var d = Math.hypot(dx, dy);
            if (d >= kr - 1e-6) continue;
            if (d < 1e-6) { var v = j * 2.399963; dx = Math.cos(v); dy = Math.sin(v); d = 1; }
            var m = kr - d;
            var A = a.r * a.r;
            var B = b.r * b.r;
            var da = i === 0 ? 0 : B / (A + B);
            a.x -= dx / d * m * da;
            a.y -= dy / d * m * da;
            b.x += dx / d * m * (1 - da);
            b.y += dy / d * m * (1 - da);
            flyttet = true;
          }
        }
        p.forEach(function (q, ix) {
          if (ix) {
            q.x = Math.min(Math.max(q.x, q.r), VB - q.r);
            q.y = Math.min(Math.max(q.y, q.r), VH - q.r);
          }
        });
        if (!flyttet) break;
      }
    }

    var vent = 0;
    function senere() {
      if (vent) return;
      vent = window.requestAnimationFrame(function () { vent = 0; lay(); });
    }
    var obs = new MutationObserver(senere);
    new MutationObserver(senere).observe(sektion, { attributes: true, attributeFilter: ["class"] });

    eb.addEventListener("click", function (e) {
      e.stopPropagation();
      aaben = true;
      aabnetAfValg = false;
      lay();
      samle.focus();
    });
    samle.addEventListener("click", function (e) {
      e.stopPropagation();
      var euValgt = valgtEuropaeisk();
      aaben = false;
      aabnetAfValg = false;
      if (euValgt && nulstil) nulstil.click();
      lay();
      eb.focus();
    });
    // Capture: producent.js' Escape (land → verden) kører bagefter; Europa lukker kun, når intet land er valgt.
    var klikIKort = false;
    document.addEventListener("pointerdown", function (e) { klikIKort = sektion.contains(e.target); }, true);
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !(sektion.contains(e.target) || (e.target === document.body && klikIKort)) || !aaben || samle.hidden || sektion.querySelector('[data-kortlande] [aria-pressed="true"]') || sektion.classList.contains("verdenskort--zoom")) return;
      e.stopPropagation();
      samle.click();
    }, true);
    eb.addEventListener("focus", function () {
      if (!tip) return;
      tip.textContent = eb.getAttribute("aria-label").split(". ")[0];
      tip.hidden = false;
      var fr = flade.getBoundingClientRect();
      var br = eb.getBoundingClientRect();
      var top = br.top - fr.top - tip.offsetHeight - 6;
      tip.style.left = Math.max(0, Math.min(fr.width - tip.offsetWidth, br.left + br.width / 2 - fr.left - tip.offsetWidth / 2)) + "px";
      tip.style.top = (top < 0 ? br.bottom - fr.top + 6 : top) + "px";
    });
    eb.addEventListener("blur", function () { if (tip) tip.hidden = true; });
    sektion.addEventListener("kort-opdateret", senere);
    window.addEventListener("resize", senere);
    window.addEventListener("load", senere);
    lay();
  }

  function bjaelker() {
    var linje = document.querySelector("[data-prod-sort]");
    var knap = document.querySelector(".prod-tabel thead .til-top");
    if (!linje || !knap) return;
    linje.appendChild(knap.cloneNode(true));
    linje.setAttribute("data-klaeb", "");
    if (window.klaeb) window.klaeb.iagttag(linje.parentNode);
  }

  /* Efter første billede: står klassen i markup, animerer alle rækker ind ved sideindlæsning (@starting-style). */
  function raekkerFolder() {
    var raekker = document.querySelectorAll(".prod-tabel tbody tr");
    for (var i = 0; i < raekker.length; i++) raekker[i].classList.add("foldud");
  }

  /* Sortering flytter rækkerne i DOM; uden klassen under flytningen animerer hver række ind igen. */
  function sorteringUdenOvergang() {
    function uden() {
      var raekker = document.querySelectorAll(".prod-tabel tbody tr");
      for (var i = 0; i < raekker.length; i++) raekker[i].classList.remove("foldud");
      requestAnimationFrame(function () { requestAnimationFrame(raekkerFolder); });
    }
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".prod-tabel__sorterknap")) uden();
    }, true);
    document.addEventListener("change", function (e) {
      if (e.target.closest && e.target.closest(".pr-sort__valg")) uden();
    }, true);
  }

  function start() {
    init();
    bjaelker();
    addEventListener("load", function () { requestAnimationFrame(raekkerFolder); });
    sorteringUdenOvergang();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
