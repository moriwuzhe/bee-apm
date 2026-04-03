#!/bin/bash
# Bee-APM 全流程测试启动脚本

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
-Dbee.app.name=bee-apm-test-demo
-Dbee.agent.enable=true
-Dbee.reporter.type=console
-Dbee.reporter.console.output=true
-Dbee.plugin.dir=${PLUGINS_PATH}
-Dbee.log.level=INFO
"

# 编译测试项目
echo "编译测试项目..."
mvn clean package -DskipTests

# 启动测试应用
echo "启动测试应用，挂载Bee-APM Agent..."
java ${JAVA_OPTS} ${APM_OPTS} -jar target/bee-apm-test-demo-1.0.0.jar
