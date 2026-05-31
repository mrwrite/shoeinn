param(
    [int]$Port = 8001,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $PSScriptRoot
$PaymentDir = Join-Path $RepoRoot "apps\payment"
$VenvPython = Join-Path $PaymentDir ".venv\Scripts\python.exe"
$VenvPip = Join-Path $PaymentDir ".venv\Scripts\pip.exe"
$EnvPath = Join-Path $PaymentDir ".env"

function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "==> $Label"
    & $Command
}

function Test-DotEnvValue {
    param(
        [string]$Path,
        [string]$Name
    )

    if (-not (Test-Path $Path)) {
        return $false
    }

    $match = Select-String -Path $Path -Pattern "^$([regex]::Escape($Name))=(.+)$" | Select-Object -First 1
    return [bool]$match
}

Push-Location $PaymentDir
try {
    Invoke-Step "Checking payment service config" {
        if (-not (Test-Path $EnvPath)) {
            throw "apps/payment/.env is required for service payment mode. Add STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET, then rerun this script."
        }
        if (-not (Test-DotEnvValue $EnvPath "STRIPE_API_KEY")) {
            throw "apps/payment/.env is missing STRIPE_API_KEY."
        }
        if (-not (Test-DotEnvValue $EnvPath "STRIPE_WEBHOOK_SECRET")) {
            throw "apps/payment/.env is missing STRIPE_WEBHOOK_SECRET."
        }
    }

    Invoke-Step "Preparing payment virtual environment" {
        if (-not (Test-Path $VenvPython)) {
            py -3.11 -m venv .venv
        }
    }

    if (-not $SkipInstall) {
        Invoke-Step "Installing payment dependencies" {
            & $VenvPip install -e .
        }
    }

    Invoke-Step "Starting payment service on http://localhost:$Port" {
        $existingHealthUrl = "http://localhost:$Port/health"
        try {
            $existingHealth = Invoke-RestMethod $existingHealthUrl
            if ($existingHealth.status -eq "ok") {
                Write-Host "Payment service is already running on port $Port."
                return
            }
        } catch {
        }

        $paymentArgs = @(
            "-m", "uvicorn",
            "app.main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "$Port"
        )

        $paymentProcess = Start-Process -FilePath $VenvPython -ArgumentList $paymentArgs -WorkingDirectory $PaymentDir -NoNewWindow -PassThru

        try {
            $ready = $false
            for ($i = 0; $i -lt 40; $i++) {
                try {
                    Invoke-RestMethod $existingHealthUrl | Out-Null
                    $ready = $true
                    break
                } catch {
                    Start-Sleep -Seconds 1
                }
            }

            if (-not $ready) {
                throw "Payment service did not become healthy at $existingHealthUrl"
            }

            Write-Host ""
            Write-Host "Payment service is running. Press Ctrl+C to stop."
            Wait-Process -Id $paymentProcess.Id
        } finally {
            if ($paymentProcess -and -not $paymentProcess.HasExited) {
                Stop-Process -Id $paymentProcess.Id -Force
            }
        }
    }
} finally {
    Pop-Location
}
