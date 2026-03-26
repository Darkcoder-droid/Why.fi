$ErrorActionPreference = "Stop"

$RepoUrl = if ($env:REPO_URL) { $env:REPO_URL } else { "https://github.com/notysozu/why.fi.git" }
$ProjectDir = if ($env:PROJECT_DIR) { $env:PROJECT_DIR } else { "why.fi" }
$StartApp = if ($env:START_APP) { $env:START_APP } else { "0" }

function Write-Log {
  param([string]$Message)
  Write-Host "[why.fi] $Message"
}

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-WithWinget {
  param([string[]]$Packages)
  foreach ($pkg in $Packages) {
    Write-Log "Installing $pkg with winget"
    winget install --id $pkg --accept-source-agreements --accept-package-agreements -e
  }
}

function Install-WithChoco {
  param([string[]]$Packages)
  foreach ($pkg in $Packages) {
    Write-Log "Installing $pkg with choco"
    choco install $pkg -y
  }
}

function Ensure-SystemDependencies {
  $packagesWinget = @()
  $packagesChoco = @()

  if (-not (Test-Command "git")) {
    $packagesWinget += "Git.Git"
    $packagesChoco += "git"
  }

  if (-not (Test-Command "python")) {
    $packagesWinget += "Python.Python.3.12"
    $packagesChoco += "python"
  }

  if (-not (Test-Command "node")) {
    $packagesWinget += "OpenJS.NodeJS.LTS"
    $packagesChoco += "nodejs-lts"
  }

  if ($packagesWinget.Count -eq 0 -and $packagesChoco.Count -eq 0) {
    return
  }

  if (Test-Command "winget") {
    Install-WithWinget $packagesWinget
  }
  elseif (Test-Command "choco") {
    Install-WithChoco $packagesChoco
  }
  else {
    throw "Neither winget nor choco is available. Install Git, Python 3.12+, and Node.js LTS manually."
  }
}

function Get-RepoRoot {
  if ((Test-Path "frontend/package.json") -and (Test-Path "backend/main.py")) {
    return (Get-Location).Path
  }

  if (Test-Path "$ProjectDir/.git") {
    return (Resolve-Path $ProjectDir).Path
  }

  Write-Log "Cloning repository into $ProjectDir"
  git clone $RepoUrl $ProjectDir | Out-Null
  return (Resolve-Path $ProjectDir).Path
}

function Write-EnvFile {
  param([string]$RepoRoot)

  $envExample = Join-Path $RepoRoot ".env.example"
  $envFile = Join-Path $RepoRoot ".env"

  if (-not (Test-Path $envExample)) {
    throw ".env.example is missing from the repository."
  }

  if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Log "Created .env from .env.example"
  }
  else {
    Write-Log ".env already exists, leaving it unchanged"
  }
}

function Setup-Backend {
  param([string]$RepoRoot)

  $venvPath = Join-Path $RepoRoot ".venv"
  $python = (Get-Command python).Source

  if (-not (Test-Path $venvPath)) {
    Write-Log "Creating Python virtual environment"
    & $python -m venv $venvPath
  }
  else {
    Write-Log "Using existing Python virtual environment"
  }

  $venvPython = Join-Path $venvPath "Scripts\python.exe"
  & $venvPython -m pip install --upgrade pip
  & $venvPython -m pip install -r (Join-Path $RepoRoot "backend\requirements.txt")
}

function Setup-Frontend {
  param([string]$RepoRoot)

  Push-Location (Join-Path $RepoRoot "frontend")
  try {
    if (Test-Path "package-lock.json") {
      npm ci
    }
    else {
      npm install
    }
    npm run build
  }
  finally {
    Pop-Location
  }
}

function Start-App {
  param([string]$RepoRoot)

  $venvPython = Join-Path $RepoRoot ".venv\Scripts\python.exe"

  Write-Log "Starting backend"
  Start-Process -FilePath $venvPython -ArgumentList "-m uvicorn backend.main:app --host 0.0.0.0 --port 8001" -WorkingDirectory $RepoRoot

  Write-Log "Starting frontend"
  Start-Process -FilePath "npm.cmd" -ArgumentList "run dev -- --host 0.0.0.0" -WorkingDirectory (Join-Path $RepoRoot "frontend")
}

function Print-Summary {
  param([string]$RepoRoot)

  Write-Host ""
  Write-Host "Repo: $RepoRoot"
  Write-Host "Manual start commands:"
  Write-Host "  .\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8001"
  Write-Host "  cd frontend; npm run dev"
  Write-Host ""
  Write-Host "Deployment:"
  Write-Host "  Frontend: Vercel with VITE_API_URL=https://your-fly-app.fly.dev"
  Write-Host "  Backend: Fly.io using fly.toml"
}

Ensure-SystemDependencies
$repoRoot = Get-RepoRoot
Write-EnvFile -RepoRoot $repoRoot
Setup-Backend -RepoRoot $repoRoot
Setup-Frontend -RepoRoot $repoRoot
Print-Summary -RepoRoot $repoRoot

if ($StartApp -eq "1") {
  Start-App -RepoRoot $repoRoot
}
else {
  Write-Log "Set START_APP=1 to launch the backend and frontend automatically after install"
}
