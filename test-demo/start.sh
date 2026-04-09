#!/bin/bash
# Lt-APM 全流程测试启动脚本

# 项目根目录
BASE_DIR=$(cd $(dirname $0)/.. && pwd)

# Agent路径
AGENT_PATH="${BASE_DIR}/packages/lt-agent.jar"

# 插件目录
PLUGINS_PATH="${BASE_DIR}/plugins/"

# Java启动参数
JAVA_OPTS="-Xms512m -Xmx512m"

# APM配置
APM_OPTS="
-javaagent:${AGENT_PATH}
-Dlt.app.name=lt-monitor-test-demo
-Dlt.agent.enable=true
-Dlt.reporter.type=grpc
-Dlt.agent.report.url=127.0.0.1:9998
-Dlt.reporter.console.output=true
-Dlt.plugin.dir=${PLUGINS_PATH}
-Dlt.log.level=INFO
"

# 编译测试项目
echo "编译测试项目..."
mvn clean package -DskipTests

# 启动测试应用
echo "启动测试应用，挂载Lt-APM Agent..."
APP_OPTS="--server.port=8082"
java ${JAVA_OPTS} ${APM_OPTS} -jar target/lt-monitor-test-demo-1.0.0.jar ${APP_OPTS}
