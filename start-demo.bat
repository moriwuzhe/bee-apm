@echo off
echo Starting LT Agent Demo Application...

set AGENT_JAR=d:\git_repository\bee-apm\lt-agent\agent\lt-agent.jar
set APP_JAR=d:\git_repository\bee-apm\lt-monitor-agent-test\lt-apm-sb-demo\target\lt-monitor-sb-demo.jar

echo Using agent: %AGENT_JAR%
echo Using app: %APP_JAR%

java -Xmx128m ^
    -javaagent:%AGENT_JAR% ^
    -Dlt.app=lt-apm-sb-demo ^
    -Dlt.env=dev ^
    -Dlt.inst=demo01 ^
    -Dserver.port=8101 ^
    -jar %APP_JAR%
