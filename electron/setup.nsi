; WebExcel installer (NSIS)
Unicode true
!define APPNAME "WebExcel"
!define VERSION "1.0.0"
Name "${APPNAME} ${VERSION}"
OutFile "${OUT}\${APPNAME}-Setup.exe"
InstallDir "$PROGRAMFILES64\${APPNAME}"
RequestExecutionLevel admin
Page directory
Page instfiles
Section "Install"
  SetOutPath "$INSTDIR"
  File /r "..\release-build\${APPNAME}-win32-x64\*.*"
  CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${APPNAME}.exe"
  CreateShortCut "$SMPROGRAMS\${APPNAME}.lnk" "$INSTDIR\${APPNAME}.exe"
  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd
Section "Uninstall"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\${APPNAME}.lnk"
  Delete "$SMPROGRAMS\${APPNAME}.lnk"
SectionEnd
