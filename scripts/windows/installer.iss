#define MyAppName "Fuel App"
#define MyAppVersion "1.0"
#define MyAppPublisher "Your Company"
#define MyAppURL "https://yourwebsite.com"
#define MyAppExeName "FuelApp.exe"

[Setup]
AppId={{YOUR-GUID-HERE}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=..\..\LICENSE
OutputDir=..\..\release
OutputBaseFilename=FuelApp_Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
Source: "..\..\release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\scripts\windows\start.bat"; DestDir: "{app}\scripts\windows"; Flags: ignoreversion
Source: "..\..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\package-lock.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\src\*"; DestDir: "{app}\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\docs\*"; DestDir: "{app}\docs"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
var
  NodePage: TInputOptionWizardPage;
  DotNetPage: TInputOptionWizardPage;

procedure InitializeWizard;
begin
  NodePage := CreateInputOptionPage(wpWelcome,
    'Node.js', 'Node.js не установлен',
    'Node.js требуется для работы приложения. Что вы хотите сделать?',
    True, False);
  NodePage.Add('Установить Node.js автоматически');
  NodePage.Add('Установить Node.js вручную');
  NodePage.Add('Продолжить без установки (не рекомендуется)');
  NodePage.Values[0] := True;

  DotNetPage := CreateInputOptionPage(wpWelcome,
    '.NET Runtime', '.NET Runtime не установлен',
    '.NET Runtime требуется для работы приложения. Что вы хотите сделать?',
    True, False);
  DotNetPage.Add('Установить .NET Runtime автоматически');
  DotNetPage.Add('Установить .NET Runtime вручную');
  DotNetPage.Add('Продолжить без установки (не рекомендуется)');
  DotNetPage.Values[0] := True;
end;

function IsNodeJSInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/c node --version > nul 2>&1', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function IsDotNetInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/c dotnet --version > nul 2>&1', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  
  if CurPageID = NodePage.ID then
  begin
    if not IsNodeJSInstalled then
    begin
      if NodePage.Values[0] then
      begin
        // Скачать и установить Node.js автоматически
        DownloadTemporaryFile('https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi', 'nodejs.msi');
        Exec('msiexec.exe', '/i "' + ExpandConstant('{tmp}\nodejs.msi') + '" /quiet', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      end
      else if NodePage.Values[1] then
      begin
        // Открыть страницу загрузки Node.js
        ShellExec('open', 'https://nodejs.org/', '', '', SW_SHOW, ewNoWait, ResultCode);
      end;
    end;
  end
  else if CurPageID = DotNetPage.ID then
  begin
    if not IsDotNetInstalled then
    begin
      if DotNetPage.Values[0] then
      begin
        // Скачать и установить .NET Runtime автоматически
        DownloadTemporaryFile('https://download.visualstudio.microsoft.com/download/pr/022d9abf-35f0-4fd5-8d1c-86056df76e89/477f1ebb70f314054129a9f51e9ec8ec/dotnet-runtime-6.0.21-win-x64.exe', 'dotnet.exe');
        Exec(ExpandConstant('{tmp}\dotnet.exe'), '/install /quiet /norestart', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      end
      else if DotNetPage.Values[1] then
      begin
        // Открыть страницу загрузки .NET Runtime
        ShellExec('open', 'https://dotnet.microsoft.com/download/dotnet/6.0', '', '', SW_SHOW, ewNoWait, ResultCode);
      end;
    end;
  end;
end; 