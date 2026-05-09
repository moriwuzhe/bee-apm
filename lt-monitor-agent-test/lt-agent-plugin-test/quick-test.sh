#!/bin/bash

# 快速测试所有插件的脚本
# @author LT Monitor Dev
# @date 2026/05/07

echo "=========================================="
echo "  LT Agent 插件快速测试"
echo "=========================================="
echo ""

APP_URL="http://localhost:8088"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查应用是否运行
check_app() {
    if ! curl -s "$APP_URL/api/plugin-test/test-all" > /dev/null 2>&1; then
        echo -e "${RED}[ERROR]${NC} 应用未运行,请先启动应用"
        echo ""
        echo "启动命令:"
        echo "  ./startup.sh start"
        echo ""
        exit 1
    fi
}

# 测试单个插件
test_plugin() {
    local name=$1
    local endpoint=$2
    
    echo -n "测试 $name ... "
    
    response=$(curl -s -X POST "$APP_URL$endpoint" \
         -H "Content-Type: application/json")
    
    success=$(echo $response | grep -o '"success":[^,}]*' | cut -d':' -f2)
    
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✓ 成功${NC}"
    else
        echo -e "${RED}✗ 失败${NC}"
        echo "  响应: $response"
    fi
}

# 开始测试
check_app

echo "开始测试各个插件..."
echo ""

# 基础插件
echo -e "${YELLOW}[基础插件]${NC}"
test_plugin "JDBC" "/api/plugin-test/test-jdbc"
test_plugin "Logger" "/api/plugin-test/test-logger"
test_plugin "HTTP客户端" "/api/plugin-test/test-http"
test_plugin "消息队列" "/api/plugin-test/test-mq"
echo ""

# 高级插件
echo -e "${YELLOW}[高级插件]${NC}"
test_plugin "MongoDB" "/api/plugin-test/test-mongodb"
test_plugin "Elasticsearch" "/api/plugin-test/test-es"
test_plugin "Dubbo" "/api/plugin-test/test-dubbo"
test_plugin "Feign" "/api/plugin-test/test-feign"
test_plugin "配置中心" "/api/plugin-test/test-config"
test_plugin "熔断限流" "/api/plugin-test/test-resilience"
echo ""

# 综合测试
echo -e "${YELLOW}[综合测试]${NC}"
test_plugin "所有插件" "/api/plugin-test/test-all"
echo ""

echo "=========================================="
echo "测试完成!"
echo "=========================================="
echo ""
echo "查看详细日志:"
echo "  tail -f logs/lt-agent-plugin-test.log"
echo ""
echo "查看Agent日志:"
echo "  tail -f ../../packages/logs/lt-agent.log"
echo ""
