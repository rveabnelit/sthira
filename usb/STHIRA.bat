@echo off
chcp 65001 >nul
title STHIRA — локальная версия
cd /d "%~dp0app"

if not exist "%~dp0node\node.exe" (
  echo Не найден node\node.exe рядом с этим файлом.
  echo Распакуйте папку STHIRA целиком, не меняя структуру.
  pause
  exit /b 1
)

"%~dp0node\node.exe" launcher.js
if errorlevel 1 pause
