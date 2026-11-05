# ใช้: .\scripts\backup.ps1  (ต้องมี DIRECT_URL ใน .env หรือใน session และมี pg_dump)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

$url = $env:DIRECT_URL
if (-not $url -and (Test-Path "$root\.env")) {
  foreach ($line in Get-Content "$root\.env") {
    if ($line -match '^\s*DIRECT_URL\s*=\s*"?([^"]+)"?\s*$') { $url = $Matches[1] }
  }
}
if (-not $url) { throw "ไม่พบ DIRECT_URL" }

$dir = "$root\backups"
New-Item -ItemType Directory -Force $dir | Out-Null
$file = Join-Path $dir ("attendance-" + (Get-Date -Format "yyyyMMdd-HHmm") + ".dump")

pg_dump --format=custom --no-owner --file=$file $url
Write-Host "สำรองแล้ว: $file"