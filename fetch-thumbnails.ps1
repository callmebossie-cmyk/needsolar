# fetch-thumbnails.ps1
# Downloads og:image thumbnails for all 43 PROJ_DATA FB share URLs
# Then updates js/main.js PROJ_DATA entries with img field
# Run from project root: .\fetch-thumbnails.ps1

Add-Type -AssemblyName System.Web
Add-Type -AssemblyName System.Drawing

function Compress-Image($srcPath, $destPath, $maxWidth=600, $quality=78) {
  $src = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
  $w = $src.Width; $h = $src.Height
  if ($w -gt $maxWidth) {
    $ratio = $maxWidth / $w
    $w = $maxWidth; $h = [int]($h * $ratio)
  }
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, 0, 0, $w, $h)
  $g.Dispose(); $src.Dispose()
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $param = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $param.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
  $bmp.Save($destPath, $enc, $param)
  $bmp.Dispose()
}

$items = @(
  @{i=1;  url='https://www.facebook.com/share/r/18ee5ZYeJx/'},
  @{i=2;  url='https://www.facebook.com/share/r/1Gn4yTGoSQ/'},
  @{i=3;  url='https://www.facebook.com/share/r/18z3sZcEKp/'},
  @{i=4;  url='https://www.facebook.com/share/r/1EPmo2ZkXY/'},
  @{i=5;  url='https://www.facebook.com/share/r/14ejqPnxhhX/'},
  @{i=6;  url='https://www.facebook.com/share/r/1E57sjqsT8/'},
  @{i=7;  url='https://www.facebook.com/share/p/18gTYZi1Ws/'},
  @{i=8;  url='https://www.facebook.com/share/p/18jkBuNsev/'},
  @{i=9;  url='https://www.facebook.com/share/p/1JHfMfokcE/'},
  @{i=10; url='https://www.facebook.com/share/p/18cHF9nXnG/'},
  @{i=11; url='https://www.facebook.com/share/p/18qYS9716K/'},
  @{i=12; url='https://www.facebook.com/share/p/1UX3UUA7La/'},
  @{i=13; url='https://www.facebook.com/share/p/1AoeMfejje/'},
  @{i=14; url='https://www.facebook.com/share/p/1BcVTX913o/'},
  @{i=15; url='https://www.facebook.com/share/p/1D3Q3ufP7N/'},
  @{i=16; url='https://www.facebook.com/share/p/1DBfTZnG4g/'},
  @{i=17; url='https://www.facebook.com/share/p/1CxDHhU4Gp/'},
  @{i=18; url='https://www.facebook.com/share/p/1Dy2TmDr9o/'},
  @{i=19; url='https://www.facebook.com/share/p/1MzQdjnsdF/'},
  @{i=20; url='https://www.facebook.com/share/p/1YxMBd2XE8/'},
  @{i=21; url='https://www.facebook.com/share/p/1BLE3goZbX/'},
  @{i=22; url='https://www.facebook.com/share/p/1HNTE4uzpQ/'},
  @{i=23; url='https://www.facebook.com/share/p/1DAzvm4tx4/'},
  @{i=24; url='https://www.facebook.com/share/p/18hCtsJgTL/'},
  @{i=25; url='https://www.facebook.com/share/p/1C2bJa5Azf/'},
  @{i=26; url='https://www.facebook.com/share/p/18c9tbCHLn/'},
  @{i=27; url='https://www.facebook.com/share/p/1E9K7jN492/'},
  @{i=28; url='https://www.facebook.com/share/p/18qKo4w2Lj/'},
  @{i=29; url='https://www.facebook.com/share/p/1GPKpdcba1/'},
  @{i=30; url='https://www.facebook.com/share/p/1DyJEQvfc5/'},
  @{i=31; url='https://www.facebook.com/share/p/17vks1xZ5y/'},
  @{i=32; url='https://www.facebook.com/share/p/18oigaPboA/'},
  @{i=33; url='https://www.facebook.com/share/p/1CYFEV5pZg/'},
  @{i=34; url='https://www.facebook.com/share/p/191HLQZMKf/'},
  @{i=35; url='https://www.facebook.com/share/p/1EktQAnwKW/'},
  @{i=36; url='https://www.facebook.com/share/p/1EE5hFgNxs/'},
  @{i=37; url='https://www.facebook.com/share/p/1CeqTtsg6J/'},
  @{i=38; url='https://www.facebook.com/share/p/1JFKbF8CAt/'},
  @{i=39; url='https://www.facebook.com/share/p/14ghmEwwvRy/'},
  @{i=40; url='https://www.facebook.com/share/p/1EGUsSyWQF/'},
  @{i=41; url='https://www.facebook.com/share/p/1LTbPMkZEy/'},
  @{i=42; url='https://www.facebook.com/share/p/18d3Ypcgae/'},
  @{i=43; url='https://www.facebook.com/share/p/17cWwsPx5D/'}
)

$outDir = "img\projects"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$downloaded = 0
$failed = 0

foreach ($item in $items) {
  $pad = "{0:D3}" -f $item.i
  $outFile = "$outDir\thumb-$pad.jpg"

  if (Test-Path $outFile) {
    Write-Host "[$($item.i)/43] SKIP (exists): $outFile"
    $downloaded++
    continue
  }

  Write-Host "[$($item.i)/43] $($item.url)"
  try {
    $resp = Invoke-WebRequest -Uri $item.url -UserAgent "facebookexternalhit/1.1" -MaximumRedirection 5 -TimeoutSec 20 -ErrorAction Stop
    $rawOg = [regex]::Match($resp.Content, 'property="og:image"\s+content="([^"]+)"').Groups[1].Value
    if (-not $rawOg) {
      $rawOg = [regex]::Match($resp.Content, 'content="([^"]+)"\s+property="og:image"').Groups[1].Value
    }
    if ($rawOg) {
      $imgUrl = [System.Web.HttpUtility]::HtmlDecode($rawOg)
      $tmpFile = "$outFile.tmp"
      Invoke-WebRequest -Uri $imgUrl -OutFile $tmpFile -TimeoutSec 20 -ErrorAction Stop
      Compress-Image $tmpFile $outFile 600 78
      Remove-Item $tmpFile -Force
      $kb = [int]((Get-Item $outFile).Length / 1KB)
      Write-Host "  ✓ $outFile ($kb KB)"
      $downloaded++
    } else {
      Write-Host "  ✗ no og:image found"
      $failed++
    }
  } catch {
    Write-Host "  ✗ error: $_"
    $failed++
  }
  Start-Sleep -Milliseconds 700
}

Write-Host ""
Write-Host "=== Download done: $downloaded OK, $failed failed ==="

# Update main.js PROJ_DATA entries to add img field
Write-Host "Updating js\main.js..."
$mainJs = Get-Content "js\main.js" -Raw

$urlToImg = @{}
foreach ($item in $items) {
  $pad = "{0:D3}" -f $item.i
  $outFile = "img/projects/thumb-$pad.jpg"
  if (Test-Path ($outFile -replace '/','\')){
    $urlToImg[$item.url] = $outFile
  }
}

foreach ($url in $urlToImg.Keys) {
  $img = $urlToImg[$url]
  # Match line with this URL that doesn't already have img:
  $escaped = [regex]::Escape($url)
  $mainJs = $mainJs -replace "(\\{type:'[^']+',url:'$escaped',name:'[^']+')(\\})", "`$1,img:'$img'`$2"
}

Set-Content "js\main.js" $mainJs -NoNewline
Write-Host "js\main.js updated."
Write-Host "Done! Run: git add img/projects js/main.js && git commit -m 'Add project thumbnails'"
