@echo off
echo Setting up React Native Environment Variables...

REM Set JAVA_HOME (using Android Studio's bundled JRE)
setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr" /M

REM Set ANDROID_HOME
setx ANDROID_HOME "%USERPROFILE%\AppData\Local\Android\Sdk" /M

REM Add Android tools to PATH
setx PATH "%PATH%;%ANDROID_HOME%\emulator;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin" /M

echo Environment variables set successfully!
echo Please restart your command prompt/PowerShell for changes to take effect.
pause

