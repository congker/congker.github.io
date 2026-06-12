@echo off
setlocal EnableExtensions

cd /d "%~dp0"

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 exit /b 0

for /f "delims=" %%i in ('git status --porcelain 2^>nul') do (
  call "%~dp0github-push.bat"
  if errorlevel 1 exit /b 1
  exit /b 0
)

exit /b 0
