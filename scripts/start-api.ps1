param(
    [ValidateSet("shelby", "mt_juliet")]
    [string]$DemoMarket = "shelby",
    [switch]$NoSeed,
    [switch]$ResetDb,
    [switch]$SkipInstall,
    [ValidateSet("", "mock", "service")]
    [string]$PaymentMode = "",
    [string]$PaymentServiceBaseUrl = "",
    [string]$MobileRedirectBase = "",
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ApiDir = Join-Path $RepoRoot "apps\api"
$VenvPython = Join-Path $ApiDir ".venv\Scripts\python.exe"
$VenvPip = Join-Path $ApiDir ".venv\Scripts\pip.exe"
$EnvPath = Join-Path $ApiDir ".env"
$EnvExamplePath = Join-Path $ApiDir ".env.example"

function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "==> $Label"
    & $Command
}

function Set-DotEnvValue {
    param(
        [string]$Path,
        [string]$Name,
        [string]$Value
    )

    $content = ""
    if (Test-Path $Path) {
        $content = Get-Content $Path -Raw
    }

    $line = "$Name=$Value"
    $pattern = "(?m)^$([regex]::Escape($Name))=.*$"

    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, $line)
    } else {
        if ($content.Length -gt 0 -and -not $content.EndsWith("`n")) {
            $content += "`n"
        }
        $content += "$line`n"
    }

    Set-Content -Path $Path -Value $content -NoNewline
}

function Get-DotEnvValue {
    param(
        [string]$Path,
        [string]$Name
    )

    if (-not (Test-Path $Path)) {
        return ""
    }

    $match = Select-String -Path $Path -Pattern "^$([regex]::Escape($Name))=(.*)$" | Select-Object -First 1
    if (-not $match) {
        return ""
    }

    return $match.Matches[0].Groups[1].Value.Trim()
}

Push-Location $ApiDir
try {
    Invoke-Step "Starting Postgres" {
        if ($ResetDb) {
            docker compose down -v
        }
        docker compose up -d
    }

    Invoke-Step "Preparing Python virtual environment" {
        if (-not (Test-Path $VenvPython)) {
            py -3.11 -m venv .venv
        }
    }

    Invoke-Step "Preparing API .env" {
        $createdEnv = $false
        if (-not (Test-Path $EnvPath)) {
            Copy-Item $EnvExamplePath $EnvPath
            $createdEnv = $true
        }

        $existingPaymentMode = Get-DotEnvValue $EnvPath "PAYMENT_MODE"
        $effectivePaymentMode = if ($PaymentMode) {
            $PaymentMode
        } elseif (-not $createdEnv -and $existingPaymentMode) {
            $existingPaymentMode
        } else {
            "mock"
        }

        $existingPaymentServiceBaseUrl = Get-DotEnvValue $EnvPath "PAYMENT_SERVICE_BASE_URL"
        $effectivePaymentServiceBaseUrl = if ($PaymentServiceBaseUrl) {
            $PaymentServiceBaseUrl
        } elseif ($existingPaymentServiceBaseUrl) {
            $existingPaymentServiceBaseUrl
        } else {
            ""
        }

        $existingMobileRedirectBase = Get-DotEnvValue $EnvPath "PAYMENT_MOBILE_REDIRECT_BASE"
        $effectiveMobileRedirectBase = if ($MobileRedirectBase) {
            $MobileRedirectBase
        } elseif ($existingMobileRedirectBase) {
            $existingMobileRedirectBase
        } else {
            ""
        }

        if ($effectivePaymentMode -eq "service") {
            if (-not $effectivePaymentServiceBaseUrl) {
                $effectivePaymentServiceBaseUrl = "http://localhost:8001"
            }
            if (-not $effectiveMobileRedirectBase) {
                throw "PAYMENT_MODE=service requires -MobileRedirectBase, for example exp://<YOUR-LAN-IP>:8081/-- for Expo Go or shoeinn://app for a dev build."
            }
            try {
                Invoke-RestMethod "$($effectivePaymentServiceBaseUrl.TrimEnd('/'))/health" | Out-Null
            } catch {
                throw "PAYMENT_MODE=service requires the payment service to be reachable at $effectivePaymentServiceBaseUrl. Start apps/payment first, then rerun this script."
            }
        }

        Set-DotEnvValue $EnvPath "DATABASE_URL" "postgresql+psycopg://postgres:postgres@localhost:5432/shoeinn"
        Set-DotEnvValue $EnvPath "API_HOST" "0.0.0.0"
        Set-DotEnvValue $EnvPath "API_PORT" "$Port"
        Set-DotEnvValue $EnvPath "PAYMENT_MODE" $effectivePaymentMode
        Set-DotEnvValue $EnvPath "PAYMENT_SERVICE_BASE_URL" $effectivePaymentServiceBaseUrl
        Set-DotEnvValue $EnvPath "PAYMENT_MOBILE_REDIRECT_BASE" $effectiveMobileRedirectBase

        Write-Host "Payment mode: $effectivePaymentMode"
        if ($effectivePaymentMode -eq "service") {
            Write-Host "Payment service: $effectivePaymentServiceBaseUrl"
            Write-Host "Mobile redirect base: $effectiveMobileRedirectBase"
        }
    }

    if (-not $SkipInstall) {
        Invoke-Step "Installing API dependencies" {
            & $VenvPip install -r ..\..\requirements.txt
            & $VenvPip install -e .
        }
    }

    Invoke-Step "Running API migrations" {
        & $VenvPython -m alembic upgrade head
    }

    Invoke-Step "Starting API on http://localhost:$Port" {
        $existingReadyUrl = "http://localhost:$Port/ready"
        try {
            $existingReady = Invoke-RestMethod $existingReadyUrl
            $existingMode = $existingReady.payment_mode
            throw "An API is already running on port $Port with payment_mode=$existingMode. Stop that process before starting a new API instance, or use a different -Port."
        } catch {
            if ($_.Exception.Message -like "An API is already running on port*") {
                throw
            }
        }

        $apiArgs = @(
            "-m", "uvicorn",
            "app.main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "$Port"
        )

        $apiProcess = Start-Process -FilePath $VenvPython -ArgumentList $apiArgs -WorkingDirectory $ApiDir -NoNewWindow -PassThru

        try {
            $healthUrl = "http://localhost:$Port/health"
            $ready = $false
            for ($i = 0; $i -lt 40; $i++) {
                try {
                    Invoke-RestMethod $healthUrl | Out-Null
                    $ready = $true
                    break
                } catch {
                    Start-Sleep -Seconds 1
                }
            }

            if (-not $ready) {
                throw "API did not become healthy at $healthUrl"
            }

            if (-not $NoSeed) {
                $seedUrl = "http://localhost:$Port/dev/seed?reset=true&demo_market=$DemoMarket"
                Invoke-Step "Seeding demo data ($DemoMarket)" {
                    Invoke-RestMethod -Method Post $seedUrl | Out-Null
                }
            }

            Write-Host ""
            Write-Host "API is running. Press Ctrl+C to stop."
            Wait-Process -Id $apiProcess.Id
        } finally {
            if ($apiProcess -and -not $apiProcess.HasExited) {
                Stop-Process -Id $apiProcess.Id -Force
            }
        }
    }
} finally {
    Pop-Location
}
