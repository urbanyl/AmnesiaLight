# AmnesiaLight — Security Model

AmnesiaLight is a hardened, privacy-first browser distribution. This document
describes what it protects against, how each protection is implemented, and how
to report a vulnerability.

> **Scope.** AmnesiaLight is a *distribution*: a hardened profile, enterprise
> policy, and launchers layered on top of an upstream rendering engine. The
> engine's own security fixes are inherited by updating the engine build in
> `engine/`. This document covers the AmnesiaLight configuration.

## Design principles

1. **Private by default.** The default launcher opens a private window. No
   history, cookies, or cache survive the session unless the user explicitly
   opts in with `--session`.
2. **No telemetry.** Nothing is measured, collected, or transmitted. Tracking
   endpoints are disabled and pointed at inert values.
3. **Deny by default.** Permissions are blocked, third-party trackers are
   blocked, and anything not explicitly needed is switched off.
4. **Memory over disk.** Browsing state lives in memory; persistence is the
   exception, never the default.
5. **Least surprise.** The hardening is applied on every start from a small,
   auditable set of files, not hidden behind a build step.

## Protections in detail

| Area | Behaviour | Where |
| --- | --- | --- |
| Private by default | Launcher opens `--private-window` unless `--session` is passed | `launch/AmnesiaLight.cmd`, `launch/amnesialight.sh` |
| Telemetry | Disabled and redirected to `data:,` | `profile/user.js`, `distribution/policies.json` |
| Studies / experiments | Normandy and Shield studies disabled | `profile/user.js` |
| HTTPS-only | `dom.security.https_only_mode = true`, policy `HTTPSOnly` | `profile/user.js`, `distribution/policies.json` |
| DNS-over-HTTPS | Strict mode (`network.trr.mode = 3`), Quad9 (`https://dns.quad9.net/dns-query`), no fallback | `profile/user.js`, `distribution/policies.json` |
| Anti-fingerprinting | `privacy.resistFingerprinting`, fingerprinting protection on | `profile/user.js`, `distribution/policies.json` |
| Tracking protection | Strict lists, social/cryptomining/fingerprinting protection | `profile/user.js` |
| Cookies | Reject trackers, partition foreign cookies, session lifetime | `profile/user.js`, `distribution/policies.json` |
| Referrers | Cross-origin referrers trimmed and stripped | `profile/user.js` |
| WebRTC | Peer connection disabled (no local-IP leak) | `profile/user.js` |
| DRM / EME | Disabled | `profile/user.js` |
| Memory-only cache | Disk cache and offline cache disabled, capacity `0` | `profile/user.js` |
| No preloading | Prefetch, predictor, and speculative connections off | `profile/user.js` |
| Permissions | Camera, microphone, geolocation, notifications, and XR blocked by default | `distribution/policies.json` |
| Password / form saving | Logins, form history, address and card autofill disabled | `profile/user.js`, `distribution/policies.json` |
| Locked settings | Security-critical prefs marked `locked` so extensions cannot loosen them | `distribution/policies.json` |
| Panic wipe | Deletes all runtime traces while keeping theme and settings | `launch/wipe.cmd`, `launch/wipe.sh` |

### Locked vs. editable

`distribution/policies.json` uses `"Locked": true` / `"Status": "locked"` for
security-critical settings (tracking protection, DoH, fingerprint resistance).
These cannot be overridden from the UI or by extensions and should only be
changed by editing the policy and restarting.

`profile/user.js` holds the softer, startup defaults. These are applied on every
launch but remain user-editable from `about:config`.

### The wipe action

`launch/wipe.*` removes everything from `profile/` **except** `user.js`,
`chrome/`, and `search/`, so the hardened configuration and theme survive while
history, cookies, cache, and session data are destroyed. Run it after closing
the browser.

## Threat model

**In scope (AmnesiaLight mitigates):**

- State persisted between sessions on a shared or borrowed machine.
- Network-level passive observation of DNS queries (via encrypted DoH).
- Tracking via third-party cookies, referrers, and cross-site state.
- Passive fingerprinting of common browser characteristics.
- Silent use of camera, microphone, location, or notifications.

**Out of scope (AmnesiaLight does not claim to protect against):**

- A compromised operating system, keylogger, or malicious local process.
- Nation-state adversaries or advanced targeted exploits against the engine.
- Malicious browser extensions the user chooses to install.
- Websites where the user voluntarily submits identifying data.

AmnesiaLight reduces exposure; it is not a Tor-equivalent anonymity system.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Preferred channel — GitHub private security advisory:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Include: affected version, platform, a description, reproduction steps, and
   any proof-of-concept. Redact third-party data.

Include in your report:

- AmnesiaLight version (see `VERSION.txt`) and platform.
- Which component is affected (`user.js`, `policies.json`, launcher, packaging).
- Whether the issue also affects the upstream engine (if known).

### What to expect

- **Acknowledgement** within 5 business days.
- **Assessment and severity triage** within 10 business days.
- **Credit** in the release notes once a fix ships, unless you prefer to remain
  anonymous.
- We follow coordinated disclosure: we ask for a reasonable window (typically
  90 days) before public disclosure.

### Safe harbour

Good-faith research that respects user privacy, avoids data destruction, and
does not access other people's data will be treated as authorised. Do not run
denial-of-service tests or social engineering against maintainers.

## Verifying a build

- Review the hardening yourself: `profile/user.js`, `distribution/policies.json`,
  and `launch/*` are small and readable.
- Check that the engine binary in `engine/` matches the checksum published with
  the release you downloaded.
- Confirm the archive's top-level launcher points at the bundled `profile/`.

## Supported versions

Security fixes target the latest release. Older releases may not receive
backports; always run the newest version.
