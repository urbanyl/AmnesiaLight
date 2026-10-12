# AmnesiaLight - resize/recompress wallpapers to keep the build light.
# Reads wallpaper1..4.jpg from the repo root, writes optimized JPEGs to the
# extension, assets and website folders.
param(
    [string]$Root,
    [int]$MaxWidth = 1600,
    [int]$Quality = 82
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

if (-not $Root) { $Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path }

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int]$Quality)

$targets = @{
    1 = @((Join-Path $Root 'extensions\amnesialight-toolkit\wallpapers\wp1.jpg'),
          (Join-Path $Root 'assets\wallpapers\wp1.jpg'),
          (Join-Path $Root 'website\assets\wallpaper-pattern.jpg'))
    2 = @((Join-Path $Root 'extensions\amnesialight-toolkit\wallpapers\wp2.jpg'),
          (Join-Path $Root 'assets\wallpapers\wp2.jpg'),
          (Join-Path $Root 'website\assets\wallpaper-logos.jpg'))
    3 = @((Join-Path $Root 'extensions\amnesialight-toolkit\wallpapers\wp3.jpg'),
          (Join-Path $Root 'assets\wallpapers\wp3.jpg'))
    4 = @((Join-Path $Root 'extensions\amnesialight-toolkit\wallpapers\wp4.jpg'),
          (Join-Path $Root 'assets\wallpapers\wp4.jpg'),
          (Join-Path $Root 'profile\chrome\wallpaper-pattern.jpg'))
}

function Flush-Jpeg($image, $path) {
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    if (Test-Path $path) { Remove-Item $path -Force }
    $image.Save($path, $jpegCodec, $encParams)
}

for ($i = 1; $i -le 4; $i++) {
    $src = Join-Path $Root ("wallpaper$i.jpg")
    if (-not (Test-Path $src)) { Write-Warning "missing $src"; continue }
    $img = [System.Drawing.Image]::FromFile($src)
    $ratio = [Math]::Min(1.0, $MaxWidth / $img.Width)
    $w = [int][Math]::Round($img.Width * $ratio)
    $h = [int][Math]::Round($img.Height * $ratio)
    $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose()
    $img.Dispose()
    foreach ($t in $targets[$i]) { Flush-Jpeg $bmp $t }
    $bmp.Dispose()
    Write-Host ("wp{0}: {1}x{2} -> optimized" -f $i, $w, $h)
}
Write-Host "Wallpapers optimized."
