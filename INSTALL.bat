@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === WebExcel Local: установка ===
where node >nul 2>nul
if %errorlevel%==0 goto ok
echo Node.js не найден. Пробую установить через winget...
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
echo.
echo Если установка прошла успешно, ЗАКРОЙТЕ это окно и запустите INSTALL.bat ещё раз.
echo Если нет - установите Node.js LTS вручную с https://nodejs.org и повторите.
pause
exit /b 1
:ok
if not exist data mkdir data
node -v
echo Все библиотеки уже находятся в папке app\vendor - загрузка из интернета не требуется.
echo Установка завершена. Запустите START.bat
pause
