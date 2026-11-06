
# Usage: .\scripts\backup.ps1
# Requires DIRECT_URL and pg_dump

$ErrorActionPreference = "Stop"

$root = Split-Path $PSScriptRoot -Parent

# Read database URL from environment or .env
$url = $env:DIRECT_URL

if (-not $url -and (Test-Path "$root\.env")) {
    foreach ($line in Get-Content "$root\.env") {
        if ($line -match '^\s*DIRECT_URL\s*=\s*"?([^"]+)"?\s*$') {
            $url = $Matches[1]
            break
        }
    }
}

if (-not $url) {
    throw "DIRECT_URL was not found."
}

# Check pg_dump
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    throw "pg_dump was not found. Please install PostgreSQL client tools."
}

# Create backup directory
$dir = Join-Path $root "backups"
New-Item -ItemType Directory -Force $dir | Out-Null

# Generate backup filename
$file = Join-Path $dir (
    "attendance-" + (Get-Date -Format "yyyyMMdd-HHmm") + ".dump"
)

# Run backup
$pgDump = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"

& $pgDump --format=custom --no-owner --file="$file" "$url"

if ($LASTEXITCODE -ne 0) {
    throw "Database backup failed. Exit code: $LASTEXITCODE"
}

Write-Host "Backup completed: $file" -ForegroundColor Green
