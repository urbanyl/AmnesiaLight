# AmnesiaLight — Install & Usage

AmnesiaLight is a hardened, private-by-default browser distribution. There is no
installer: you drop a rendering-engine build into the project (or use a
prepackaged portable archive) and launch it.

- Windows guide: [Windows](#windows)
- Linux guide: [Linux](#linux)
- Common topics: [private vs. session mode](#private-vs-session-mode),
  [wiping traces](#wiping-traces), [changing settings](#changing-settings).

## Requirements

- **Windows** 10 or 11, 64-bit.
- **Linux** with a graphical session, 64-bit, glibc-based.
- Disk space for the engine build (typically a few hundred MB).

## What goes where

AmnesiaLight expects this layout:

```
AmnesiaLight/
├─ engine/        <- the rendering-engine build (browser executable)
├─ profile/       <- hardened preferences, theme, search engine
├─ distribution/  <- policies.json (locked enterprise policy)
├─ launch/        <- launchers + wipe scripts
└─ icons/         <- browser icons
```

## Windows

### 1. Get the files

Either clone the repository, or unzip a portable archive
(`AmnesiaLight-<version>-portable-win64.zip`) — the archive already contains the
engine, so you can skip step 2.

### 2. Drop in the engine

Copy the engine build into `D:\AmnesiaLight\engine\` so the executable is:

- `engine\amnesialight.exe`, or
- `engine\firefox.exe` (fallback name).

If neither exists, the launcher prints *"moteur introuvable"* and exits.

> Tip: for a system-wide fallback, an `amnesialight.exe` under
> `%ProgramFiles%\AmnesiaLight\` is also detected, but the portable layout above
> is preferred.

### 3. Launch

From a Command Prompt or double-click:

```bat
launch\AmnesiaLight.cmd
```

The browser opens a **private window** with DuckDuckGo as the default engine.

### 4. Portable launcher (optional)

A prepackaged archive ships two top-level launchers:

- `AmnesiaLight.cmd` — private window.
- `Run AmnesiaLight (session).cmd` — persistent session.

## Linux

### 1. Get the files

Clone the repository or unzip the Linux portable archive
(`AmnesiaLight-<version>-portable-linux-x64.tar.gz`), then `chmod +x` the
launcher if needed.

### 2. Drop in the engine

Copy the engine build into `AmnesiaLight/engine/` as an executable:

- `engine/amnesialight`, or
- `engine/firefox` (fallback name).

```bash
chmod +x engine/amnesialight
```

System-wide fallbacks `/usr/lib/amnesialight/amnesialight` and
`/opt/amnesialight/amnesialight` are also detected.

### 3. Launch

```bash
bash launch/amnesialight.sh
```

## Private vs. session mode

| Mode | How to start | What persists |
| --- | --- | --- |
| **Private** (default) | `launch\AmnesiaLight.cmd` / `bash launch/amnesialight.sh` | Nothing; a private window closes its own traces. |
| **Session** | add `--session` | Tabs and logins remain in `profile/` until you wipe. |

Windows session:

```bat
launch\AmnesiaLight.cmd --session
```

Linux session:

```bash
bash launch/amnesialight.sh --session
```

All extra arguments are forwarded to the engine, so you can pass a URL or
engine flags after the launcher.

## Wiping traces

After closing the browser, run the panic wipe. It deletes everything in
`profile/` **except** `user.js`, `chrome/`, and `search/`, so your settings and
theme survive.

Windows:

```bat
launch\wipe.cmd
```

Linux:

```bash
bash launch/wipe.sh
```

Private windows already avoid persistence; the wipe is the belt-and-braces
option for session mode.

## Changing settings

### General preferences — `profile/user.js`

`user.js` is re-applied on every startup, so it wins over anything you change in
the UI. Edit it while the browser is closed, then relaunch. Each line is a
`user_pref("name", value);` statement — remove the line to stop forcing that
preference, or set a different value.

Example — allow autoplay again:

```js
// change:
user_pref("media.autoplay.default", 5);
// to:
user_pref("media.autoplay.default", 0);
```

### Locked / organisation policy — `distribution/policies.json`

`policies.json` holds security-critical settings that are **locked** so the UI
and extensions cannot weaken them (tracking protection, HTTPS-only,
DNS-over-HTTPS, fingerprint resistance, permissions). Edit the file, then fully
restart the browser. Delete the `distribution/` folder only if you understand
you are removing those locks.

### Theme — `profile/chrome/`

- `userChrome.css` — browser chrome (tabs, toolbar, vertical Arc-style sidebar).
- `userContent.css` — internal pages and new-tab styling.

Restart the browser after editing. Theme loading is enabled by
`toolkit.legacyUserProfileCustomizations.stylesheets` in `user.js`.

### Default search engine — `profile/search/duckduckgo.xml`

DuckDuckGo is the only configured engine, with suggestions disabled. To change
it, edit the search definition and the corresponding preferences in `user.js`
and `policies.json`.

## Building a portable package

Maintainers can build a redistributable archive:

```powershell
# Windows (zip)
powershell -ExecutionPolicy Bypass -File tools\package-portable.ps1
```

```bash
# Linux / macOS (tar.gz)
bash tools/package-portable.sh
```

The archive is written to `dist/` and, on Windows, includes a top-level
`AmnesiaLight.cmd` launcher that runs the bundled engine with the bundled
profile. The version is taken from `engine/VERSION.txt` when present, otherwise
`0.1.0`. The script aborts with a clear error if the engine folder has no
browser executable.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| *"moteur introuvable"* | No engine executable in `engine/`; add `amnesialight.exe` / `firefox.exe` (Windows) or `amnesialight` / `firefox` (Linux). |
| Theme not applied | Ensure `user.js` sets `toolkit.legacyUserProfileCustomizations.stylesheets` to `true` and restart. |
| Settings keep reverting | They are forced by `user.js`; edit it instead of the UI. |
| Can't change a security option | It is locked in `distribution/policies.json`; edit the policy and restart. |
| Traces remain after closing | You likely used `--session`; run `launch/wipe.*`. |
