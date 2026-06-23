@echo off
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" %*
if errorlevel 1 (
  echo.
  echo Stop failed. See messages above.
  pause
  exit /b 1
)
