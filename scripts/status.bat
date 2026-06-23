@echo off
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0status.ps1" %*
if errorlevel 1 (
  echo.
  echo Status check failed. See messages above.
  pause
  exit /b 1
)
