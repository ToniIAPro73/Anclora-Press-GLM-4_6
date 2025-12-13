@echo off
REM Limpiar puertos usados por Anclora Press
REM Puerto 3000 - Servidor de desarrollo Next.js
REM Puerto 81 - Caddy reverse proxy (opcional)

echo.
echo ========================================
echo  Anclora Press - Limpieza de Puertos
echo ========================================
echo.

setlocal enabledelayedexpansion

REM Array de puertos a limpiar
set "ports=3000 81"
set "puerto_limpiado=0"

for %%p in (%ports%) do (
    echo Verificando puerto %%p...
    for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%%p"') do (
        if not "%%a"=="" (
            echo   [!] Proceso encontrado en puerto %%p - PID: %%a
            echo   Deteniendo proceso...
            taskkill /PID %%a /F /T 2>nul
            if !errorlevel! equ 0 (
                echo   [✓] Proceso %%a terminado
                set "puerto_limpiado=1"
            ) else (
                echo   [!] No se pudo terminar el proceso %%a
            )
        )
    )
    if "!puerto_limpiado!"=="0" (
        echo   [✓] Puerto %%p disponible
    )
    set "puerto_limpiado=0"
    echo.
)

timeout /t 2 /nobreak
echo.
echo ========================================
echo  [✓] Limpieza completada
echo  Ahora puedes ejecutar: npm run dev
echo ========================================
echo.
