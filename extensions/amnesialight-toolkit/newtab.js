/* newtab.js - AmnesiaLight: horloge + confort de la page d'accueil */

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
})();
