$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Write-Step([string]$message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Test-PythonLauncher {
  try {
    & py -3 -c "import sys; print(sys.executable)" | Out-Host
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

Write-Host "llmtrans runtime installer" -ForegroundColor White
Write-Host "This installs Python dependencies for the current Windows user."

if (-not (Test-PythonLauncher)) {
  Write-Step "Python 3 was not found. Installing Python 3.12 with winget"
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "Python 3 and winget are both unavailable. Install Python 3.12 from python.org, enable the Python launcher, then run this file again."
  }

  & winget install --id Python.Python.3.12 --exact --scope user --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "winget failed to install Python 3.12."
  }

  $launcher = Join-Path $env:LOCALAPPDATA 'Programs\Python\Launcher\py.exe'
  if (Test-Path $launcher) {
    $env:PATH = "$(Split-Path $launcher);$env:PATH"
  }

  if (-not (Test-PythonLauncher)) {
    throw "Python was installed, but the Python launcher is not visible yet. Close this window and run the installer again."
  }
}

Write-Step "Updating pip"
& py -3 -m pip install --user --upgrade pip
if ($LASTEXITCODE -ne 0) {
  throw "pip update failed."
}

Write-Step "Installing Playwright and chardet"
& py -3 -m pip install --user --upgrade playwright chardet
if ($LASTEXITCODE -ne 0) {
  throw "Python dependency installation failed."
}

Write-Step "Installing Playwright Chromium"
& py -3 -m playwright install chromium
if ($LASTEXITCODE -ne 0) {
  throw "Chromium installation failed. Check the network connection and run this installer again."
}

Write-Step "Verifying the runtime"
& py -3 -c "import playwright, chardet; print('Python dependencies: OK')"
if ($LASTEXITCODE -ne 0) {
  throw "Dependency verification failed."
}

& py -3 -c "from playwright.sync_api import sync_playwright; p=sync_playwright().start(); b=p.chromium.launch(headless=True); print('Chromium launch: OK'); b.close(); p.stop()"
if ($LASTEXITCODE -ne 0) {
  throw "Chromium launch verification failed."
}

Write-Host ""
Write-Host "Installation completed. You can now run llmtrans.exe." -ForegroundColor Green
