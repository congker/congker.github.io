@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "REPO=git@github.com:congker/congker.github.io.git"
set "SSH_KEY=D:/SshConfig/github/github_ed25519"
set "GIT_SSH_COMMAND=ssh -i %SSH_KEY% -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
set "DEPLOY_DIR=%TEMP%\blog-web-pages-deploy"

if "%~1"=="" (
  set "COMMIT_MSG=Update blog"
) else (
  set "COMMIT_MSG=%~1"
)

echo [1/6] Checking source branch...
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo This directory is not a git repository.
  exit /b 1
)

for /f "tokens=*" %%b in ('git branch --show-current') do set "CURRENT_BRANCH=%%b"
if not "%CURRENT_BRANCH%"=="source" (
  echo Switching to source branch...
  git checkout source
  if errorlevel 1 exit /b 1
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin %REPO%
) else (
  git remote set-url origin %REPO%
)

echo [2/6] Committing source changes if needed...
git add .
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%COMMIT_MSG%"
  if errorlevel 1 exit /b 1
) else (
  call :print_no_new_files
)

echo [3/6] Pushing source branch...
git push origin source
if errorlevel 1 exit /b 1

echo [4/6] Building site...
call npm run build
if errorlevel 1 exit /b 1

echo [5/6] Publishing .vitepress/dist to main...
if exist "%DEPLOY_DIR%" rmdir /s /q "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%"
xcopy ".vitepress\dist\*" "%DEPLOY_DIR%\" /E /I /Y >nul
type nul > "%DEPLOY_DIR%\.nojekyll"

git init -b main "%DEPLOY_DIR%"
if errorlevel 1 exit /b 1

git -C "%DEPLOY_DIR%" config user.name "xuwencong"
git -C "%DEPLOY_DIR%" config user.email "xuwencong@corp.netease.com"
git -C "%DEPLOY_DIR%" add .
git -C "%DEPLOY_DIR%" commit -m "Deploy VitePress site"
if errorlevel 1 exit /b 1

git -C "%DEPLOY_DIR%" remote add origin %REPO%
git -C "%DEPLOY_DIR%" push origin main --force
if errorlevel 1 exit /b 1

echo [6/6] Done.
echo.
echo Source branch: source
echo Pages branch: main
echo URL: https://congker.github.io/
exit /b 0

:print_no_new_files
powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('5pqC5peg5paw5aKe5paH5Lu2')))"
exit /b 0
