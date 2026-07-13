# qa-git installer for Windows (PowerShell).
#
#   irm https://raw.githubusercontent.com/raintr91/qaGit/main/install.ps1 | iex
#
# Prefers WSL if available. Falls back to native Windows when Node ≥ 22 is on PATH.
#
# Env:
#   QA_GIT_REPO, QA_GIT_INSTALL_DIR, QA_GIT_REF
#   QA_GIT_USE_WSL=0 to force native Windows install

$ErrorActionPreference = 'Stop'
$repo = if ($env:QA_GIT_REPO) { $env:QA_GIT_REPO } else { 'raintr91/qaGit' }
$ref = if ($env:QA_GIT_REF) { $env:QA_GIT_REF } else { 'main' }
$useWsl = $env:QA_GIT_USE_WSL -ne '0'

function Test-Wsl {
  try {
    $null = & wsl.exe -e echo ok 2>$null
    return ($LASTEXITCODE -eq 0)
  } catch { return $false }
}

if ($useWsl -and (Test-Wsl)) {
  Write-Host "Installing qa-git inside WSL (github.com/$repo @$ref)..."
  $bash = @"
set -euo pipefail
curl -fsSL https://raw.githubusercontent.com/$repo/$ref/install.sh | bash
"@
  & wsl.exe -e bash -lc $bash
  if ($LASTEXITCODE -ne 0) { throw "WSL install failed (exit $LASTEXITCODE)" }

  Write-Host ""
  Write-Host "Configuring Cursor MCP to call WSL qa-git..."
  & wsl.exe -e bash -lc "qa-git install --target=cursor --yes --wsl --mcp-file `$(wslpath '$env:USERPROFILE')/.cursor/mcp.json"
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Could not auto-write mcp.json. From WSL run:"
    Write-Warning "  qa-git install --target=cursor --yes --wsl --mcp-file /mnt/c/Users/<you>/.cursor/mcp.json"
  }

  Write-Host "Done. Restart Cursor, then try MCP tools qa_git_*."
  Write-Host "CLI (WSL): wsl qa-git version"
  Write-Host "In product repo: wsl qa-git init   # ↑↓ space enter (Kilo = not supported)"
  return
}

# --- Native Windows (Node required) ---
$installDir = if ($env:QA_GIT_INSTALL_DIR) { $env:QA_GIT_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA 'qa-git' }
Write-Host "Installing qa-git natively → $installDir"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js ≥ 22 required on PATH (or use WSL install)."
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git required on PATH."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm required on PATH."
}

$tmp = Join-Path $env:TEMP ("qg-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
try {
  git clone --depth 1 --branch $ref "https://github.com/$repo.git" (Join-Path $tmp 'src')
  if (Test-Path $installDir) { Remove-Item -Recurse -Force $installDir }
  New-Item -ItemType Directory -Force -Path (Split-Path $installDir) | Out-Null
  Move-Item (Join-Path $tmp 'src') $installDir
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}

Push-Location $installDir
try {
  npm install
  npm run build
} finally {
  Pop-Location
}

$binDir = Join-Path $installDir 'bin'
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (($userPath -split ';') -notcontains $binDir) {
  [Environment]::SetEnvironmentVariable('Path', "$binDir;$userPath", 'User')
  Write-Host "Added $binDir to User PATH (restart terminal)."
}

$cmdShim = Join-Path $binDir 'qa-git.cmd'
@"
@echo off
node "%~dp0qa-git.mjs" %*
"@ | Set-Content -Path $cmdShim -Encoding ASCII

Write-Host "Run: qa-git version"
Write-Host "Then: qa-git install --target=auto --yes"
Write-Host "In product repo: qa-git init   # ↑↓ space enter (Kilo = not supported)"
Write-Host "Or: npx --yes github:$repo"
