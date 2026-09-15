@echo off
setlocal enabledelayedexpansion

REM ============================================
REM COTIZADOR MERCARI v2.0
REM SETUP COMPLETO Y EJECUCIÓN
REM ============================================

cls
echo.
echo ========================================
echo   COTIZADOR MERCARI v2.0
echo   Setup Completo + Ejecución
echo ========================================
echo.

REM Variables
set PROJECT_DIR=%cd%
set PUERTO=5000

REM ============================================
REM 1. VERIFICAR NODE.JS
REM ============================================
echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Node.js no está instalado
    echo.
    echo Descárgalo desde: https://nodejs.org
    echo Luego ejecuta este script nuevamente.
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js instalado

REM ============================================
REM 2. VERIFICAR NPM
REM ============================================
echo [2/5] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm no está disponible
    pause
    exit /b 1
)

echo ✓ npm disponible

REM ============================================
REM 3. INSTALAR DEPENDENCIAS
REM ============================================
echo [3/5] Instalando dependencias...
if exist "node_modules" (
    echo ✓ Dependencias ya instaladas
) else (
    echo Ejecutando: npm install
    call npm install
    if errorlevel 1 (
        echo ❌ ERROR: Falló la instalación de dependencias
        pause
        exit /b 1
    )
    echo ✓ Dependencias instaladas
)

REM ============================================
REM 4. VERIFICAR ARCHIVOS NECESARIOS
REM ============================================
echo [4/5] Verificando archivos necesarios...

if not exist "server.js" (
    echo ❌ ERROR: No se encontró server.js
    pause
    exit /b 1
)
echo ✓ server.js encontrado

if not exist "mercari-cotizador.html" (
    echo ❌ ERROR: No se encontró mercari-cotizador.html
    pause
    exit /b 1
)
echo ✓ mercari-cotizador.html encontrado

if not exist "package.json" (
    echo ❌ ERROR: No se encontró package.json
    pause
    exit /b 1
)
echo ✓ package.json encontrado

REM ============================================
REM 5. MOSTRAR INFORMACIÓN Y EJECUTAR
REM ============================================
echo [5/5] Iniciando servidor...
echo.
echo ========================================
echo   ✓ TODO LISTO
echo ========================================
echo.
echo 🌐 URL: http://localhost:%PUERTO%
echo.
echo Presiona CTRL+C para detener el servidor
echo.
echo ========================================
echo.

REM Ejecutar servidor
npm start
