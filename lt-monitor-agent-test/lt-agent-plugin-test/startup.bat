@echo off
REM LT Agent 插件测试启动脚本 (Windows)
REM @author LT Monitor Dev
REM @date 2026/05/07

setlocal enabledelayedexpansion

REM 配置变量
set APP_NAME=lt-agent-plugin-test
set JAR_FILE=target\lt-agent-plugin-test.jar
set AGENT_PATH=..\..\packages\lt-agent-bootstrap.jar
set APP_PORT=8088

REM 显示菜单
:menu
echo.
echo ========================================
echo   LT Agent 插件测试工具
echo ========================================
echo.
echo 1. 编译项目
echo 2. 启动应用(带Agent)
echo 3. 启动应用(不带Agent)
echo 4. 停止应用
echo 5. 运行测试
echo 6. 重启应用
echo 7. 退出
echo.
set /p choice=请选择操作 (1-7): 

if "%choice%"=="1" goto build
if "%choice%"=="2" goto start
if "%choice%"=="3" goto start_no_agent
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto test
if "%choice%"=="6" goto restart
if "%choice%"=="7" goto end
goto menu

REM 编译项目
:build
echo.
echo [INFO] 开始编译项目...
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] 项目编译失败
    pause
    exit /b 1
)
echo [INFO] 项目编译成功
pause
goto menu

REM 启动应用(带Agent)
:start
echo.
if not exist "%JAR_FILE%" (
    echo [WARN] JAR文件不存在,先编译项目...
    call :build
)

if exist "%AGENT_PATH%" (
    echo [INFO] 使用Agent启动应用...
    start "LT Agent Plugin Test" java -javaagent:"%AGENT_PATH%" ^
         -Dlt.agent.application.name="%APP_NAME%" ^
         -Dlt.agent.collector.server=http://localhost:8080 ^
         -Xms512m ^
         -Xmx512m ^
         -jar "%JAR_FILE%"
    echo [INFO] 应用已启动
    echo [INFO] 访问地址: http://localhost:%APP_PORT%
    echo [INFO] H2控制台: http://localhost:%APP_PORT%/h2-console
) else (
    echo [WARN] Agent文件不存在: %AGENT_PATH%
    echo [WARN] 将不使用Agent启动
    goto start_no_agent_impl
)
pause
goto menu

REM 启动应用(不带Agent)
:start_no_agent
echo.
if not exist "%JAR_FILE%" (
    echo [WARN] JAR文件不存在,先编译项目...
    call :build
)

:start_no_agent_impl
echo [INFO] 不使用Agent启动应用...
start "LT Agent Plugin Test" java -Xms512m -Xmx512m -jar "%JAR_FILE%"
echo [INFO] 应用已启动
echo [INFO] 访问地址: http://localhost:%APP_PORT%
echo [INFO] H2控制台: http://localhost:%APP_PORT%/h2-console
pause
goto menu

REM 停止应用
:stop
echo.
echo [INFO] 停止应用...
taskkill /FI "WINDOWTITLE eq LT Agent Plugin Test" /T /F >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 应用已停止
) else (
    echo [WARN] 未找到运行中的应用
)
pause
goto menu

REM 运行测试
:test
echo.
echo [INFO] 等待应用启动...
timeout /t 5 /nobreak >nul

echo [INFO] 运行插件测试...
curl -X POST http://localhost:%APP_PORT%/api/plugin-test/test-all ^
     -H "Content-Type: application/json"

echo.
echo [INFO] 测试完成,查看日志获取更多详情
pause
goto menu

REM 重启应用
:restart
echo.
echo [INFO] 重启应用...
call :stop
timeout /t 2 /nobreak >nul
call :start
goto menu

:end
echo.
echo 感谢使用!
exit /b 0
