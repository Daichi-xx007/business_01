@echo off
cd /d "c:\Users\hp\Documents\Website mama"
echo === Node Version ===
node -v
echo === NPM Version ===
call npm -v
echo === Starting NPM Install ===
call npm install
echo === Done (exit code: %ERRORLEVEL%) ===
pause
