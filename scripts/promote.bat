@echo off
REM ⚓ ANCLORA DEV SHELL — PROMOTE FULL v3.4 (Windows Batch)
REM Ejecuta el script de promote en JavaScript

setlocal enabledelayedexpansion

echo.
echo ⚓ ANCLORA DEV SHELL — PROMOTE FULL v3.4
echo.

REM Verificar que Node.js esté instalado
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Error: Node.js no está instalado o no está en el PATH
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Ejecutar el script JavaScript
node "%~dp0promote.js"

pause
