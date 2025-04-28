!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"

; Настройки приложения
!define APP_NAME "Fuel App"
!define APP_VERSION "1.0"
!define APP_PUBLISHER "Your Company"
!define APP_URL "https://yourwebsite.com"
!define APP_EXE "FuelApp.exe"

; Настройки установщика
Name "${APP_NAME}"
OutFile "..\..\release\FuelApp_Setup.exe"
InstallDir "$PROGRAMFILES\${APP_NAME}"
RequestExecutionLevel admin

; Интерфейс
!define MUI_ABORTWARNING
!define MUI_ICON "..\..\public\favicon.ico"
!define MUI_UNICON "..\..\public\favicon.ico"

; Страницы установщика
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Страницы деинсталлятора
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Языки
!insertmacro MUI_LANGUAGE "Russian"

; Функция проверки Node.js
Function CheckNodeJS
  ClearErrors
  ExecWait 'node --version'
  ${If} ${Errors}
    MessageBox MB_YESNO|MB_ICONQUESTION "Node.js не установлен. Установить его сейчас?" IDYES install_node IDNO skip_node
    install_node:
      NSISdl::download "https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi" "$TEMP\nodejs.msi"
      Pop $R0
      ${If} $R0 == "success"
        ExecWait 'msiexec /i "$TEMP\nodejs.msi" /quiet'
        Delete "$TEMP\nodejs.msi"
      ${Else}
        MessageBox MB_OK|MB_ICONSTOP "Не удалось скачать Node.js. Пожалуйста, установите его вручную."
      ${EndIf}
    skip_node:
  ${EndIf}
FunctionEnd

; Функция установки зависимостей
Function InstallDependencies
  SetOutPath "$INSTDIR"
  ExecWait 'npm install'
FunctionEnd

; Функция запуска приложения
Function StartApp
  Exec "$INSTDIR\${APP_EXE}"
FunctionEnd

Section "Install"
  SetOutPath "$INSTDIR"
  
  ; Копируем файлы
  File /r "..\..\release\${APP_EXE}"
  File /r "..\..\scripts\windows\start.bat"
  File /r "..\..\package.json"
  File /r "..\..\package-lock.json"
  File /r "..\..\src\*.*"
  File /r "..\..\public\*.*"
  File /r "..\..\docs\*.*"
  
  ; Создаем ярлыки
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
  CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
  
  ; Записываем информацию для удаления
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "URLInfoAbout" "${APP_URL}"
  
  ; Проверяем и устанавливаем Node.js
  Call CheckNodeJS
  
  ; Устанавливаем зависимости
  Call InstallDependencies
  
  ; Запускаем приложение
  Call StartApp
SectionEnd

Section "Uninstall"
  ; Удаляем файлы
  RMDir /r "$INSTDIR"
  
  ; Удаляем ярлыки
  Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  
  ; Удаляем информацию из реестра
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd 