param(
    [ValidateSet("shelby", "mt_juliet")]
    [string]$DemoMarket = "shelby",
    [string]$ApiBaseUrl = "http://localhost:8000",
    [switch]$Tunnel,
    [switch]$SkipApiCheck,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ApiScript = Join-Path $PSScriptRoot "start-api.ps1"
$MobileScript = Join-Path $PSScriptRoot "start-mobile.ps1"

$apiArgs = @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$ApiScript`"",
    "-DemoMarket", $DemoMarket
)

if ($SkipInstall) {
    $apiArgs += "-SkipInstall"
}

Write-Host "==> Starting API in a new PowerShell window"
Start-Process -FilePath "powershell.exe" -ArgumentList $apiArgs -WorkingDirectory (Split-Path -Parent $PSScriptRoot)

Write-Host "==> Waiting briefly before starting Expo"
Start-Sleep -Seconds 8

$mobileArgs = @(
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$MobileScript`"",
    "-ApiBaseUrl", $ApiBaseUrl
)

if ($Tunnel) {
    $mobileArgs += "-Tunnel"
}
if ($SkipApiCheck) {
    $mobileArgs += "-SkipApiCheck"
}
if ($SkipInstall) {
    $mobileArgs += "-SkipInstall"
}

& powershell.exe @mobileArgs
