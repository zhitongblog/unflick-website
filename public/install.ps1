# unflick.app/install.ps1 — one-line install for Windows.
#
# usage:  irm https://unflick.app/install.ps1 | iex
#
# Downloads the standard NSIS installer for the latest unflick release and
# runs it. The installer registers file associations, drops shortcuts in
# the Start menu, and bundles libmpv / ffmpeg / yt-dlp so unflick runs with
# zero further setup. The AI edition (with bundled Whisper.cpp) needs to be
# installed manually from the GitHub releases page — its bundle is ~150 MB
# and not worth shipping to every drive-by visitor.
#
# Source code: https://github.com/zhitongblog/unflick

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'  # SilentlyContinue → faster downloads (no per-byte UI redraw)

$Repo = 'zhitongblog/unflick'
$Site = 'https://unflick.app'

function Resolve-LatestTag {
    # Bounce through the site's edge endpoint rather than api.github.com so
    # corporate-NAT visitors don't trip the anonymous 60/hr/IP rate limit.
    try {
        $stats = Invoke-RestMethod -Uri "$Site/api/stats" -ErrorAction Stop
    } catch {
        throw "Failed to resolve latest version from $Site/api/stats. Try again or grab the installer manually from https://github.com/$Repo/releases"
    }
    if (-not $stats.latest_tag) {
        throw "Latest tag not yet published. Grab the installer manually from https://github.com/$Repo/releases"
    }
    return $stats.latest_tag
}

Write-Host "==> Resolving latest version..."
$Tag     = Resolve-LatestTag
$TagBare = $Tag.TrimStart('v')
Write-Host "    latest = $Tag"

$Url = "https://github.com/$Repo/releases/download/$Tag/unflick_${TagBare}_x64-setup-standard.exe"
$Tmp = Join-Path $env:TEMP "unflick-$TagBare-setup.exe"

Write-Host "==> Downloading installer..."
Write-Host "    $Url"
try {
    Invoke-WebRequest -Uri $Url -OutFile $Tmp -ErrorAction Stop
} catch {
    throw "Download failed: $($_.Exception.Message). Manual: https://github.com/$Repo/releases/tag/$Tag"
}

Write-Host "==> Running installer (UAC prompt may appear)..."
# The NSIS installer is *not* code-signed yet, so SmartScreen will balk on
# first launch. We don't pass /S because the installer wants user input
# anyway (install location, shortcuts). Block until done so the script
# doesn't return before the install finishes.
$proc = Start-Process -FilePath $Tmp -PassThru -Wait
if ($proc.ExitCode -ne 0) {
    Write-Host "    Installer exited with code $($proc.ExitCode) (1602 = user cancelled, 1223 = user declined UAC). Re-run if this was a mistake."
}
Remove-Item $Tmp -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==> Done. Launch from Start menu, or:"
Write-Host '    & "C:\Program Files\unflick\unflick.exe"'
