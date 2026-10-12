// AmnesiaLight - hardened defaults
// Applied on every startup. Privacy-first, minimal, no tracking.
// To keep a permanent session, see docs/README.md ("Sessions optionnelles").

// ---- Identity : no telemetry, no studies, no sponsored content -------------
user_pref("toolkit.telemetry.enabled", false);
user_pref("toolkit.telemetry.unified", false);
user_pref("toolkit.telemetry.archive.enabled", false);
user_pref("toolkit.telemetry.server", "data:,");
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("app.normandy.enabled", false);
user_pref("app.normandy.api_url", "");
user_pref("browser.discovery.enabled", false);
user_pref("browser.ping-centre.telemetry", false);
user_pref("browser.newtabpage.activity-stream.feeds.telemetry", false);
user_pref("browser.newtabpage.activity-stream.telemetry", false);
user_pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);
user_pref("breakpad.reportURL", "");
user_pref("browser.tabs.crashReporting.sendReport", false);
user_pref("browser.crashReports.unsubmittedCheck.enabled", false);
user_pref("security.ssl.errorReporting.enabled", false);
user_pref("extensions.webcompat-reporter.enabled", false);

// ---- Pocket, sponsored tiles, snippets -------------------------------------
user_pref("extensions.pocket.enabled", false);
user_pref("extensions.pocket.api", "");
user_pref("extensions.pocket.site", "");
user_pref("browser.newtabpage.activity-stream.showSponsored", false);
user_pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
user_pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);
user_pref("browser.newtabpage.activity-stream.section.highlights.includePocket", false);
user_pref("browser.newtabpage.activity-stream.feeds.snippets", false);
user_pref("browser.newtabpage.activity-stream.default.sites", "");
user_pref("browser.newtabpage.enabled", false);

// ---- Page d'accueil par defaut ---------------------------------------------
// Site de presentation AmnesiaLight. Modifier l'URL ci-dessous si besoin.
//   browser.startup.page : 0 = page blanche, 1 = page d'accueil, 3 = reprise session
user_pref("browser.startup.homepage", "https://amnesialight.edgeone.dev/");
user_pref("browser.startup.page", 1);

// ---- Search : DuckDuckGo by default ----------------------------------------
user_pref("browser.search.defaultenginename", "DuckDuckGo");
user_pref("browser.search.defaultenginename.US", "DuckDuckGo");
user_pref("browser.search.separatePrivateDefault", true);
user_pref("browser.search.separatePrivateDefault.ui.enabled", false);
user_pref("browser.urlbar.suggest.searches", false);
user_pref("browser.search.suggest.enabled", false);

// ---- Anti-fingerprinting & tracking ----------------------------------------
user_pref("privacy.resistFingerprinting", true);
user_pref("privacy.resistFingerprinting.letterboxing", false);
user_pref("privacy.resistFingerprinting.pbmode", true);
user_pref("privacy.trackingprotection.enabled", true);
user_pref("privacy.trackingprotection.pbmode.enabled", true);
user_pref("privacy.trackingprotection.socialtracking.enabled", true);
user_pref("privacy.trackingprotection.cryptomining.enabled", true);
user_pref("privacy.trackingprotection.fingerprinting.enabled", true);
user_pref("privacy.annotate_channels.strict_list.enabled", true);
user_pref("privacy.partition.network_state", true);
user_pref("network.cookie.cookieBehavior", 5);
user_pref("network.cookie.lifetimePolicy", 2);
user_pref("network.http.referer.XOriginPolicy", 2);
user_pref("network.http.referer.XOriginTrimmingPolicy", 2);
user_pref("network.http.sendRefererHeader", 2);
user_pref("browser.send_pings", false);
user_pref("browser.send_pings.require_same_host", true);
user_pref("dom.battery.enabled", false);
user_pref("device.sensors.enabled", false);
user_pref("camera.control.face_detection.enabled", false);
user_pref("geo.enabled", false);
user_pref("privacy.query_stripping.enabled", true);
user_pref("privacy.query_stripping.enabled.pbmode", true);
user_pref("privacy.globalprivacycontrol.enabled", true);
user_pref("privacy.donottrackheader.enabled", true);

// ---- WebRTC / media --------------------------------------------------------
user_pref("media.peerconnection.enabled", false);
user_pref("media.peerconnection.ice.proxy_only_if_behind_proxy", true);
user_pref("media.eme.enabled", false);
user_pref("media.autoplay.default", 5);

// ---- HTTPS everywhere + strict DNS-over-HTTPS ------------------------------
user_pref("dom.security.https_only_mode", true);
user_pref("dom.security.https_only_mode_ever_enabled", true);
user_pref("dom.security.https_only_mode_send_http_background_request", false);
user_pref("network.trr.mode", 3);
user_pref("network.trr.uri", "https://dns.quad9.net/dns-query");
user_pref("network.trr.default_provider_uri", "https://dns.quad9.net/dns-query");
user_pref("network.trr.confirmationNS", "skip");

// ---- Amnesia : memory-only, no persistent traces ---------------------------
user_pref("browser.cache.disk.enable", false);
user_pref("browser.cache.disk.capacity", 0);
user_pref("browser.cache.offline.enable", false);
user_pref("browser.privatebrowsing.autostart", false);
user_pref("privacy.sanitize.sanitizeOnShutdown", false);
user_pref("browser.sessionstore.privacy_level", 2);
user_pref("browser.formfill.enable", false);
user_pref("signon.rememberSignons", false);
user_pref("signon.autofillForms", false);
user_pref("extensions.formautofill.addresses.enabled", false);
user_pref("extensions.formautofill.creditCards.enabled", false);
user_pref("permissions.default.geo", 2);
user_pref("permissions.default.camera", 2);
user_pref("permissions.default.microphone", 2);
user_pref("permissions.default.desktop-notification", 2);
user_pref("permissions.default.xr", 2);
user_pref("permissions.manager.defaultsUrl", "");

// ---- No preloading / prefetch / predictor ----------------------------------
user_pref("network.prefetch-next", false);
user_pref("network.dns.disablePrefetch", true);
user_pref("network.dns.disablePrefetchFromHTTPS", true);
user_pref("network.predictor.enabled", false);
user_pref("network.http.speculative-parallel-limit", 0);
user_pref("browser.urlbar.speculativeConnect.enabled", false);
user_pref("browser.places.speculativeConnect.enabled", false);

// ---- Lightweight : unload idle tabs ----------------------------------------
user_pref("browser.tabs.unloadOnLowMemory", true);

// ---- Appearance : AmnesiaLight theme + vertical (Arc-style) tabs -----------
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("browser.tabs.inTitlebar", 1);
user_pref("browser.compactmode.show", true);
user_pref("browser.uidensity", 0);
user_pref("sidebar.revamp", true);
user_pref("sidebar.verticalTabs", true);
user_pref("sidebar.verticalTabs.dragToReorder", true);
user_pref("sidebar.main.tools", "history,bookmarks");
user_pref("browser.tabs.drawInTitlebar", true);
