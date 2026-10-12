# AmnesiaLight - icon generator
# Derives browser icons (.png + .ico) from the source logo with white background removed.
param(
    [string]$Source = "D:\AmnesiaLight\logo.png",
    [string]$OutDir = "D:\AmnesiaLight\icons"
)

Add-Type -AssemblyName System.Drawing

function ConvertTo-Transparent([System.Drawing.Bitmap]$bmp) {
    $w = $bmp.Width; $h = $bmp.Height
    $rect = New-Object System.Drawing.Rectangle 0,0,$w,$h
    $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bytes = New-Object byte[] ($data.Stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
    for ($y = 0; $y -lt $h; $y++) {
        $row = $y * $data.Stride
        for ($x = 0; $x -lt $w; $x++) {
            $i = $row + $x * 4
            $b = $bytes[$i]; $g = $bytes[$i+1]; $r = $bytes[$i+2]; $a = $bytes[$i+3]
            $m = [Math]::Min($r, [Math]::Min($g, $b))
            if ($m -ge 220) {
                $factor = (255 - $m) / 35.0
                if ($factor -lt 0) { $factor = 0 }
                if ($factor -gt 1) { $factor = 1 }
                $bytes[$i+3] = [byte][Math]::Round($a * $factor)
            }
        }
    }
    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
    $bmp.UnlockBits($data)
    return $bmp
}

function Get-OpaqueBounds([System.Drawing.Bitmap]$bmp) {
    $w = $bmp.Width; $h = $bmp.Height
    $minX = $w; $minY = $h; $maxX = -1; $maxY = -1
    $rect = New-Object System.Drawing.Rectangle 0,0,$w,$h
    $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bytes = New-Object byte[] ($data.Stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
    $bmp.UnlockBits($data)
    for ($y = 0; $y -lt $h; $y++) {
        $row = $y * $data.Stride
        for ($x = 0; $x -lt $w; $x++) {
            $i = $row + $x * 4
            if ($bytes[$i+3] -gt 12) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    if ($maxX -lt 0) { return $rect }
    return New-Object System.Drawing.Rectangle $minX,$minY,($maxX-$minX+1),($maxY-$minY+1)
}

$src = [System.Drawing.Bitmap]::FromFile($Source)
$src = ConvertTo-Transparent $src

$bounds = Get-OpaqueBounds $src
$side = [Math]::Max($bounds.Width, $bounds.Height)
$pad = [Math]::Round($side * 0.06)
$side = $side + 2 * $pad
$cx = $bounds.X + $bounds.Width / 2
$cy = $bounds.Y + $bounds.Height / 2
$cropX = [Math]::Max(0, [Math]::Round($cx - $side / 2))
$cropY = [Math]::Max(0, [Math]::Round($cy - $side / 2))
$cropW = [Math]::Min($side, $src.Width - $cropX)
$cropH = [Math]::Min($side, $src.Height - $cropY)

$crop = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gc = [System.Drawing.Graphics]::FromImage($crop)
$gc.DrawImage($src, (New-Object System.Drawing.Rectangle 0,0,$cropW,$cropH), (New-Object System.Drawing.Rectangle $cropX,$cropY,$cropW,$cropH), [System.Drawing.GraphicsUnit]::Pixel)
$gc.Dispose()

$sizes = @(16, 32, 48, 64, 128, 256, 512)
$pngData = @{}
foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($crop, 0, 0, $s, $s)
    $g.Dispose()
    $path = Join-Path $OutDir ("amnesialight-{0}.png" -f $s)
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngData[$s] = $ms.ToArray()
    $ms.Dispose()
    $bmp.Dispose()
}

# Full-resolution transparent master
$master = New-Object System.Drawing.Bitmap $crop.Width, $crop.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gm = [System.Drawing.Graphics]::FromImage($master)
$gm.DrawImage($crop, 0, 0, $crop.Width, $crop.Height)
$gm.Dispose()
$master.Save((Join-Path $OutDir "amnesialight-transparent.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$master.Dispose()

# Build favicon.ico (PNG-in-ICO)
$icoSizes = @(16, 32, 48, 64, 128, 256)
$count = $icoSizes.Count
$stream = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $stream
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$count)
$offset = 6 + 16 * $count
foreach ($s in $icoSizes) {
    $data = $pngData[$s]
    $dim = if ($s -ge 256) { 0 } else { $s }
    $bw.Write([Byte]$dim); $bw.Write([Byte]$dim); $bw.Write([Byte]0); $bw.Write([Byte]0)
    $bw.Write([UInt16]1); $bw.Write([UInt16]32)
    $bw.Write([UInt32]$data.Length); $bw.Write([UInt32]$offset)
    $offset += $data.Length
}
foreach ($s in $icoSizes) { $bw.Write($pngData[$s]) }
$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $OutDir "favicon.ico"), $stream.ToArray())
$bw.Dispose(); $stream.Dispose()

$src.Dispose(); $crop.Dispose()
Write-Output ("Icons written to {0}" -f $OutDir)
