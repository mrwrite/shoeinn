param(
    [string]$ApiBaseUrl = "http://localhost:8000",
    [string]$MobileRedirectBase = "",
    [switch]$Tunnel,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $PSScriptRoot
$MobileDir = Join-Path $RepoRoot "apps\mobile"

Push-Location $MobileDir
try {
    if (-not $SkipInstall -and -not (Test-Path (Join-Path $MobileDir "node_modules"))) {
        Write-Host "==> Installing mobile dependencies"
        npm install
    }

    $env:EXPO_PUBLIC_API_BASE_URL = $ApiBaseUrl
    $env:EXPO_PUBLIC_API_URL = $ApiBaseUrl
    if ($MobileRedirectBase) {
        $env:EXPO_PUBLIC_MOBILE_REDIRECT_BASE = $MobileRedirectBase
    }

    Write-Host ""
    Write-Host "==> Starting Expo"
    Write-Host "API: $ApiBaseUrl"

    if ($Tunnel) {
        npm start -- --tunnel
    } else {
        npm start
    }
} finally {
    Pop-Location
}
