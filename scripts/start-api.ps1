param(
    [ValidateSet("shelby", "mt_juliet")]
    [string]$DemoMarket = "shelby",
    [switch]$NoSeed,
    [switch]$ResetDb,
    [switch]$SkipInstall,
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
        if (-not (Test-Path $EnvPath)) {
            Copy-Item $EnvExamplePath $EnvPath
        }

        Set-DotEnvValue $EnvPath "DATABASE_URL" "postgresql+psycopg://postgres:postgres@localhost:5432/shoeinn"
        Set-DotEnvValue $EnvPath "API_HOST" "0.0.0.0"
        Set-DotEnvValue $EnvPath "API_PORT" "$Port"
        Set-DotEnvValue $EnvPath "PAYMENT_MODE" "mock"
        Set-DotEnvValue $EnvPath "PAYMENT_SERVICE_BASE_URL" ""
        Set-DotEnvValue $EnvPath "PAYMENT_MOBILE_REDIRECT_BASE" ""
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
