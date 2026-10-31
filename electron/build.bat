@echo off
chcp 65001 >nul
REM ============================================================
REM  Сборка релиза WebExcel для Windows (нужен Node.js LTS)
REM  Результат в папке release\: WebExcel\ (портативный), zip, Setup.exe
REM ============================================================
cd /d "%~dp0"
where node >nul 2>nul || (echo Установите Node.js LTS с https://nodejs.org и повторите.&pause&exit /b 1)

echo [1/4] Подготовка web-файлов в app\ ...
if exist app rmdir /s /q app
mkdir app
copy ..\index.html app\ >nul
copy ..\app.js ..\style.css ..\desktop.js app\ >nul
copy ..\pivot.js ..\pivot2.js ..\groups.js ..\xlsx-export.js ..\xlsx-extras.js app\ >nul
copy ..\icon.svg app\ >nul

mkdir app\vendor\luckysheet\plugins\css
mkdir app\vendor\luckysheet\plugins\images
mkdir app\vendor\luckysheet\plugins\js
mkdir app\vendor\luckysheet\assets\iconfont
mkdir app\vendor\luckysheet\css
mkdir app\vendor\luckysheet\fonts
mkdir app\vendor\luckysheet\expendPlugins\chart
copy ..\plugin.js app\vendor\luckysheet\plugins\js\ >nul
copy ..\pluginsCss.css ..\plugins.css app\vendor\luckysheet\plugins\css\ >nul
copy ..\*.png ..\*.gif app\vendor\luckysheet\plugins\images\ >nul
copy ..\luckysheet.umd.js app\vendor\luckysheet\ >nul
copy ..\luckyexcel.umd.js ..\exceljs.min.js ..\jszip.min.js app\vendor\ >nul
copy ..\luckysheet.css app\vendor\luckysheet\css\ >nul
copy ..\chartmix.css ..\chartmix.umd.min.js app\vendor\luckysheet\expendPlugins\chart\ >nul
copy ..\iconfont.* app\vendor\luckysheet\assets\iconfont\ >nul
copy ..\*.ttf ..\*.otf ..\*.woff ..\*.woff2 ..\*.eot app\vendor\luckysheet\fonts\ >nul
if not exist app\vendor\luckysheet\images mkdir app\vendor\luckysheet\images
copy ..\sprite38.svg ..\menuSprite.svg ..\icon_dropCell.png ..\arrow-down.png ..\js.png ..\CFicons.png ..\CFdataBar.png ..\CFcolorGradation.png app\vendor\luckysheet\images\ >nul
copy ..\paint_32px.ico app\ >nul

echo [2/4] Установка Electron Packager...
call npm install --no-audit --no-fund

echo [3/4] Сборка WebExcel.exe ...
call npx --yes @electron/packager . WebExcel --platform=win32 --arch=x64 --out=..\release-build --overwrite --icon=..\paint_32px.ico || (echo Ошибка сборки.&pause&exit /b 1)

echo [4/4] Создание установщика...
powershell -NoProfile -ExecutionPolicy Bypass -File make-setup.ps1

echo.
echo Готово! Смотрите папку release\
pause
