@echo off
chcp 65001 >nul
cd /d "%~dp0app"
where node >nul 2>nul
if not %errorlevel%==0 (
  echo Node.js не найден. Сначала запустите INSTALL.bat
  pause
  exit /b 1
)
start "WebExcel Local - сервер (закройте окно для остановки)" /min node server.js
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8765
