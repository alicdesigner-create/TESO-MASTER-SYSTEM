@echo off
title Teso Master System
set TESO_PORT=3010
echo Iniciando Teso Master System en el puerto %TESO_PORT%...
cd /d "C:\Users\aliri\OneDrive\Documentos\FREE LANCE\TESO GRAPHICS FLOW\TESO LLC\TESO RECORDS\TESO MASTER SYSTEM"

for /f "tokens=5" %%p in ('netstat -ano ^| findstr LISTENING ^| findstr :%TESO_PORT%') do taskkill /PID %%p /F >nul 2>&1

start /min cmd /c "npm run dev -- -p %TESO_PORT%"
timeout /t 5 /nobreak >nul
start http://localhost:%TESO_PORT%
