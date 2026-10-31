WebExcel Desktop — сборка релиза (exe + установщик)
====================================================

ВАЖНО: сборка .exe для Windows выполняется НА Windows-компьютере
(из этой песочницы Linux собрать легальный Windows-exe нельзя).

Что нужно:
  1. Node.js LTS  -> https://nodejs.org
  2. (опционально, для красивого Setup.exe) NSIS -> https://nsis.sourceforge.io
     Если NSIS не установлен, скрипт сам создаст запасной вариант:
     портативный exe + zip-архив.

Шаги:
  1. Скачайте/склонируйте репозиторий.
  2. Запустите  electron\build.bat  (двойным кликом).
  3. Дождитесь окончания. Результат в папке release\:
       WebExcel\WebExcel.exe        - портативная версия (запускается без установки)
       WebExcel-portable.zip        - то же самое одним архивом
       WebExcel-Setup.exe           - установщик (если установлен NSIS)
       README-SETUP.txt             - инструкция (если NSIS не установлен)

Как это работает:
  electron\main.js     - окно приложения Electron (меню скрыто, размер 1440x900)
  electron\preload.js  - мост window.weDesktop (сохранение/загрузка/выход)
  build.bat            - копирует web-файлы в electron\app\vendor с путями,
                         которые ожидает Luckysheet, затем запускает
                         @electron/packager --platform=win32 --arch=x64
  Автосохранение книги в десктоп-режиме пишется в
  Documents\WebExcel\autosave.json (в браузере — как раньше, через локальный сервер).

Публикация GitHub Release:
  После build.bat загрузите файлы из release\ в Release на GitHub:
    gh release create v1.0.0 release/WebExcel-Setup.exe release/WebExcel-portable.zip -t "WebExcel 1.0.0" -n "Десктопная версия: сводные таблицы, срезы, группировки строк"
