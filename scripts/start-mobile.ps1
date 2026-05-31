param(
    [string]$ApiBaseUrl = "http://localhost:8000",
    [string]$MobileRedirectBase = "",
    [ValidateSet("", "mock", "service")]
    [string]$ExpectedPaymentMode = "",
    [switch]$Tunnel,
    [switch]$SkipApiCheck,
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

    if (-not $SkipApiCheck) {
        $healthUrl = "$($ApiBaseUrl.TrimEnd('/'))/health"
        Write-Host "==> Checking API at $healthUrl"
        try {
            $health = Invoke-RestMethod $healthUrl
            if ($health.status -ne "ok") {
                throw "Unexpected health response: $($health | ConvertTo-Json -Compress)"
            }
        } catch {
            $apiPort = "the configured port"
            try {
                $apiPort = ([uri]$ApiBaseUrl).Port
            } catch {
            }
            throw "Could not reach the ShoeInn API at $healthUrl. Check the API window for startup errors, confirm the API is running on port $apiPort, verify the LAN IP in -ApiBaseUrl, and confirm Windows Firewall allows inbound connections."
        }

        if ($ExpectedPaymentMode) {
            $readyUrl = "$($ApiBaseUrl.TrimEnd('/'))/ready"
            Write-Host "==> Checking API payment mode at $readyUrl"
            try {
                $ready = Invoke-RestMethod $readyUrl
                if ($ready.payment_mode -ne $ExpectedPaymentMode) {
                    throw "Expected payment_mode=$ExpectedPaymentMode but API reported payment_mode=$($ready.payment_mode)"
                }
            } catch {
                throw "API payment mode check failed. $($_.Exception.Message)"
            }
        }
    }

    if ($Tunnel) {
        npm start -- --tunnel
    } else {
        npm start
    }
} finally {
    Pop-Location
}
