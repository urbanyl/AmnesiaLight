/* popup.js - menu rapide AmnesiaLight Toolkit */

"use strict";

let currentTab = null;

function send(message) {
  return browser.runtime.sendMessage(message);
}

function openToolkit(panel, url) {
  const params = new URLSearchParams();
  params.set("panel", panel || "headers");
  if (url) params.set("url", url);
  return browser.tabs.create({
    url: browser.runtime.getURL("toolkit.html") + "?" + params.toString()
  });
}

async function initActiveTab() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs && tabs[0] ? tabs[0] : null;
  } catch (e) {
    currentTab = null;
  }
  const el = document.getElementById("activeUrl");
  if (currentTab && currentTab.url) {
    el.textContent = currentTab.url;
    el.title = currentTab.url;
  } else {
    el.textContent = "(aucun onglet actif)";
  }
}

async function refreshRewriteState() {
  const el = document.getElementById("rewriteState");
  try {
    const res = await send({ type: "AL_GET_SETTINGS" });
    const on = res && res.headerRewriteEnabled;
    el.textContent = on ? "Activee" : "Desactivee";
    el.classList.toggle("on", !!on);
  } catch (e) {
    el.textContent = "Indisponible";
  }
}

document.getElementById("btnOpenToolkit").addEventListener("click", function () {
  openToolkit("headers");
  window.close();
});

document.getElementById("btnFuzzUrl").addEventListener("click", function () {
  const url = currentTab && currentTab.url ? currentTab.url : "";
  openToolkit("sqli", url);
  window.close();
});

document.getElementById("btnToggleRewrite").addEventListener("click", async function () {
  try {
    const res = await send({ type: "AL_GET_SETTINGS" });
    const settings = {
      headerRewriteEnabled: !(res && res.headerRewriteEnabled),
      headers: res && res.headers ? res.headers : []
    };
    await send({ type: "AL_SET_SETTINGS", settings: settings });
    await refreshRewriteState();
  } catch (e) {
    /* ignore */
  }
});

document.getElementById("btnNewTab").addEventListener("click", function () {
  browser.tabs.create({ url: browser.runtime.getURL("newtab.html") });
  window.close();
});

initActiveTab();
refreshRewriteState();
