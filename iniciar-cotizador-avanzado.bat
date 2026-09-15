@echo off
setlocal enabledelayedexpansion

REM ============================================
REM COTIZADOR MERCARI v2.0 - MODO AVANZADO
REM ============================================

echo.
echo ========================================
echo   COTIZADOR MERCARI v2.0
echo   Modo Avanzado (Reinicio automatico)
echo ========================================
echo.

set PUERTO=5000

:MENU
cls
echo.
echo ========================================
echo   COTIZADOR MERCARI - MENU
echo ========================================
echo.
echo 1. Iniciar servidor
echo 2. Iniciar y abrir navegador
echo 3. Reiniciar servidor
echo 4. Ver archivos del proyecto
echo 5. Salir
echo.

set /p opcion="Selecciona una opcion (1-5): "

if "%opcion%"=="1" goto INICIAR
if "%opcion%"=="2" goto INICIAR_BROWSER
if "%opcion%"=="3" goto REINICIAR
if "%opcion%"=="4" goto ARCHIVOS
if "%opcion%"=="5" goto SALIR

echo Opcion invalida. Intenta de nuevo.
timeout /t 2 /nobreak
goto MENU

:INICIAR
echo.
echo Iniciando servidor en http://localhost:%PUERTO%...
echo.
npm start
goto MENU

:INICIAR_BROWSER
echo.
echo Matando proceso anterior (si existe)...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak

echo Iniciando servidor...
start npm start
timeout /t 3 /nobreak

echo Abriendo navegador en http://localhost:%PUERTO%...
start http://localhost:%PUERTO%

echo.
echo Servidor iniciado! El navegador se abrira automaticamente.
echo Presiona Ctrl+C en esta ventana para detener el servidor.
echo.
pause
goto MENU

:REINICIAR
echo.
echo Matando proceso Node.js anterior...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak

echo Iniciando servidor nuevamente...
echo.
npm start
goto MENU

:ARCHIVOS
cls
echo.
echo ========================================
echo   ARCHIVOS DEL PROYECTO
echo ========================================
echo.
dir
echo.
pause
goto MENU

:SALIR
echo.
echo Cerrando...
timeout /t 1 /nobreak
exit /b 0
