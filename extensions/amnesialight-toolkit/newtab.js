/* newtab.js - AmnesiaLight: horloge + galerie de fonds d'ecran */

"use strict";

(function () {
  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  const DAYS = [
    "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"
  ];
  const MONTHS = [
    "janvier", "fevrier", "mars", "avril", "mai", "juin",
    "juillet", "aout", "septembre", "octobre", "novembre", "decembre"
  ];

  const timeEl = document.getElementById("clockTime");
  const dateEl = document.getElementById("clockDate");

  function render() {
    const now = new Date();
    if (timeEl) {
      timeEl.textContent =
        pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    }
    if (dateEl) {
      dateEl.textContent =
        DAYS[now.getDay()] + " " + now.getDate() + " " +
        MONTHS[now.getMonth()] + " " + now.getFullYear();
    }
  }

  render();
  setInterval(render, 1000);

  // ---- Galerie de fonds d'ecran -------------------------------------------
  const WALLS = ["wp1.jpg", "wp2.jpg", "wp3.jpg", "wp4.jpg"];
  const WALL_LABELS = {
    "wp1.jpg": "Motif de lotus",
    "wp2.jpg": "Logos",
    "wp3.jpg": "Mandala",
    "wp4.jpg": "Degrade + logo"
  };
  const DEFAULT_WALL = "wp4.jpg";
  const KEY = "al_wallpaper";

  function applyWall(file) {
    document.documentElement.style.setProperty(
      "--al-wallpaper",
      'url("wallpapers/' + file + '")'
    );
  }

  function buildPicker(current) {
    const host = document.getElementById("wallpaperPicker");
    if (!host) { return; }
    host.textContent = "";
    WALLS.forEach(function (f) {
      const img = document.createElement("img");
      img.src = "wallpapers/" + f;
      img.alt = WALL_LABELS[f] || f;
      img.title = WALL_LABELS[f] || f;
      img.className = "wall-thumb" + (f === current ? " active" : "");
      img.addEventListener("click", function () {
        applyWall(f);
        try { browser.storage.local.set({ [KEY]: f }); } catch (e) { /* ignore */ }
        Array.prototype.forEach.call(
          host.querySelectorAll(".wall-thumb"),
          function (el) { el.classList.remove("active"); }
        );
        img.classList.add("active");
      });
      host.appendChild(img);
    });
  }

  function initWall() {
    if (typeof browser === "undefined" || !browser.storage) {
      applyWall(DEFAULT_WALL);
      buildPicker(DEFAULT_WALL);
      return;
    }
    browser.storage.local.get(KEY).then(function (res) {
      let file = res && res[KEY] ? res[KEY] : DEFAULT_WALL;
      if (WALLS.indexOf(file) === -1) { file = DEFAULT_WALL; }
      applyWall(file);
      buildPicker(file);
    }).catch(function () {
      applyWall(DEFAULT_WALL);
      buildPicker(DEFAULT_WALL);
    });
  }

  initWall();
})();
