@echo off
setlocal
title llmtrans Runtime Installer
chcp 65001 >nul

echo llmtrans dependency installer
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-dependencies.ps1"
set "exit_code=%errorlevel%"

echo.
if "%exit_code%"=="0" (
  echo Installation succeeded.
) else (
  echo Installation failed. Error code: %exit_code%
)
echo.
pause
exit /b %exit_code%
