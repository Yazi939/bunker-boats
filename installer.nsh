!include LogicLib.nsh

!macro customInstall
  # Добавляем плагин inetc
  !addplugindir /x86-unicode "nsis-plugins\Plugins\x86-unicode"
  
  # Проверяем, установлен ли Node.js
  DetailPrint "Проверка установки Node.js..."
  ReadRegStr $0 HKLM "SOFTWARE\Node.js" "InstallPath"
  
  ${If} $0 == ""
    # Node.js не установлен
    MessageBox MB_YESNO|MB_ICONQUESTION "Приложение требует Node.js для работы. Установить Node.js автоматически?" IDYES install_node IDNO skip_install
    
    install_node:
      # Скачиваем установщик Node.js
      DetailPrint "Скачивание Node.js..."
      inetc::get "https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi" "$TEMP\node-install.msi" /END
      Pop $0
      ${If} $0 != "OK"
        MessageBox MB_OK|MB_ICONEXCLAMATION "Не удалось скачать Node.js. Пожалуйста, установите его вручную с сайта https://nodejs.org/"
      ${Else}
        # Устанавливаем Node.js
        DetailPrint "Установка Node.js..."
        ExecWait 'msiexec /i "$TEMP\node-install.msi" /qn' $1
        ${If} $1 != 0
          MessageBox MB_OK|MB_ICONEXCLAMATION "Node.js не был установлен. Пожалуйста, установите его вручную с сайта https://nodejs.org/"
        ${Else}
          DetailPrint "Node.js успешно установлен"
        ${EndIf}
        # Удаляем установщик Node.js
        Delete "$TEMP\node-install.msi"
      ${EndIf}
    
    skip_install:
  ${Else}
    DetailPrint "Node.js уже установлен"
  ${EndIf}
!macroend 