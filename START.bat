@echo off
cls
echo ========================================
echo   COTIZADOR MERCARI v2.0
echo ========================================
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no instalado
    echo Descarga desde: https://nodejs.org
    pause
    exit /b 1
)

REM Instalar si es necesario
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    echo.
)

REM Iniciar
echo.
echo ========================================
echo   Iniciando en http://localhost:5000
echo ========================================
echo.
npm start
