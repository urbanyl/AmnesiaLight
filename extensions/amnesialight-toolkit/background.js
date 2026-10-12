/*
 * background.js - AmnesiaLight Toolkit
 *
 * Role:
 *  - Capturer les en-tetes HTTP (requete + reponse) par onglet via webRequest.
 *  - Appliquer les surcharges d'en-tetes de requete definies par l'utilisateur
 *    (onBeforeSendHeaders) UNIQUEMENT lorsque l'option est activee.
 *  - Router les messages venant du popup / de la page toolkit.
 *  - Creer un menu contextuel "Fuzzer cette URL".
 *
 * Aucune requete n'est emise ni modifiee sans action explicite de l'utilisateur.
 */

"use strict";

const DEFAULT_SETTINGS = {
  headerRewriteEnabled: false,
  headers: [] // [{ name: "X-Foo", value: "bar" }]
};

/* Capture en memoire par onglet: { request: {...}, response: {...} } */
const captured = new Map();

/* ---------------- Helpers ---------------- */

function mainFrameOnly(details) {
  return details.type === "main_frame";
}

function snapshotHeaders(headers) {
  if (!Array.isArray(headers)) return [];
  return headers.map(function (h) {
    return { name: h.name, value: h.value };
  });
}

function storeCapture(tabId, kind, details, extra) {
  if (typeof tabId !== "number" || tabId < 0) return;
  let entry = captured.get(tabId);
  if (!entry) {
    entry = { request: null, response: null };
    captured.set(tabId, entry);
  }
  const rec = {
    url: details.url,
    method: details.method || "",
    time: Date.now(),
    frame: details.type
  };
  Object.assign(rec, extra || {});
  /* Les cadres principaux ecrasent, les sous-ressources ne remplissent que si vide. */
  const key = kind === "request" ? "request" : "response";
  if (mainFrameOnly(details) || !entry[key]) {
    entry[key] = rec;
  }
}

async function getSettings() {
  const stored = await browser.storage.local.get("settings");
  const s = stored && stored.settings ? stored.settings : {};
  return {
    headerRewriteEnabled: !!s.headerRewriteEnabled,
    headers: Array.isArray(s.headers) ? s.headers : []
  };
}

async function saveSettings(settings) {
  const clean = {
    headerRewriteEnabled: !!settings.headerRewriteEnabled,
    headers: Array.isArray(settings.headers)
      ? settings.headers
          .filter(function (h) {
            return h && typeof h.name === "string" && h.name.trim() !== "";
          })
          .map(function (h) {
            return {
              name: String(h.name).trim(),
              value: h.value == null ? "" : String(h.value)
            };
          })
      : []
  };
  await browser.storage.local.set({ settings: clean });
  return clean;
}

function notifyPages(tabId) {
  /* Informe les vues toolkit ouvertes qu'une capture a ete mise a jour. */
  const msg = { type: "AL_HEADERS_UPDATED", tabId: tabId };
  browser.runtime.sendMessage(msg).catch(function () {
    /* aucune page a l'ecoute: ignorer */
  });
}

/* ---------------- webRequest: capture + surcharge ---------------- */

const filter = { urls: ["<all_urls>"] };

browser.webRequest.onBeforeSendHeaders.addListener(
  async function (details) {
    storeCapture(details.tabId, "request", details, {
      headers: snapshotHeaders(details.requestHeaders)
    });

    const settings = await getSettings();
    if (!settings.headerRewriteEnabled || settings.headers.length === 0) {
      return {};
    }

    const headers = details.requestHeaders || [];
    settings.headers.forEach(function (override) {
      const lower = override.name.toLowerCase();
      let found = false;
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].name.toLowerCase() === lower) {
          headers[i].value = override.value;
          found = true;
          break;
        }
      }
      if (!found) {
        headers.push({ name: override.name, value: override.value });
      }
    });

    return { requestHeaders: headers };
  },
  filter,
  ["requestHeaders", "blocking"]
);

browser.webRequest.onHeadersReceived.addListener(
  function (details) {
    storeCapture(details.tabId, "response", details, {
      statusCode: details.statusCode,
      statusLine: details.statusLine,
      headers: snapshotHeaders(details.responseHeaders)
    });
    notifyPages(details.tabId);
    /* On ne modifie rien: retour vide. */
    return {};
  },
  filter,
  ["responseHeaders", "blocking"]
);

browser.webRequest.onErrorOccurred.addListener(function (details) {
  storeCapture(details.tabId, "response", details, {
    error: details.error,
    statusCode: 0,
    headers: []
  });
  notifyPages(details.tabId);
}, filter);

browser.tabs.onRemoved.addListener(function (tabId) {
  captured.delete(tabId);
});

/* ---------------- Messages ---------------- */

browser.runtime.onMessage.addListener(function (message, sender) {
  if (!message || typeof message.type !== "string") return;

  switch (message.type) {
    case "AL_GET_CAPTURED": {
      const tabId = typeof message.tabId === "number" ? message.tabId : -1;
      const entry = captured.get(tabId) || { request: null, response: null };
      return Promise.resolve({ tabId: tabId, captured: entry });
    }

    case "AL_GET_SETTINGS":
      return getSettings();

    case "AL_SET_SETTINGS":
      return saveSettings(message.settings || {}).then(function (s) {
        return { ok: true, settings: s };
      });

    case "AL_CLEAR_CAPTURED": {
      const tabId = typeof message.tabId === "number" ? message.tabId : -1;
      if (captured.has(tabId)) captured.set(tabId, { request: null, response: null });
      return Promise.resolve({ ok: true });
    }

    case "AL_OPEN_TOOLKIT": {
      const panel = message.panel ? String(message.panel) : "headers";
      const params = new URLSearchParams();
      params.set("panel", panel);
      if (message.url) params.set("url", String(message.url));
      return browser.tabs
        .create({ url: browser.runtime.getURL("toolkit.html") + "?" + params.toString() })
        .then(function (tab) {
          return { ok: true, tabId: tab.id };
        });
    }

    case "AL_NOTIFY": {
      try {
        browser.notifications.create({
          type: "basic",
          iconUrl: browser.runtime.getURL("icons/icon128.png"),
          title: message.title || "AmnesiaLight Toolkit",
          message: message.text || ""
        });
      } catch (e) {
        /* notifications indisponibles */
      }
      return Promise.resolve({ ok: true });
    }

    default:
      return;
  }
});

/* ---------------- Menu contextuel ---------------- */

function createMenus() {
  browser.contextMenus.removeAll().then(function () {
    browser.contextMenus.create({
      id: "al-fuzz-url",
      title: "Fuzzer cette URL (AmnesiaLight)",
      contexts: ["link", "page", "selection"]
    });
  });
}

browser.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId !== "al-fuzz-url") return;
  let target = "";
  if (info.linkUrl) target = info.linkUrl;
  else if (info.selectionText) {
    const t = info.selectionText.trim();
    if (/^https?:\/\//i.test(t)) target = t;
  }
  if (!target && tab && tab.url) target = tab.url;

  const params = new URLSearchParams();
  params.set("panel", "sqli");
  if (target) params.set("url", target);
  browser.tabs.create({
    url: browser.runtime.getURL("toolkit.html") + "?" + params.toString()
  });
});

/* ---------------- Initialisation ---------------- */

browser.runtime.onInstalled.addListener(function () {
  createMenus();
  getSettings().then(saveSettings);
});

browser.runtime.onStartup.addListener(function () {
  createMenus();
});
