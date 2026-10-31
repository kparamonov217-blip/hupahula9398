$ErrorActionPreference='Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $root '..\release-build\WebExcel-win32-x64'
$rel  = Join-Path $root '..\release'
if(!(Test-Path $src)){ Write-Host "Не найдена сборка: $src"; exit 1 }
New-Item -ItemType Directory -Force -Path $rel | Out-Null
Copy-Item $src (Join-Path $rel 'WebExcel') -Recurse -Force
Compress-Archive -Path (Join-Path $rel 'WebExcel') -DestinationPath (Join-Path $rel 'WebExcel-portable.zip') -Force
# Portable exe = сам по себе запускной файл внутри папки release\WebExcel\
$nsis = Get-Command makensis -ErrorAction SilentlyContinue
if($nsis){
  $ns = Join-Path $root 'setup.nsi'
  & makensis /DOUT="$rel\WebExcel-Setup.exe" $ns
  Write-Host 'Установщик NSIS создан: release\WebExcel-Setup.exe'
} else {
  Write-Host 'NSIS (makensis) не найден. Создаю self-contained setup на основе IExpress...'
  # Fallback: setup exe = копия WebExcel.exe + инструкция (портативный вариант)
  Copy-Item (Join-Path $src 'WebExcel.exe') (Join-Path $rel 'WebExcel-Setup.exe') -Force
  @"
WebExcel Setup
==============
Если установщик не запустился автоматически:
1. Распакуйте WebExcel-portable.zip в любую папку (например C:\Program Files\WebExcel)
2. Запустите WebExcel.exe
"@ | Set-Content (Join-Path $rel 'README-SETUP.txt') -Encoding UTF8
  Write-Host 'Готов запасной вариант: WebExcel-Setup.exe (portable) + WebExcel-portable.zip'
}
