#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
Write-Host "Detecting Windows Version: $([System.Environment]::OSVersion.Version)"
$pkgMgr = "none"
if (Get-Command choco -ErrorAction SilentlyContinue) { $pkgMgr = "choco" }
elseif (Get-Command winget -ErrorAction SilentlyContinue) { $pkgMgr = "winget" }
Write-Host "→ Installing system dependencies..."
if ($pkgMgr -eq "choco") { choco install python nodejs -y }
Write-Host "→ Cloning repository if needed..."
if (-Not (Test-Path "why.fi") -and -Not (Test-Path "frontend")) {
    git clone https://github.com/notysozu/why.fi.git
    Set-Location why.fi
}
Write-Host "→ Setting up project dependencies..."
if (Test-Path "frontend") { Set-Location frontend; npm install; Set-Location .. }
if (Test-Path "backend") {
    Set-Location backend
    python -m venv venv
    .\venv\Scripts\activate.ps1
    pip install -r requirements.txt
    pip install -r requirements-test.txt
    Set-Location ..
}
Write-Host "→ Configuring environment..."
if (-Not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item .env.example .env
}
Write-Host "→ Building project..."
if (Test-Path "frontend") { Set-Location frontend; npm run build; Set-Location .. }
Write-Host "✓ Installation complete! To start:"
Write-Host "frontend: cd frontend; npm run dev"
Write-Host "backend: cd backend; .\venv\Scripts\activate.ps1; fastapi dev main.py"
