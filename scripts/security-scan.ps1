#Requires -Version 5.1
<#
.SYNOPSIS
  Run free security scanners locally via Docker (Semgrep, Trivy, Gitleaks).

.EXAMPLE
  .\scripts\security-scan.ps1
  .\scripts\security-scan.ps1 -SkipSemgrep
#>
param(
  [switch]$SkipSemgrep,
  [switch]$SkipTrivy,
  [switch]$SkipGitleaks
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Assert-Docker {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is required. Install Docker Desktop, then re-run this script. See docs/SECURITY_SCANNING.md"
  }
  docker info 1>$null 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker is installed but not running. Start Docker Desktop and try again."
  }
}

Assert-Docker
$failed = @()

if (-not $SkipGitleaks) {
  Write-Host "`n=== Gitleaks (secrets) ===" -ForegroundColor Cyan
  docker run --rm -v "${Root}:/src" zricethezav/gitleaks:latest detect --source=/src --verbose -c /src/.gitleaks.toml
  if ($LASTEXITCODE -ne 0) { $failed += 'gitleaks' }
}

if (-not $SkipSemgrep) {
  Write-Host "`n=== Semgrep (app code) ===" -ForegroundColor Cyan
  docker run --rm -v "${Root}:/src" semgrep/semgrep semgrep scan `
    --config p/javascript `
    --config p/typescript `
    --config p/react `
    --config p/nodejs `
    --config p/owasp-top-ten `
    --error `
    /src
  if ($LASTEXITCODE -ne 0) { $failed += 'semgrep' }
}

if (-not $SkipTrivy) {
  Write-Host "`n=== Trivy (dependencies) ===" -ForegroundColor Cyan
  docker run --rm -v "${Root}:/src" aquasec/trivy:latest fs --severity CRITICAL,HIGH --exit-code 1 /src
  if ($LASTEXITCODE -ne 0) { $failed += 'trivy' }
}

Write-Host ""
if ($failed.Count -gt 0) {
  Write-Host "Finished with findings in: $($failed -join ', ')" -ForegroundColor Yellow
  Write-Host "See docs/SECURITY_SCANNING.md for how to fix." -ForegroundColor Yellow
  exit 1
}

Write-Host "All local scans passed." -ForegroundColor Green
exit 0
