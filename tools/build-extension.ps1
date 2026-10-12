# AmnesiaLight - build the bundled toolkit extension as a sideloaded XPI.
# Packs extensions/amnesialight-toolkit into profile/extensions/<id>.xpi
# with forward-slash entry paths (required by the add-on manager).
param(
    [string]$Root
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (-not $Root) { $Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path }
$src = Join-Path $Root 'extensions\amnesialight-toolkit'
$manifest = Join-Path $src 'manifest.json'
if (-not (Test-Path $manifest)) { throw "Extension source not found: $src" }

$id = (Get-Content $manifest -Raw | ConvertFrom-Json).browser_specific_settings.gecko.id
if (-not $id) { throw "Extension id missing from manifest.json" }

$destDir = Join-Path $Root 'profile\extensions'
New-Item -ItemType Directory -Force -Path $destDir | Out-Null
$xpi = Join-Path $destDir "$id.xpi"
if (Test-Path $xpi) { Remove-Item $xpi -Force }

$zip = [System.IO.Compression.ZipFile]::Open($xpi, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    Get-ChildItem -LiteralPath $src -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($src.Length + 1).Replace('\', '/')
        $entry = $zip.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
        $out = $entry.Open()
        $in = [System.IO.File]::OpenRead($_.FullName)
        $in.CopyTo($out)
        $in.Close(); $out.Close()
    }
}
finally { $zip.Dispose() }

Write-Host ("Built {0} ({1} bytes)" -f $xpi, (Get-Item $xpi).Length)
