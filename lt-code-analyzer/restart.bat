@echo off

rem 查找并终止占用 8083 端口的进程
echo 正在查找占用 8083 端口的进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8083') do (
    echo 终止进程: %%a
    taskkill /PID %%a /F > nul 2>&1
)

rem 进入项目目录
echo 进入项目目录...
cd /d "%~dp0"

@REM rem 清理并重新构建
@REM echo 清理项目...
@REM @REM mvn clean > nul 2>&1

@REM echo 重新构建项目...
@REM @REM mvn compile > nul 2>&1
@REM mvn compile

rem 启动项目
echo 启动项目...
mvn spring-boot:run