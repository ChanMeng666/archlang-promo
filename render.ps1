# Render the master: bundle once, render once, report what was actually written.
#   pwsh -File ./render.ps1                 # out/archlang-promo.mp4 (1920x1080, 30 fps)
#   pwsh -File ./render.ps1 -Concurrency 2  # on a busy machine
param(
  [int]$Concurrency = 4,
  [string]$Out = "out/archlang-promo.mp4"
)
$ErrorActionPreference = "Continue"   # ffmpeg and remotion write progress to stderr
Set-Location $PSScriptRoot

npx remotion bundle src/index.ts --out-dir out/bundle --log error
if ($LASTEXITCODE -ne 0) { Write-Error "bundle failed"; exit 1 }

$started = Get-Date
npx remotion render out/bundle ArchLang-Promo $Out --codec h264 --crf 17 --pixel-format yuv420p --audio-codec aac --audio-bitrate 256k --concurrency $Concurrency --log error
if ($LASTEXITCODE -ne 0) { Write-Error "render failed"; exit 1 }

$file = Get-Item $Out
if ($file.LastWriteTime -lt $started) { Write-Error "render reported success but $Out was not rewritten"; exit 1 }
$probe = ffprobe -v error -show_entries "format=duration,size:stream=codec_name,width,height,r_frame_rate" -of "default=nw=1" $Out
"rendered $Out in {0:N0} s" -f ((Get-Date) - $started).TotalSeconds
$probe
