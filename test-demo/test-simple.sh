#!/bin/bash
# 简化版全流程测试：验证Agent基础功能

BASE_DIR=$(cd $(dirname $0)/.. && pwd)

# 检查Agent是否存在
AGENT_JAR="${BASE_DIR}/packages/lt-agent.jar"
if [ ! -f "${AGENT_JAR}" ]; then
    echo "Error: Agent jar not found at ${AGENT_JAR}"
    exit 1
fi

# 检查插件目录是否存在
PLUGINS_DIR="${BASE_DIR}/lt-agent/plugins"
if [ ! -d "${PLUGINS_DIR}" ]; then
    echo "Error: Plugins dir not found at ${PLUGINS_DIR}"
    exit 1
fi

echo "✅ Bee-APM Agent 检查通过"
echo "Agent路径: ${AGENT_JAR}"
echo "插件数量: $(ls ${PLUGINS_DIR} | wc -l) 个"

# 创建临时配置文件
cat > /tmp/bee-apm-test.properties << EOF
bee.app.name=bee-apm-test-demo
bee.agent.enable=true
bee.reporter.type=console
bee.reporter.console.output=true
bee.plugin.dir=${PLUGINS_DIR}
bee.log.level=DEBUG
EOF

echo "✅ 测试配置文件已生成"

# 启动测试应用，只跑10秒就退出
echo "🚀 启动测试应用，挂载Bee-APM Agent..."
java -Xms256m -Xmx256m \
-javaagent:${AGENT_JAR} \
-Dbee.config.file=/tmp/bee-apm-test.properties \
-jar target/bee-apm-test-demo-1.0.0.jar &
APP_PID=$!

# 等待应用启动
sleep 10

# 发送测试请求
echo "📝 发送测试HTTP请求..."
curl -s http://localhost:8080/test > /dev/null
curl -s http://localhost:8080/slow-test > /dev/null

# 等待3秒让埋点上报
sleep 3

# 关闭应用
echo "🛑 关闭测试应用..."
kill ${APP_PID}
wait ${APP_PID} 2>/dev/null

# 清理临时文件
rm -f /tmp/bee-apm-test.properties

echo "🎉 简化版全流程测试完成！"
echo "如果控制台输出了采集到的Span信息，说明Agent基础功能正常工作~"
