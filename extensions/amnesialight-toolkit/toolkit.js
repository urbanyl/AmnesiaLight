/*
 * toolkit.js - AmnesiaLight Toolkit (page principale)
 * Aucune attaque automatique: tout part d'un clic explicite de l'utilisateur.
 */

"use strict";

/* ---------------- Utilitaires generaux ---------------- */

function $(id) { return document.getElementById(id); }

function make(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

function send(message) {
  return browser.runtime.sendMessage(message);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    /* Fallback: textarea + execCommand */
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e2) {
      return false;
    }
  }
}

function payloadArray(name) {
  const g = globalThis;
  return Array.isArray(g[name]) ? g[name].slice() : [];
}

/* ---------------- Onglets internes ---------------- */

const PANELS = ["headers", "sqli", "xss", "encoders", "cookies", "payloads"];

function showPanel(name) {
  if (PANELS.indexOf(name) === -1) name = "headers";
  PANELS.forEach(function (p) {
    const panel = $("panel-" + p);
    if (panel) panel.classList.toggle("active", p === name);
  });
  const tabs = document.querySelectorAll("#tabBar .tab");
  tabs.forEach(function (t) {
    t.classList.toggle("active", t.dataset.panel === name);
  });
  if (name === "headers") refreshHeadersPanel();
  if (name === "cookies") refreshCookies();
}

document.getElementById("tabBar").addEventListener("click", function (e) {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  showPanel(btn.dataset.panel);
});

/* ---------------- Onglet actif ---------------- */

async function getActiveTab() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs && tabs[0] ? tabs[0] : null;
  } catch (e) {
    return null;
  }
}

/* =========================================================
 *  PANNEAU : EN-TETES HTTP
 * ========================================================= */

function renderHeaderLines(rec) {
  if (!rec) return "(aucune capture)";
  const head = rec.method
    ? rec.method + " " + rec.url
    : "HTTP " + (rec.statusCode || "?") + " " + rec.url;
  const lines = (rec.headers || []).map(function (h) {
    return h.name + ": " + h.value;
  });
  if (rec.error) lines.push("(erreur reseau: " + rec.error + ")");
  return head + "\n" + lines.join("\n");
}

async function refreshHeadersPanel() {
  const tab = await getActiveTab();
  const target = $("headersTarget");
  if (!tab) {
    target.textContent = "Onglet cible : (aucun)";
    return;
  }
  target.textContent = "Onglet cible : " + (tab.url || "(inconnu)");
  try {
    const res = await send({ type: "AL_GET_CAPTURED", tabId: tab.id });
    const c = res && res.captured ? res.captured : {};
    $("reqHeaders").textContent = renderHeaderLines(c.request);
    $("resHeaders").textContent = renderHeaderLines(c.response);
  } catch (e) {
    $("reqHeaders").textContent = "(indisponible)";
    $("resHeaders").textContent = "(indisponible)";
  }
}

function addOverrideRow(name, value) {
  const body = $("overrideBody");
  const tr = make("tr");
  const tdName = make("td");
  const inName = make("input");
  inName.type = "text";
  inName.className = "hdr-name";
  inName.value = name || "";
  inName.placeholder = "X-Header";
  tdName.appendChild(inName);

  const tdVal = make("td");
  const inVal = make("input");
  inVal.type = "text";
  inVal.className = "hdr-value";
  inVal.value = value || "";
  inVal.placeholder = "valeur";
  tdVal.appendChild(inVal);

  const tdX = make("td", "col-x");
  const rm = make("button", "btn tiny ghost", "x");
  rm.type = "button";
  rm.dataset.action = "remove-row";
  tdX.appendChild(rm);

  tr.appendChild(tdName);
  tr.appendChild(tdVal);
  tr.appendChild(tdX);
  body.appendChild(tr);
}

function collectOverrideRows() {
  const rows = [];
  document.querySelectorAll("#overrideBody tr").forEach(function (tr) {
    const name = tr.querySelector(".hdr-name").value.trim();
    const value = tr.querySelector(".hdr-value").value;
    if (name !== "") rows.push({ name: name, value: value });
  });
  return rows;
}

async function loadHeaderSettings() {
  const res = await send({ type: "AL_GET_SETTINGS" });
  const settings = res || {};
  $("rewriteToggle").checked = !!settings.headerRewriteEnabled;
  $("overrideBody").innerHTML = "";
  const headers = Array.isArray(settings.headers) ? settings.headers : [];
  if (headers.length === 0) {
    addOverrideRow("", "");
  } else {
    headers.forEach(function (h) { addOverrideRow(h.name, h.value); });
  }
}

$("btnRefreshHeaders").addEventListener("click", refreshHeadersPanel);

$("btnClearHeaders").addEventListener("click", async function () {
  const tab = await getActiveTab();
  if (tab) await send({ type: "AL_CLEAR_CAPTURED", tabId: tab.id });
  refreshHeadersPanel();
});

$("btnAddHeader").addEventListener("click", function () {
  addOverrideRow("", "");
});

$("overrideBody").addEventListener("click", function (e) {
  if (e.target.dataset && e.target.dataset.action === "remove-row") {
    const tr = e.target.closest("tr");
    if (tr) tr.remove();
  }
});

$("btnSaveHeaders").addEventListener("click", async function () {
  const settings = {
    headerRewriteEnabled: $("rewriteToggle").checked,
    headers: collectOverrideRows()
  };
  await send({ type: "AL_SET_SETTINGS", settings: settings });
  $("overrideStatus").textContent =
    "Enregistre - surcharge " + (settings.headerRewriteEnabled ? "ACTIVE" : "desactivee") +
    " (" + settings.headers.length + " en-tete(s)).";
});

/* =========================================================
 *  MOTEUR DE FUZZING (partage SQLi / XSS)
 * ========================================================= */

function buildRequest(baseUrl, method, param, payload) {
  const u = new URL(baseUrl);
  if (method === "POST") {
    const body = new URLSearchParams();
    u.searchParams.forEach(function (v, k) { body.set(k, v); });
    body.set(param, payload);
    u.search = "";
    return {
      url: u.toString(),
      options: {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      }
    };
  }
  u.searchParams.set(param, payload);
  return { url: u.toString(), options: { method: "GET" } };
}

async function timedFetch(url, options, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, timeoutMs);
  const start = performance.now();
  const base = {
    method: "GET",
    credentials: "include",
    redirect: "follow",
    cache: "no-store",
    signal: ctrl.signal
  };
  try {
    const res = await fetch(url, Object.assign(base, options));
    const text = await res.text();
    return {
      ok: true,
      status: res.status,
      length: text.length,
      text: text,
      ms: Math.round(performance.now() - start)
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      length: 0,
      text: "",
      ms: Math.round(performance.now() - start),
      error: err && err.message ? err.message : String(err)
    };
  } finally {
    clearTimeout(timer);
  }
}

function looksLikeSqlError(text) {
  const low = (text || "").toLowerCase();
  const sigs = payloadArray("SQL_ERROR_SIGNATURES");
  for (let i = 0; i < sigs.length; i++) {
    if (low.indexOf(sigs[i].toLowerCase()) !== -1) return true;
  }
  return false;
}

function isReflected(text, payload) {
  if (!text) return false;
  if (text.indexOf(payload) !== -1) return true;
  try {
    if (text.indexOf(encodeURIComponent(payload)) !== -1) return true;
  } catch (e) { /* ignore */ }
  return false;
}

function readPayloads(set, customText, builtinName) {
  if (set === "custom") {
    return customText
      .split(/\r?\n/)
      .map(function (l) { return l; })
      .filter(function (l) { return l.trim() !== ""; });
  }
  return payloadArray(builtinName);
}

function delay(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

/*
 * Execution du fuzzing. cfg fournit les elements du DOM et la logique de verdict.
 */
async function runFuzz(cfg) {
  const state = cfg.state;
  state.stop = false;
  state.rows = [];

  let base;
  try {
    base = new URL(cfg.url);
  } catch (e) {
    cfg.statusEl.textContent = "URL invalide.";
    return;
  }
  if (!base.protocol.startsWith("http")) {
    cfg.statusEl.textContent = "Seules les URL http(s) sont acceptees.";
    return;
  }

  const payloads = cfg.payloads;
  if (payloads.length === 0) {
    cfg.statusEl.textContent = "Aucun payload.";
    return;
  }

  cfg.bodyEl.innerHTML = "";
  cfg.runBtn.disabled = true;
  cfg.stopBtn.disabled = false;
  cfg.statusEl.textContent = "En cours... " + payloads.length + " payload(s).";

  for (let i = 0; i < payloads.length; i++) {
    if (state.stop) break;
    const payload = payloads[i];
    let url, options;
    try {
      const built = buildRequest(cfg.url, cfg.method, cfg.param, payload);
      url = built.url;
      options = built.options;
    } catch (e) {
      continue;
    }

    const res = await timedFetch(url, options, cfg.timeout);
    const verdict = cfg.verdict(payload, res);

    const tr = cfg.makeRow(i + 1, payload, res, verdict);
    cfg.bodyEl.appendChild(tr);

    state.rows.push({
      index: i + 1,
      payload: payload,
      status: res.status,
      length: res.length,
      ms: res.ms,
      verdict: verdict,
      error: res.error || ""
    });

    const pct = Math.round(((i + 1) / payloads.length) * 100);
    cfg.barEl.style.width = pct + "%";

    if (cfg.delay > 0 && i < payloads.length - 1 && !state.stop) {
      await delay(cfg.delay);
    }
  }

  cfg.runBtn.disabled = false;
  cfg.stopBtn.disabled = true;
  cfg.statusEl.textContent =
    (state.stop ? "Arrete. " : "Termine. ") + state.rows.length + " requete(s).";
}

function flaggedRow(flag) {
  const tr = make("tr");
  if (flag) tr.className = "hit";
  return tr;
}

function baseRow(cells) {
  const tr = make("tr");
  cells.forEach(function (c) { tr.appendChild(c); });
  return tr;
}

/* ---------------- SQLi ---------------- */

const sqliState = { stop: false, rows: [] };

function sqliMakeRow(idx, payload, res, verdict) {
  const tr = flaggedRow(verdict);
  tr.appendChild(make("td", null, String(idx)));

  const tdP = make("td", "mono cell-payload");
  tdP.textContent = payload;
  tdP.title = payload;
  tr.appendChild(tdP);

  tr.appendChild(make("td", null, res.ok ? String(res.status) : "ERR"));
  tr.appendChild(make("td", null, String(res.length)));
  tr.appendChild(make("td", null, String(res.ms)));
  tr.appendChild(make("td", verdict ? "yes" : "no", verdict ? "Oui" : "Non"));
  return tr;
}

$("btnRunSqli").addEventListener("click", function () {
  const url = $("sqliUrl").value.trim();
  const payloads = readPayloads($("sqliSet").value, $("sqliCustom").value, "SQLI");
  runFuzz({
    url: url,
    method: $("sqliMethod").value,
    param: $("sqliParam").value.trim() || "id",
    payloads: payloads,
    delay: parseInt($("sqliDelay").value, 10) || 0,
    timeout: parseInt($("sqliTimeout").value, 10) || 15000,
    state: sqliState,
    bodyEl: $("sqliBody"),
    barEl: $("sqliBar"),
    runBtn: $("btnRunSqli"),
    stopBtn: $("btnStopSqli"),
    statusEl: $("sqliStatus"),
    verdict: function (payload, res) { return res.ok && looksLikeSqlError(res.text); },
    makeRow: sqliMakeRow
  });
});

/* ---------------- XSS ---------------- */

const xssState = { stop: false, rows: [] };

function xssMakeRow(idx, payload, res, verdict) {
  const tr = flaggedRow(verdict);
  tr.appendChild(make("td", null, String(idx)));

  const tdP = make("td", "mono cell-payload");
  tdP.textContent = payload;
  tdP.title = payload;
  tr.appendChild(tdP);

  tr.appendChild(make("td", null, res.ok ? String(res.status) : "ERR"));
  tr.appendChild(make("td", null, String(res.length)));
  tr.appendChild(make("td", null, String(res.ms)));
  tr.appendChild(make("td", verdict ? "yes" : "no", verdict ? "Oui" : "Non"));
  return tr;
}

$("btnRunXss").addEventListener("click", function () {
  const url = $("xssUrl").value.trim();
  const payloads = readPayloads($("xssSet").value, $("xssCustom").value, "XSS");
  runFuzz({
    url: url,
    method: $("xssMethod").value,
    param: $("xssParam").value.trim() || "q",
    payloads: payloads,
    delay: parseInt($("xssDelay").value, 10) || 0,
    timeout: parseInt($("xssTimeout").value, 10) || 15000,
    state: xssState,
    bodyEl: $("xssBody"),
    barEl: $("xssBar"),
    runBtn: $("btnRunXss"),
    stopBtn: $("btnStopXss"),
    statusEl: $("xssStatus"),
    verdict: function (payload, res) { return res.ok && isReflected(res.text, payload); },
    makeRow: xssMakeRow
  });
});

$("btnStopSqli").addEventListener("click", function () { sqliState.stop = true; });
$("btnStopXss").addEventListener("click", function () { xssState.stop = true; });

/* ---------------- Export CSV ---------------- */

function toCsv(rows, verdictLabel) {
  const head = ["index", "payload", "status", "length", "ms", verdictLabel, "error"];
  const lines = [head.join(",")];
  rows.forEach(function (r) {
    const cells = [
      r.index,
      r.payload,
      r.status,
      r.length,
      r.ms,
      r.verdict ? "yes" : "no",
      r.error
    ].map(function (v) {
      const s = String(v == null ? "" : v).replace(/"/g, '""');
      return '"' + s + '"';
    });
    lines.push(cells.join(","));
  });
  return lines.join("\r\n");
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

$("btnExportSqli").addEventListener("click", function () {
  downloadCsv("amnesialight-sqli.csv", toCsv(sqliState.rows, "sql_error"));
});
$("btnExportXss").addEventListener("click", function () {
  downloadCsv("amnesialight-xss.csv", toCsv(xssState.rows, "reflected"));
});

/* =========================================================
 *  PANNEAU : ENCODEURS / DECODEURS
 * ========================================================= */

function toHex(str) {
  const bytes = new TextEncoder().encode(str);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function fromHex(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  if (clean.length % 2 !== 0) throw new Error("Longueur hexadecimale impaire");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach(function (b) { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function b64decode(str) {
  const bin = atob(str.replace(/\s+/g, ""));
  const bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
  return new TextDecoder().decode(bytes);
}

function htmlEncode(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlDecode(str) {
  const div = document.createElement("div");
  div.innerHTML = str;
  return div.textContent || "";
}

function rot13(str) {
  return str.replace(/[a-zA-Z]/g, function (c) {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function base64UrlDecode(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  return b64decode(s);
}

async function digestHex(algo, text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  const bytes = new Uint8Array(buf);
  let out = "";
  bytes.forEach(function (b) { out += b.toString(16).padStart(2, "0"); });
  return out;
}

function decodeJwt(token) {
  const parts = token.trim().split(".");
  if (parts.length < 2) throw new Error("JWT invalide (au moins 2 segments)");
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  let out = "HEADER:\n" + JSON.stringify(header, null, 2) + "\n\nPAYLOAD:\n" +
    JSON.stringify(payload, null, 2);
  if (parts[2]) out += "\n\nSIGNATURE:\n" + parts[2];
  return out;
}

async function applyEncoder(op) {
  const input = $("encInput").value;
  const out = $("encOutput");
  const status = $("encStatus");
  status.textContent = "";
  try {
    switch (op) {
      case "urlencode": out.value = encodeURIComponent(input); break;
      case "urldecode": out.value = decodeURIComponent(input); break;
      case "b64encode": out.value = b64encode(input); break;
      case "b64decode": out.value = b64decode(input); break;
      case "hexencode": out.value = toHex(input); break;
      case "hexdecode": out.value = fromHex(input); break;
      case "htmlencode": out.value = htmlEncode(input); break;
      case "htmldecode": out.value = htmlDecode(input); break;
      case "rot13": out.value = rot13(input); break;
      case "sha1": out.value = await digestHex("SHA-1", input); break;
      case "sha256": out.value = await digestHex("SHA-256", input); break;
      case "sha512": out.value = await digestHex("SHA-512", input); break;
      case "jwt": out.value = decodeJwt(input); break;
      case "md5note":
        out.value = "MD5 n'est pas disponible via Web Crypto.";
        break;
      default: out.value = input;
    }
  } catch (err) {
    out.value = "";
    status.textContent = "Erreur : " + (err && err.message ? err.message : String(err));
  }
}

$("encButtons").addEventListener("click", function (e) {
  const btn = e.target.closest("button[data-op]");
  if (!btn) return;
  applyEncoder(btn.dataset.op);
});

$("btnEncCopy").addEventListener("click", async function () {
  const ok = await copyText($("encOutput").value);
  $("encStatus").textContent = ok ? "Copie." : "Copie impossible.";
});

$("btnEncSwap").addEventListener("click", function () {
  $("encInput").value = $("encOutput").value;
  $("encOutput").value = "";
});

/* =========================================================
 *  PANNEAU : COOKIES
 * ========================================================= */

async function refreshCookies() {
  const tab = await getActiveTab();
  const target = $("cookieTarget");
  const body = $("cookieBody");
  body.innerHTML = "";
  if (!tab || !tab.url || !tab.url.startsWith("http")) {
    target.textContent = "Domaine : (onglet actif non http)";
    return;
  }
  let host = "";
  try { host = new URL(tab.url).hostname; } catch (e) { /* ignore */ }
  target.textContent = "Domaine : " + host;

  let cookies = [];
  try {
    cookies = await browser.cookies.getAll({ url: tab.url });
  } catch (e) {
    cookies = [];
  }

  $("cookieDomain").value = host;

  if (cookies.length === 0) {
    const tr = make("tr");
    const td = make("td", "muted", "Aucun cookie pour ce domaine.");
    td.colSpan = 7;
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  cookies.forEach(function (c) {
    const tr = make("tr");
    tr.appendChild(make("td", "mono", c.name));

    const tdVal = make("td", "mono cell-value");
    tdVal.textContent = c.value;
    tdVal.title = c.value;
    tr.appendChild(tdVal);

    tr.appendChild(make("td", null, c.domain));
    tr.appendChild(make("td", null, c.path));
    tr.appendChild(make("td", null, c.secure ? "oui" : "non"));
    tr.appendChild(make("td", null, c.httpOnly ? "oui" : "non"));

    const tdX = make("td", "col-x");
    const edit = make("button", "btn tiny ghost", "editer");
    edit.type = "button";
    edit.addEventListener("click", function () {
      $("cookieName").value = c.name;
      $("cookieValue").value = c.value;
      $("cookieDomain").value = c.domain;
      $("cookiePath").value = c.path || "/";
      $("cookieSecure").checked = !!c.secure;
      $("cookieHttpOnly").checked = !!c.httpOnly;
    });
    const del = make("button", "btn tiny ghost danger", "suppr");
    del.type = "button";
    del.addEventListener("click", async function () {
      const scheme = c.secure ? "https" : "http";
      const domain = c.domain.replace(/^\./, "");
      try {
        await browser.cookies.remove({
          url: scheme + "://" + domain + c.path,
          name: c.name,
          storeId: c.storeId
        });
      } catch (e) { /* ignore */ }
      refreshCookies();
    });
    tdX.appendChild(edit);
    tdX.appendChild(del);
    tr.appendChild(tdX);
    body.appendChild(tr);
  });
}

$("btnRefreshCookies").addEventListener("click", refreshCookies);

$("btnSaveCookie").addEventListener("click", async function () {
  const name = $("cookieName").value.trim();
  const value = $("cookieValue").value;
  const domain = $("cookieDomain").value.trim();
  const path = $("cookiePath").value.trim() || "/";
  const secure = $("cookieSecure").checked;
  const httpOnly = $("cookieHttpOnly").checked;
  const status = $("cookieStatus");

  if (!name) { status.textContent = "Nom requis."; return; }
  const cleanDomain = domain.replace(/^\./, "");
  const scheme = secure ? "https" : "http";
  const url = scheme + "://" + cleanDomain + path;

  try {
    await browser.cookies.set({
      url: url,
      name: name,
      value: value,
      path: path,
      secure: secure,
      httpOnly: httpOnly,
      domain: domain
    });
    status.textContent = "Cookie defini.";
    refreshCookies();
  } catch (err) {
    status.textContent = "Erreur : " + (err && err.message ? err.message : String(err));
  }
});

$("btnCopyCookieHeader").addEventListener("click", async function () {
  const tab = await getActiveTab();
  if (!tab || !tab.url) return;
  let cookies = [];
  try { cookies = await browser.cookies.getAll({ url: tab.url }); } catch (e) { /* ignore */ }
  const header = cookies.map(function (c) { return c.name + "=" + c.value; }).join("; ");
  const ok = await copyText(header);
  $("cookieStatus").textContent = ok ? "En-tete Cookie copie." : "Copie impossible.";
});

/* =========================================================
 *  PANNEAU : BIBLIOTHEQUE DE PAYLOADS
 * ========================================================= */

const PAYLOAD_CATEGORIES = [
  { key: "SQLI", title: "Injection SQL" },
  { key: "XSS", title: "XSS" },
  { key: "LFI", title: "LFI / Path traversal" },
  { key: "SSRF", title: "SSRF" },
  { key: "CMDI", title: "Command injection" },
  { key: "OPEN_REDIRECT", title: "Open redirect" }
];

function renderPayloadLibrary(filter) {
  const container = $("payloadContainer");
  container.innerHTML = "";
  const f = (filter || "").toLowerCase();

  PAYLOAD_CATEGORIES.forEach(function (cat) {
    const items = payloadArray(cat.key).filter(function (p) {
      return f === "" || p.toLowerCase().indexOf(f) !== -1;
    });
    if (items.length === 0) return;

    const card = make("div", "card");
    const head = make("div", "card-head");
    head.appendChild(make("h3", null, cat.title + " (" + items.length + ")"));
    const copyAll = make("button", "btn tiny ghost", "Tout copier");
    copyAll.type = "button";
    copyAll.addEventListener("click", async function () {
      const ok = await copyText(items.join("\n"));
      copyAll.textContent = ok ? "Copie !" : "Echec";
      setTimeout(function () { copyAll.textContent = "Tout copier"; }, 1200);
    });
    head.appendChild(copyAll);
    card.appendChild(head);

    const list = make("div", "payload-list");
    items.forEach(function (p) {
      const row = make("div", "payload-item");
      const code = make("code", "mono", p);
      code.title = p;
      const copyBtn = make("button", "btn tiny", "copier");
      copyBtn.type = "button";
      copyBtn.addEventListener("click", async function () {
        const ok = await copyText(p);
        copyBtn.textContent = ok ? "ok" : "x";
        setTimeout(function () { copyBtn.textContent = "copier"; }, 1000);
      });
      row.appendChild(code);
      row.appendChild(copyBtn);
      list.appendChild(row);
    });
    card.appendChild(list);
    container.appendChild(card);
  });

  if (container.children.length === 0) {
    container.appendChild(make("p", "muted", "Aucun payload ne correspond au filtre."));
  }
}

$("payloadSearch").addEventListener("input", function () {
  renderPayloadLibrary($("payloadSearch").value);
});

/* =========================================================
 *  INITIALISATION
 * ========================================================= */

browser.runtime.onMessage.addListener(function (message) {
  if (message && message.type === "AL_HEADERS_UPDATED") {
    if ($("panel-headers").classList.contains("active")) {
      refreshHeadersPanel();
    }
  }
});

async function init() {
  const params = new URLSearchParams(location.search);
  const panel = params.get("panel") || "headers";
  const url = params.get("url") || "";

  if (url) {
    if (panel === "xss") $("xssUrl").value = url;
    else $("sqliUrl").value = url;
  }
  try {
    if (panel === "sqli" && url) {
      const u = new URL(url);
      const firstKey = Array.from(u.searchParams.keys())[0];
      if (firstKey) $("sqliParam").value = firstKey;
    } else if (panel === "xss" && url) {
      const u = new URL(url);
      const firstKey = Array.from(u.searchParams.keys())[0];
      if (firstKey) $("xssParam").value = firstKey;
    }
  } catch (e) { /* URL non exploitable */ }

  showPanel(panel);
  await loadHeaderSettings();
  renderPayloadLibrary("");
}

init();
