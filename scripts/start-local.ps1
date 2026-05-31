param(
    [ValidateSet("shelby", "mt_juliet")]
    [string]$DemoMarket = "shelby",
    [int]$Port = 8000,
    [string]$ApiBaseUrl = "",
    [switch]$Tunnel,
    [switch]$SkipApiCheck,
    [switch]$SkipInstall,
    [ValidateSet("", "mock", "service")]
    [string]$PaymentMode = "",
    [string]$PaymentServiceBaseUrl = "",
    [string]$MobileRedirectBase = "",
    [int]$PaymentPort = 8001,
    [switch]$SkipPaymentService
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ApiScript = Join-Path $PSScriptRoot "start-api.ps1"
$MobileScript = Join-Path $PSScriptRoot "start-mobile.ps1"
$PaymentScript = Join-Path $PSScriptRoot "start-payment.ps1"

if (-not $ApiBaseUrl) {
    $ApiBaseUrl = "http://localhost:$Port"
}

$paymentServiceBaseUrlWasProvided = [bool]$PaymentServiceBaseUrl
if ($PaymentMode -eq "service" -and -not $PaymentServiceBaseUrl) {
    $PaymentServiceBaseUrl = "http://localhost:$PaymentPort"
}

function Wait-ForHttpOk {
    param(
        [string]$Url,
        [string]$ServiceName,
        [int]$Attempts = 40
    )

    for ($i = 0; $i -lt $Attempts; $i++) {
        try {
            $response = Invoke-RestMethod $Url
            if ($response.status -eq "ok") {
                return
            }
        } catch {
        }
        Start-Sleep -Seconds 1
    }

    throw "$ServiceName did not become healthy at $Url"
}

function Test-SameApiUrl {
    param(
        [string]$Left,
        [string]$Right
    )

    try {
        $leftUri = [uri]$Left
        $rightUri = [uri]$Right
        return $leftUri.Scheme -eq $rightUri.Scheme -and $leftUri.Host -eq $rightUri.Host -and $leftUri.Port -eq $rightUri.Port
    } catch {
        return $Left.TrimEnd("/") -eq $Right.TrimEnd("/")
    }
}

if ($PaymentMode -eq "service" -and -not $SkipPaymentService) {
    $paymentHealthUrl = "$($PaymentServiceBaseUrl.TrimEnd('/'))/health"
    $shouldStartLocalPaymentService = -not $paymentServiceBaseUrlWasProvided -or $PaymentServiceBaseUrl -match "^https?://(localhost|127\.0\.0\.1)(:|/|$)"

    $paymentAlreadyRunning = $false
    try {
        $paymentHealth = Invoke-RestMethod $paymentHealthUrl
        $paymentAlreadyRunning = $paymentHealth.status -eq "ok"
    } catch {
    }

    if ($paymentAlreadyRunning) {
        Write-Host "==> Payment service is already running at $PaymentServiceBaseUrl"
    } elseif (-not $shouldStartLocalPaymentService) {
        Write-Host "==> Payment service is not local; skipping auto-start for $PaymentServiceBaseUrl"
    } else {
        $paymentArgs = @(
            "-NoExit",
            "-ExecutionPolicy", "Bypass",
            "-File", "`"$PaymentScript`"",
            "-Port", "$PaymentPort"
        )

        if ($SkipInstall) {
            $paymentArgs += "-SkipInstall"
        }

        Write-Host "==> Starting payment service in a new PowerShell window"
        Start-Process -FilePath "powershell.exe" -ArgumentList $paymentArgs -WorkingDirectory (Split-Path -Parent $PSScriptRoot)
        Write-Host "==> Waiting for payment service at $paymentHealthUrl"
        Wait-ForHttpOk -Url $paymentHealthUrl -ServiceName "Payment service"
    }
}

$apiArgs = @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$ApiScript`"",
    "-DemoMarket", $DemoMarket,
    "-Port", "$Port"
)

if ($PaymentMode) {
    $apiArgs += @("-PaymentMode", $PaymentMode)
}
if ($PaymentServiceBaseUrl) {
    $apiArgs += @("-PaymentServiceBaseUrl", $PaymentServiceBaseUrl)
}
if ($MobileRedirectBase) {
    $apiArgs += @("-MobileRedirectBase", $MobileRedirectBase)
}
if ($SkipInstall) {
    $apiArgs += "-SkipInstall"
}

Write-Host "==> Starting API in a new PowerShell window"
Start-Process -FilePath "powershell.exe" -ArgumentList $apiArgs -WorkingDirectory (Split-Path -Parent $PSScriptRoot)

$localApiBaseUrl = "http://localhost:$Port"
$localApiHealthUrl = "$localApiBaseUrl/health"
Write-Host "==> Waiting for API at $localApiHealthUrl"
Wait-ForHttpOk -Url $localApiHealthUrl -ServiceName "API" -Attempts 90

if (-not (Test-SameApiUrl -Left $ApiBaseUrl -Right $localApiBaseUrl)) {
    $lanApiHealthUrl = "$($ApiBaseUrl.TrimEnd('/'))/health"
    Write-Host "==> Verifying mobile API URL at $lanApiHealthUrl"
    try {
        Wait-ForHttpOk -Url $lanApiHealthUrl -ServiceName "Mobile API URL" -Attempts 10
    } catch {
        throw "API is healthy at $localApiHealthUrl, but $lanApiHealthUrl is not reachable from this machine. Check that $ApiBaseUrl uses the current LAN IP and that Windows Firewall allows inbound traffic on port $Port."
    }
}

$mobileArgs = @(
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$MobileScript`"",
    "-ApiBaseUrl", $ApiBaseUrl
)

if ($MobileRedirectBase) {
    $mobileArgs += @("-MobileRedirectBase", $MobileRedirectBase)
}
if ($PaymentMode) {
    $mobileArgs += @("-ExpectedPaymentMode", $PaymentMode)
}
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
