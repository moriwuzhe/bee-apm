@echo off
set AGENT_PATH=d:\git_repository\bee-apm\lt-agent\agent\lt-agent.jar
set APP_JAR=d:\git_repository\bee-apm\lt-monitor-agent-test\lt-apm-sb-demo\target\lt-monitor-sb-demo.jar
set LT_APP=lt-apm-sb-demo
set LT_ENV=dev
set LT_INST=demo01
set LT_PORT=8101
set SERVER_PORT=8101
set LT_SERVER=http://localhost:8081/apm/report

echo Starting demo application with LT Agent...
echo Agent: %AGENT_PATH%
echo App: %LT_APP%
echo Server: %LT_SERVER%

java -Xmx128m -javaagent:%AGENT_PATH% ^
  -Dlt.app=%LT_APP% ^
  -Dlt.env=%LT_ENV% ^
  -Dlt.inst=%LT_INST% ^
  -Dlt.port=%LT_PORT% ^
  -Dserver.port=%SERVER_PORT% ^
  -jar %APP_JAR%