Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root "assets"
New-Item -ItemType Directory -Force -Path $assets | Out-Null

function New-NahkriinBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $scale = $Size / 1024.0
  $circleInset = [int](130 * $scale)
  $circleRect = New-Object System.Drawing.Rectangle $circleInset, $circleInset, ($Size - ($circleInset * 2)), ($Size - ($circleInset * 2))

  $black = [System.Drawing.Color]::FromArgb(255, 0, 0, 0)
  $cyan = [System.Drawing.Color]::FromArgb(255, 36, 185, 246)
  $ice = [System.Drawing.Color]::FromArgb(255, 238, 250, 255)
  $blue = [System.Drawing.Color]::FromArgb(255, 31, 167, 238)
  $slate = [System.Drawing.Color]::FromArgb(255, 95, 124, 152)

  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush $black), $circleRect)
  $pen = New-Object System.Drawing.Pen $cyan, ([Math]::Max(2, 7 * $scale))
  $graphics.DrawEllipse($pen, $circleRect)
  $pen.Dispose()

  $innerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(190, 120, 210, 255)), ([Math]::Max(1, 3 * $scale))
  $graphics.DrawArc($innerPen, ($circleRect.X + 34 * $scale), ($circleRect.Y + 230 * $scale), (100 * $scale), (250 * $scale), 165, 62)
  $graphics.DrawArc($innerPen, ($circleRect.Right - 134 * $scale), ($circleRect.Y + 230 * $scale), (100 * $scale), (250 * $scale), -47, 62)
  $innerPen.Dispose()

  $dotBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 68, 158, 243))
  foreach ($dy in @(420, 450, 480)) {
    $r = [int](10 * $scale)
    $graphics.FillEllipse($dotBrush, [int](176 * $scale), [int]($dy * $scale), $r, $r)
    $graphics.FillEllipse($dotBrush, [int](838 * $scale), [int]($dy * $scale), $r, $r)
  }
  $dotBrush.Dispose()

  $nPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $points = @(
    (New-Object System.Drawing.PointF (348 * $scale), (248 * $scale)),
    (New-Object System.Drawing.PointF (399 * $scale), (248 * $scale)),
    (New-Object System.Drawing.PointF (623 * $scale), (517 * $scale)),
    (New-Object System.Drawing.PointF (623 * $scale), (340 * $scale)),
    (New-Object System.Drawing.PointF (674 * $scale), (289 * $scale)),
    (New-Object System.Drawing.PointF (674 * $scale), (618 * $scale)),
    (New-Object System.Drawing.PointF (623 * $scale), (572 * $scale)),
    (New-Object System.Drawing.PointF (399 * $scale), (365 * $scale)),
    (New-Object System.Drawing.PointF (399 * $scale), (559 * $scale)),
    (New-Object System.Drawing.PointF (348 * $scale), (610 * $scale))
  )
  $nPath.AddPolygon($points)
  $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.RectangleF (330 * $scale), (230 * $scale), (370 * $scale), (410 * $scale)),
    $ice,
    $blue,
    [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
  )
  $graphics.FillPath($gradient, $nPath)
  $edgePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(190, 238, 250, 255)), ([Math]::Max(1, 3 * $scale))
  $graphics.DrawPath($edgePen, $nPath)
  $edgePen.Dispose()
  $gradient.Dispose()
  $nPath.Dispose()

  if ($Size -ge 128) {
    $fontSize = [Math]::Max(10, 42 * $scale)
    $font = New-Object System.Drawing.Font "Segoe UI", $fontSize, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
    $text = "NahkriinOS"
    $textSize = $graphics.MeasureString($text, $font)
    $x = ($Size - $textSize.Width) / 2
    $y = 650 * $scale
    $graphics.DrawString($text, $font, (New-Object System.Drawing.SolidBrush $slate), ($x + 2 * $scale), ($y + 2 * $scale))
    $graphics.DrawString($text, $font, (New-Object System.Drawing.SolidBrush $cyan), $x, $y)
    $font.Dispose()
  }

  $graphics.Dispose()
  return $bitmap
}

function Save-Ico {
  param([string]$Path, [int[]]$Sizes)

  $entries = @()
  foreach ($size in $Sizes) {
    $bmp = New-NahkriinBitmap -Size $size
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $entries += [pscustomobject]@{ Size = $size; Bytes = $ms.ToArray() }
    $ms.Dispose()
    $bmp.Dispose()
  }

  $fs = [System.IO.File]::Create($Path)
  $bw = New-Object System.IO.BinaryWriter $fs
  $bw.Write([UInt16]0)
  $bw.Write([UInt16]1)
  $bw.Write([UInt16]$entries.Count)
  $offset = 6 + ($entries.Count * 16)
  foreach ($entry in $entries) {
    $iconSizeByte = if ($entry.Size -eq 256) { 0 } else { $entry.Size }
    $bw.Write([byte]$iconSizeByte)
    $bw.Write([byte]$iconSizeByte)
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([UInt16]1)
    $bw.Write([UInt16]32)
    $bw.Write([UInt32]$entry.Bytes.Length)
    $bw.Write([UInt32]$offset)
    $offset += $entry.Bytes.Length
  }
  foreach ($entry in $entries) {
    $bw.Write($entry.Bytes)
  }
  $bw.Dispose()
  $fs.Dispose()
}

$logo = New-NahkriinBitmap -Size 1024
$logo.Save((Join-Path $assets "logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$logo.Dispose()

$trayLogo = New-NahkriinBitmap -Size 256
$trayLogo.Save((Join-Path $assets "tray.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$trayLogo.Dispose()

Save-Ico -Path (Join-Path $assets "icon.ico") -Sizes @(16, 24, 32, 48, 64, 128, 256)
Write-Host "Generated NahkriinOS icon assets in $assets"
