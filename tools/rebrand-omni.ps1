# AmnesiaLight - rebrand the engine's browser/omni.ja in place.
# Replaces the branding strings, icons and logos with AmnesiaLight's, without
# rewriting the whole archive (in-place ZipArchive Update => keeps the original
# layout so the engine keeps working).
param(
    [string]$Root,
    [string]$OmniJa
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing

if (-not $Root) { $Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path }
if (-not $OmniJa) { $OmniJa = Join-Path $Root 'engine\browser\omni.ja' }
if (-not (Test-Path $OmniJa)) { throw "omni.ja not found: $OmniJa" }

$icons = Join-Path $Root 'icons'
$assets = Join-Path $Root 'assets'
$work = Join-Path ([System.IO.Path]::GetTempPath()) ("al-rebrand-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $work | Out-Null

function Write-Utf8($path, $text) {
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($path, $text, $enc)
}

function Resize-Png($srcPath, $size, $outPath) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose(); $src.Dispose()
    $dir = Split-Path $outPath -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function Make-AboutPng($srcPath, $outPath, $w, $h) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $side = [Math]::Min($w, $h)
    $g.DrawImage($src, [int](($w - $side) / 2), [int](($h - $side) / 2), $side, $side)
    $g.Dispose(); $src.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# --- Build the branding source files ---------------------------------------
Write-Utf8 (Join-Path $work 'chrome\en-US\locale\branding\brand.properties') @"
brandShorterName=AmnesiaLight
brandShortName=AmnesiaLight
brandFullName=AmnesiaLight
"@

Write-Utf8 (Join-Path $work 'localization\en-US\branding\brand.ftl') @"

-brand-shorter-name = AmnesiaLight
-brand-short-name = AmnesiaLight
-brand-shortcut-name = AmnesiaLight
-brand-full-name = AmnesiaLight
-brand-product-name = AmnesiaLight
-vendor-short-name = urbanyl
trademarkInfo = AmnesiaLight is an independent browser built on the Mozilla Public License v2.0.
"@

Write-Utf8 (Join-Path $work 'defaults\preferences\firefox-branding.js') @"
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// AmnesiaLight branding-specific prefs.

// No first-run welcome / Mozilla-hosted pages.
pref("startup.homepage_override_url", "");
pref("startup.homepage_welcome_url", "");
pref("startup.homepage_welcome_url.additional", "");

// AmnesiaLight ships its own builds: disable Mozilla-hosted update endpoints.
pref("app.update.url.manual", "");
pref("app.update.url.details", "");
pref("app.releaseNotesURL", "");
pref("app.releaseNotesURL.aboutDialog", "");
pref("app.releaseNotesURL.prompt", "");

pref("devtools.selfxss.count", 0);
"@

$brandDir = Join-Path $work 'chrome\browser\content\branding'
New-Item -ItemType Directory -Force -Path $brandDir | Out-Null
Copy-Item (Join-Path $icons 'amnesialight-16.png')  (Join-Path $brandDir 'icon16.png')  -Force
Copy-Item (Join-Path $icons 'amnesialight-32.png')  (Join-Path $brandDir 'icon32.png')  -Force
Copy-Item (Join-Path $icons 'amnesialight-48.png')  (Join-Path $brandDir 'icon48.png')  -Force
Copy-Item (Join-Path $icons 'amnesialight-64.png')  (Join-Path $brandDir 'icon64.png')  -Force
Copy-Item (Join-Path $icons 'amnesialight-128.png') (Join-Path $brandDir 'icon128.png') -Force

$master = Join-Path $icons 'amnesialight-transparent.png'
Resize-Png $master 192 (Join-Path $brandDir 'about-logo.png')
Resize-Png $master 384 (Join-Path $brandDir 'about-logo@2x.png')
Resize-Png $master 192 (Join-Path $brandDir 'about-logo-private.png')
Resize-Png $master 384 (Join-Path $brandDir 'about-logo-private@2x.png')
Make-AboutPng $master (Join-Path $brandDir 'about.png') 300 236
Copy-Item (Join-Path $assets 'logo-mark.svg') (Join-Path $brandDir 'about-logo.svg') -Force
$wordmark = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 84">
  <text x="0" y="60" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="58" font-weight="600" letter-spacing="-1">
    <tspan fill="#14532d">Amnesia</tspan><tspan fill="#14b8a6">Light</tspan>
  </text>
</svg>
'@
Write-Utf8 (Join-Path $brandDir 'about-wordmark.svg') $wordmark
Write-Utf8 (Join-Path $brandDir 'firefox-wordmark.svg') $wordmark

# --- Patch omni.ja in place ------------------------------------------------
# Backup outside the engine folder so it is never packaged.
$backup = Join-Path ([System.IO.Path]::GetTempPath()) 'amnesialight-omni.ja.orig'
if (-not (Test-Path $backup)) { Copy-Item $OmniJa $backup -Force }

$map = @{
    'chrome/en-US/locale/branding/brand.properties'        = Join-Path $work 'chrome\en-US\locale\branding\brand.properties'
    'localization/en-US/branding/brand.ftl'                = Join-Path $work 'localization\en-US\branding\brand.ftl'
    'defaults/preferences/firefox-branding.js'             = Join-Path $work 'defaults\preferences\firefox-branding.js'
    'chrome/browser/content/branding/icon16.png'           = Join-Path $brandDir 'icon16.png'
    'chrome/browser/content/branding/icon32.png'           = Join-Path $brandDir 'icon32.png'
    'chrome/browser/content/branding/icon48.png'           = Join-Path $brandDir 'icon48.png'
    'chrome/browser/content/branding/icon64.png'           = Join-Path $brandDir 'icon64.png'
    'chrome/browser/content/branding/icon128.png'          = Join-Path $brandDir 'icon128.png'
    'chrome/browser/content/branding/about-logo.png'       = Join-Path $brandDir 'about-logo.png'
    'chrome/browser/content/branding/about-logo@2x.png'    = Join-Path $brandDir 'about-logo@2x.png'
    'chrome/browser/content/branding/about-logo-private.png'    = Join-Path $brandDir 'about-logo-private.png'
    'chrome/browser/content/branding/about-logo-private@2x.png' = Join-Path $brandDir 'about-logo-private@2x.png'
    'chrome/browser/content/branding/about.png'            = Join-Path $brandDir 'about.png'
    'chrome/browser/content/branding/about-logo.svg'       = Join-Path $brandDir 'about-logo.svg'
    'chrome/browser/content/branding/about-wordmark.svg'   = Join-Path $brandDir 'about-wordmark.svg'
    'chrome/browser/content/branding/firefox-wordmark.svg' = Join-Path $brandDir 'firefox-wordmark.svg'
}

$zip = [System.IO.Compression.ZipFile]::Open($OmniJa, [System.IO.Compression.ZipArchiveMode]::Update)
try {
    $n = 0
    foreach ($k in $map.Keys) {
        $bytes = [System.IO.File]::ReadAllBytes($map[$k])
        $e = $zip.GetEntry($k)
        if ($e) { $e.Delete() }
        $ne = $zip.CreateEntry($k, [System.IO.Compression.CompressionLevel]::Optimal)
        $s = $ne.Open(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
        $n++
    }
}
finally { $zip.Dispose() }

Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ("Rebranded omni.ja: {0} entries replaced ({1})" -f $n, $OmniJa)
