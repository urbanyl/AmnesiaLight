@echo off
setlocal EnableExtensions
title AmnesiaLight - effacement

rem =========================================================================
rem  AmnesiaLight panic wipe
rem  Removes every trace from the profile (history, cookies, cache, sessions)
rem  while keeping the theme and settings. Close the browser first.
rem =========================================================================

set "ROOT=%~dp0.."
set "PROFILE=%ROOT%\profile"

echo Effacement des traces dans : %PROFILE%
for /d %%D in ("%PROFILE%\*") do (
  if /I not "%%~nxD"=="chrome" if /I not "%%~nxD"=="search" rd /s /q "%%~fD"
)
for %%F in ("%PROFILE%\*") do (
  if /I not "%%~nxF"=="user.js" del /f /q "%%~fF"
)
echo Termine. Toutes les traces ont ete effacees.
pause
endlocal
