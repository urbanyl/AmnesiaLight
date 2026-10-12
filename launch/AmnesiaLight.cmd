@echo off
setlocal EnableExtensions
title AmnesiaLight

rem =========================================================================
rem  AmnesiaLight launcher (Windows)
rem  Starts the browser with the AmnesiaLight profile.
rem  Default: private window (no traces). Use --session for a persistent one.
rem =========================================================================

set "ROOT=%~dp0.."
set "PROFILE=%ROOT%\profile"

set "MODE=--private-window"
if /I "%~1"=="--session" set "MODE="
if /I "%~1"=="/session"  set "MODE="

set "ENGINE="
if exist "%ROOT%\engine\amnesialight.exe" set "ENGINE=%ROOT%\engine\amnesialight.exe"
if not defined ENGINE if exist "%ROOT%\engine\firefox.exe" set "ENGINE=%ROOT%\engine\firefox.exe"
if not defined ENGINE if exist "%ProgramFiles%\AmnesiaLight\amnesialight.exe" set "ENGINE=%ProgramFiles%\AmnesiaLight\amnesialight.exe"
if not defined ENGINE (
  for %%P in ("%ProgramFiles%" "%ProgramFiles(x86)%" "%LOCALAPPDATA%") do (
    if not defined ENGINE if exist "%%~P\AmnesiaLight\amnesialight.exe" set "ENGINE=%%~P\AmnesiaLight\amnesialight.exe"
  )
)
if not defined ENGINE ( where amnesialight.exe >nul 2>nul && set "ENGINE=amnesialight.exe" )

if not defined ENGINE (
  echo.
  echo   AmnesiaLight - moteur introuvable.
  echo.
  echo   Placez le binaire du moteur dans :  %ROOT%\engine\amnesialight.exe
  echo   ^(ou installez AmnesiaLight dans Program Files.^)
  echo.
  pause
  exit /b 1
)

echo   AmnesiaLight  -  profil : %PROFILE%
if defined MODE (echo   Mode : fenetre privee ^(aucune trace^).) else (echo   Mode : session persistante.)

rem Sync policies next to the engine (DuckDuckGo default + hardening)
if not exist "%ROOT%\engine\distribution" mkdir "%ROOT%\engine\distribution" >nul 2>nul
if exist "%ROOT%\distribution\policies.json" copy /y "%ROOT%\distribution\policies.json" "%ROOT%\engine\distribution\policies.json" >nul 2>nul

"%ENGINE%" -profile "%PROFILE%" -no-remote %MODE% %*
endlocal
