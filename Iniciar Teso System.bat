@echo off
title Teso Master System
set TESO_PORT=3010
echo Iniciando Teso Master System en el puerto %TESO_PORT%...
cd /d "%~dp0"

for /f "tokens=5" %%p in ('netstat -ano ^| findstr LISTENING ^| findstr :%TESO_PORT%') do taskkill /PID %%p /F >nul 2>&1

start /min cmd /c "npm run dev -- -p %TESO_PORT%"
timeout /t 5 /nobreak >nul
start http://localhost:%TESO_PORT%
