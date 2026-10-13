<#
.SYNOPSIS
    Builds the AmnesiaLight portable Windows distribution as a .zip archive.

.DESCRIPTION
    Assembles a self-contained, no-install package from the repository:
    engine + profile + distribution policy + launch scripts + icons + LICENSE
    + README.md, and a top-level launcher.

    Output: <root>\dist\AmnesiaLight-<version>-portable-win64.zip

    The archive contains a single top-level folder named
    "AmnesiaLight-<version>-portable-win64" so unzipping produces one tidy
    directory the user can run directly from a USB stick.

.PARAMETER Root
    Repository root. Defaults to the parent of this script's folder.

.PARAMETER OutDir
    Output directory for the archive. Defaults to <root>\dist.

.PARAMETER Version
    Version string. If omitted, read from engine\VERSION.txt (first line),
    else falls back to "0.1.0".

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools\package-portable.ps1

.EXAMPLE
    powershell -File tools\package-portable.ps1 -Version 0.2.0
#>
[CmdletBinding()]
param(
    [string]$Root,
    [string]$OutDir,
    [string]$Version
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Fail([string]$Message) {
    Write-Host ""
    Write-Host "  ERROR: $Message" -ForegroundColor Red
    Write-Host ""
    exit 1
}

if (-not $Root) {
    $Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}
$Root = (Resolve-Path -LiteralPath $Root).Path
if (-not $OutDir) { $OutDir = Join-Path $Root 'dist' }

$engineDir = Join-Path $Root 'engine'
$profileDir = Join-Path $Root 'profile'
$distDir = Join-Path $Root 'distribution'
$launchDir = Join-Path $Root 'launch'
$iconsDir = Join-Path $Root 'icons'
$licenseFile = Join-Path $Root 'LICENSE'
$readmeFile = Join-Path $Root 'README.md'

# ---- Validate the source tree ----------------------------------------------
$requiredDirs = @{
    'engine'       = $engineDir
    'profile'      = $profileDir
    'distribution' = $distDir
    'launch'       = $launchDir
    'icons'        = $iconsDir
}
foreach ($name in $requiredDirs.Keys) {
    if (-not (Test-Path -LiteralPath $requiredDirs[$name] -PathType Container)) {
        Fail "Missing required folder '$name' at '$($requiredDirs[$name])'."
    }
}
if (-not (Test-Path -LiteralPath $licenseFile -PathType Leaf)) { Fail "Missing LICENSE at '$licenseFile'." }
if (-not (Test-Path -LiteralPath $readmeFile -PathType Leaf)) { Fail "Missing README.md at '$readmeFile'." }

# ---- Resolve the version ----------------------------------------------------
if (-not $Version) {
    $versionFile = Join-Path $engineDir 'VERSION.txt'
    if (Test-Path -LiteralPath $versionFile -PathType Leaf) {
        $lines = @(Get-Content -LiteralPath $versionFile)
        $Version = $null
        foreach ($line in $lines) {
            if ($line -match '(?i)^\s*version\s*[:=]\s*v?([0-9][0-9A-Za-z._-]*)') {
                $Version = $Matches[1]; break
            }
        }
        if (-not $Version) {
            $m = [regex]::Match(($lines -join "`n"), '([0-9]+\.[0-9]+(?:\.[0-9]+)?)')
            if ($m.Success) { $Version = $m.Groups[1].Value }
        }
        if (-not $Version) { $Version = ($lines | Select-Object -First 1).Trim() }
    }
}
if (-not $Version) { $Version = '0.1.0' }

# ---- Locate the browser executable (fail loudly if absent) ------------------
$engineExe = $null
foreach ($candidate in @('amnesialight.exe', 'firefox.exe')) {
    $p = Join-Path $engineDir $candidate
    if (Test-Path -LiteralPath $p -PathType Leaf) { $engineExe = $p; break }
}
if (-not $engineExe) {
    Fail ("No browser executable found in '$engineDir'.`n" +
          "         Expected 'amnesialight.exe' (or 'firefox.exe') inside the engine folder.`n" +
          "         Drop the engine build into '$engineDir' and run this script again.")
}

Write-Host ""
Write-Host "  AmnesiaLight portable packager" -ForegroundColor Cyan
Write-Host "  root    : $Root"
Write-Host "  version : $Version"
Write-Host "  engine  : $engineExe"
Write-Host ""

# ---- Stage the package ------------------------------------------------------
$appName = "AmnesiaLight-$Version-portable-win64"
$stamp = [guid]::NewGuid().ToString('N')
$workDir = Join-Path ([System.IO.Path]::GetTempPath()) ("al-pkg-$stamp")
$appDir = Join-Path $workDir $appName

try {
    New-Item -ItemType Directory -Path $appDir -Force | Out-Null

    Copy-Item -LiteralPath $engineDir -Destination (Join-Path $appDir 'engine') -Recurse -Force
    Copy-Item -LiteralPath $profileDir -Destination (Join-Path $appDir 'profile') -Recurse -Force
    Copy-Item -LiteralPath $distDir -Destination (Join-Path $appDir 'distribution') -Recurse -Force

    # Policies must sit next to the engine for the browser to read them.
    $pkgEngineDist = Join-Path $appDir 'engine\distribution'
    New-Item -ItemType Directory -Path $pkgEngineDist -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $distDir 'policies.json') -Destination (Join-Path $pkgEngineDist 'policies.json') -Force
    Copy-Item -LiteralPath $launchDir -Destination (Join-Path $appDir 'launch') -Recurse -Force
    Copy-Item -LiteralPath $iconsDir -Destination (Join-Path $appDir 'icons') -Recurse -Force
    Copy-Item -LiteralPath $licenseFile -Destination (Join-Path $appDir 'LICENSE') -Force
    Copy-Item -LiteralPath $readmeFile -Destination (Join-Path $appDir 'README.md') -Force
    Set-Content -LiteralPath (Join-Path $appDir 'VERSION.txt') -Value $Version -Encoding ASCII

    # ---- Top-level launchers (normal by default) ----------------------------
    $mainLauncher = @'
@echo off
setlocal EnableExtensions
title AmnesiaLight
rem =========================================================================
rem  AmnesiaLight portable launcher (normal window, session kept).
rem  Runs the bundled engine with the bundled profile.
rem =========================================================================
set "ROOT=%~dp0"
set "ENGINE="
if exist "%ROOT%engine\amnesialight.exe" set "ENGINE=%ROOT%engine\amnesialight.exe"
if not defined ENGINE if exist "%ROOT%engine\firefox.exe" set "ENGINE=%ROOT%engine\firefox.exe"
if not defined ENGINE (
  echo.
  echo   AmnesiaLight - engine not found in "%ROOT%engine".
  echo.
  pause
  exit /b 1
)
echo   AmnesiaLight  -  profile : %ROOT%profile
echo   Mode : normal window.
"%ENGINE%" -profile "%ROOT%profile" -no-remote %*
endlocal
'@

    $privateLauncher = @'
@echo off
setlocal EnableExtensions
title AmnesiaLight (prive)
rem =========================================================================
rem  AmnesiaLight portable launcher (private window, no traces).
rem =========================================================================
set "ROOT=%~dp0"
set "ENGINE="
if exist "%ROOT%engine\amnesialight.exe" set "ENGINE=%ROOT%engine\amnesialight.exe"
if not defined ENGINE if exist "%ROOT%engine\firefox.exe" set "ENGINE=%ROOT%engine\firefox.exe"
if not defined ENGINE (
  echo.
  echo   AmnesiaLight - engine not found in "%ROOT%engine".
  echo.
  pause
  exit /b 1
)
echo   AmnesiaLight  -  profile : %ROOT%profile
echo   Mode : private window (no traces).
"%ENGINE%" -profile "%ROOT%profile" -no-remote --private-window %*
endlocal
'@

    $ascii = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Join-Path $appDir 'AmnesiaLight.cmd'), $mainLauncher, $ascii)
    [System.IO.File]::WriteAllText((Join-Path $appDir 'AmnesiaLight (prive).cmd'), $privateLauncher, $ascii)

    # ---- Zip it -------------------------------------------------------------
    if (-not (Test-Path -LiteralPath $OutDir -PathType Container)) {
        New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
    }
    $zipPath = Join-Path $OutDir "$appName.zip"
    if (Test-Path -LiteralPath $zipPath -PathType Leaf) { Remove-Item -LiteralPath $zipPath -Force }

    Compress-Archive -Path $appDir -DestinationPath $zipPath -CompressionLevel Optimal -Force

    $sizeMb = [Math]::Round((Get-Item -LiteralPath $zipPath).Length / 1MB, 2)
    $fileCount = (Get-ChildItem -LiteralPath $appDir -Recurse -File).Count
    Write-Host "  Built   : $zipPath" -ForegroundColor Green
    Write-Host "  Files   : $fileCount"
    Write-Host "  Size    : $sizeMb MB"
    Write-Host ""
}
finally {
    if (Test-Path -LiteralPath $workDir) { Remove-Item -LiteralPath $workDir -Recurse -Force -ErrorAction SilentlyContinue }
}
