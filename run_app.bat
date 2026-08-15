@echo off
title InstantConnect Application Launcher
echo ===================================================
echo     Starting InstantConnect Spring Boot Application
echo ===================================================
echo.

set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"

set "PROJECT_DIR=C:\Users\manik\OneDrive\Desktop\InstantConnect"
cd /d "%PROJECT_DIR%"

if exist "%PROJECT_DIR%\backend\target\demo-0.0.1-SNAPSHOT.jar" (
    echo Launching Spring Boot server from compiled JAR...
    start "InstantConnect-Server" "%JAVA_HOME%\bin\java.exe" -jar "%PROJECT_DIR%\backend\target\demo-0.0.1-SNAPSHOT.jar"
) else (
    echo Launching Spring Boot server via Maven...
    cd /d "%PROJECT_DIR%\backend"
    start "InstantConnect-Server" .\mvnw.cmd spring-boot:run
)


echo Waiting for InstantConnect backend to initialize...
timeout /t 4 /nobreak >nul

echo Opening InstantConnect in your default browser...
start http://localhost:8080

echo.
echo Application started successfully! Access it at http://localhost:8080
exit
