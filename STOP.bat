@echo off
curl -s -X POST http://127.0.0.1:8765/api/exit >nul 2>nul
echo WebExcel Local остановлен.
timeout /t 2 >nul
