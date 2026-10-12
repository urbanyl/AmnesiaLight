# Contributing to AmnesiaLight

Thanks for helping make AmnesiaLight a stronger, lighter, more private browser.
Please read this guide before opening a pull request.

## Ground rules

1. **Privacy first.** Every change must preserve the private-by-default
   behaviour. Do not add telemetry, analytics, remote calls, or "convenience"
   features that phone home. If a feature needs the network, it must be opt-in
   and documented.
2. **No third-party brand names.** Do not add the name or wordmark of any other
   browser, company, or product to files, file names, code, comments, docs, or
   assets. Refer to the underlying rendering engine generically (for example
   *"the engine"* or *"the upstream engine"*). This rule is enforced in review.
3. **Stay in scope.** Only change things inside the documented layout
   (`assets/`, `docs/`, `tools/`, `.github/`, `profile/`, `distribution/`,
   `launch/`, `icons/`). Do not edit `LICENSE`, and leave third-party-owned
   folders alone.
4. **License.** By contributing you agree your work is released under the
   project's MPL-2.0 license (see `LICENSE`).
5. **Small, focused changes.** One logical change per pull request. Split large
   refactors from feature work.

## Repository layout

```
assets/        vector sources (logo-mark.svg, logo-full.svg) + palette notes
docs/          SECURITY.md, INSTALL.md, CONTRIBUTING.md, CHANGELOG.md
tools/         make-icons.ps1, package-portable.ps1, package-portable.sh
.github/       issue + PR templates
profile/       user.js, chrome/*.css, search/duckduckgo.xml
distribution/  policies.json (locked organisation policy)
launch/        Windows/Linux launchers + wipe scripts
icons/         generated raster icons (from assets/ + make-icons.ps1)
engine/        (local only) rendering-engine build, not version controlled
```

## Development setup

- **Windows:** PowerShell 5.1 with `System.Drawing` (in-box) for the icon and
  packaging tools.
- **Linux/macOS:** `bash`, `tar`, `gzip`; `zip` optional.
- No build step is required to run the configuration — you edit files and
  relaunch the browser.

Regenerate icons after touching the vector sources:

```powershell
powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
```

## Coding style

### `user.js`

- One `user_pref("name", value);` per line, no trailing comma.
- Group preferences by concern and add a short section banner comment
  (`// ---- Section ----`).
- Keep the hardened default; when relaxing something, explain why in a comment.

### `policies.json`

- Two-space indentation, valid JSON, trailing newline.
- Security-critical entries use `"Locked": true` / `"Status": "locked"`.
- Keep engine-agnostic keys; avoid vendor-specific extensions.

### CSS (`profile/chrome/`)

- Two-space indentation.
- Use the AmnesiaLight palette (see `assets/README.md`): green `#23a06a`,
  teal `#14b8a6`, cyan `#38bdf8`, deep green `#0c2a1f`.
- Prefer simple, well-commented selectors; no minified one-liners.

### PowerShell (`tools/*.ps1`)

- PowerShell 5.1 compatible.
- `[CmdletBinding()]` + a documented `param()` block.
- `Set-StrictMode -Version Latest` and `$ErrorActionPreference = 'Stop'`.
- Fail loudly with a clear message on missing prerequisites; write files with
  explicit encodings (ASCII/UTF-8 without BOM for `.cmd`).

### Shell (`tools/*.sh`, `launch/*.sh`)

- `#!/usr/bin/env bash` and `set -euo pipefail`.
- Quote all expansions; resolve paths relative to `BASH_SOURCE`.
- Keep a Windows (`.cmd`) and Linux (`.sh`) counterpart when behaviour is
  shared.

### SVG assets (`assets/`)

- Self-contained (no external references, scripts, or exotic fonts).
- Geometric and tidy; reuse the palette above.
- Keep a `role="img"` plus `<title>`/`<desc>` for accessibility.

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short imperative summary>
```

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `chore`.
- **Scopes (examples):** `profile`, `user.js`, `policies`, `theme`, `launch`,
  `assets`, `tools`, `docs`, `ci`.
- Imperative mood, lower case, no trailing period, subject ≤ 72 characters.
- Explain *what* and *why* in the body when it isn't obvious.

Examples:

```
feat(profile): block WebRTC by default
fix(launch): detect engine binary case-insensitively on Windows
docs(security): clarify the threat model scope
chore(assets): regenerate icons from updated vector source
```

## Pull request process

1. Fork, create a topic branch from the default branch
   (`feat/…`, `fix/…`, `docs/…`).
2. Make your change and test it (launch the browser, verify private mode,
   run `tools/make-icons.ps1` and the packaging script if you touched their
   inputs).
3. Fill in the pull request template completely.
4. Ensure no third-party brand names were introduced and all new files are in
   scope.
5. Keep the diff focused; respond to review feedback with new commits rather
   than force-pushes where practical.

## Reporting bugs and vulnerabilities

- Regular bugs and features: use the GitHub issue templates.
- Security problems: **do not** open a public issue — follow
  [`docs/SECURITY.md`](SECURITY.md#reporting-a-vulnerability).
