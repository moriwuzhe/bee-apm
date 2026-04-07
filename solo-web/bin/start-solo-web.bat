@echo off
setlocal enabledelayedexpansion

set BASE_DIR=%~dp0..
set SERVER_JAR=%BASE_DIR%\server\lt-monitor-server.jar

if not exist "%SERVER_JAR%" (
  echo [ERROR] server jar not found: %SERVER_JAR%
  exit /b 1
)

set JAVA_OPTS=-Xms256m -Xmx1024m
set APP_OPTS=--server.port=8081 --spring.web.resources.static-locations=file:%BASE_DIR%\ui\ --spring.web.resources.cache.cachecontrol.no-store=true --spring.web.resources.cache.cachecontrol.max-age=0 --seed.enabled=true

echo [INFO] BASE_DIR=%BASE_DIR%
echo [INFO] SERVER_JAR=%SERVER_JAR%
echo [INFO] JAVA_OPTS=%JAVA_OPTS%
echo [INFO] APP_OPTS=%APP_OPTS%

java %JAVA_OPTS% -jar "%SERVER_JAR%" %APP_OPTS%

