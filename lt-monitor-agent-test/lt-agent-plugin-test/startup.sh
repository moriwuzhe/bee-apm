#!/bin/bash

# LT Agent 插件测试启动脚本
# @author LT Monitor Dev
# @date 2026/05/07

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="lt-agent-plugin-test"
JAR_FILE="target/lt-agent-plugin-test.jar"
AGENT_PATH="../../packages/lt-agent-bootstrap.jar"
APP_PORT=8088

# 打印信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Java环境
check_java() {
    if ! command -v java &> /dev/null; then
        print_error "Java未安装,请先安装JDK 1.8或更高版本"
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | awk -F '.' '{print $1}')
    if [ "$JAVA_VERSION" -lt 8 ]; then
        print_error "需要JDK 1.8或更高版本,当前版本: $JAVA_VERSION"
        exit 1
    fi
    
    print_info "Java版本检查通过: $(java -version 2>&1 | head -n 1)"
}

# 检查Maven环境
check_maven() {
    if ! command -v mvn &> /dev/null; then
        print_error "Maven未安装,请先安装Maven"
        exit 1
    fi
    
    print_info "Maven版本: $(mvn -version | head -n 1)"
}

# 编译项目
build_project() {
    print_info "开始编译项目..."
    cd "$(dirname "$0")"
    
    mvn clean package -DskipTests
    if [ $? -ne 0 ]; then
        print_error "项目编译失败"
        exit 1
    fi
    
    print_info "项目编译成功"
}

# 检查Agent文件
check_agent() {
    if [ ! -f "$AGENT_PATH" ]; then
        print_warn "Agent文件不存在: $AGENT_PATH"
        print_warn "将不使用Agent启动,仅测试应用功能"
        return 1
    fi
    
    print_info "Agent文件找到: $AGENT_PATH"
    return 0
}

# 启动应用(带Agent)
start_with_agent() {
    print_info "使用Agent启动应用..."
    
    java -javaagent:"$AGENT_PATH" \
         -Dlt.agent.application.name="$APP_NAME" \
         -Dlt.agent.collector.server=http://localhost:8080 \
         -Xms512m \
         -Xmx512m \
         -jar "$JAR_FILE" &
    
    APP_PID=$!
    print_info "应用已启动, PID: $APP_PID"
    print_info "访问地址: http://localhost:$APP_PORT"
    print_info "H2控制台: http://localhost:$APP_PORT/h2-console"
    
    echo $APP_PID > app.pid
}

# 启动应用(不带Agent)
start_without_agent() {
    print_info "不使用Agent启动应用..."
    
    java -Xms512m \
         -Xmx512m \
         -jar "$JAR_FILE" &
    
    APP_PID=$!
    print_info "应用已启动, PID: $APP_PID"
    print_info "访问地址: http://localhost:$APP_PORT"
    print_info "H2控制台: http://localhost:$APP_PORT/h2-console"
    
    echo $APP_PID > app.pid
}

# 停止应用
stop_app() {
    if [ -f "app.pid" ]; then
        APP_PID=$(cat app.pid)
        if ps -p $APP_PID > /dev/null; then
            print_info "停止应用, PID: $APP_PID"
            kill $APP_PID
            rm -f app.pid
            print_info "应用已停止"
        else
            print_warn "应用进程不存在: $APP_PID"
            rm -f app.pid
        fi
    else
        print_warn "未找到应用PID文件"
    fi
}

# 运行测试
run_tests() {
    print_info "等待应用启动..."
    sleep 5
    
    print_info "运行插件测试..."
    
    # 测试所有插件
    curl -X POST http://localhost:$APP_PORT/api/plugin-test/test-all \
         -H "Content-Type: application/json" \
         | jq .
    
    echo ""
    print_info "测试完成,查看日志获取更多详情"
}

# 显示帮助
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  build      编译项目"
    echo "  start      启动应用(带Agent)"
    echo "  start-no   启动应用(不带Agent)"
    echo "  stop       停止应用"
    echo "  test       运行测试"
    echo "  restart    重启应用"
    echo "  help       显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 build           # 编译项目"
    echo "  $0 start           # 启动应用"
    echo "  $0 test            # 运行测试"
    echo "  $0 restart         # 重启应用"
}

# 主函数
main() {
    case "$1" in
        build)
            check_java
            check_maven
            build_project
            ;;
        start)
            check_java
            if [ ! -f "$JAR_FILE" ]; then
                print_warn "JAR文件不存在,先编译项目..."
                build_project
            fi
            
            if check_agent; then
                start_with_agent
            else
                start_without_agent
            fi
            ;;
        start-no)
            check_java
            if [ ! -f "$JAR_FILE" ]; then
                print_warn "JAR文件不存在,先编译项目..."
                build_project
            fi
            start_without_agent
            ;;
        stop)
            stop_app
            ;;
        test)
            run_tests
            ;;
        restart)
            stop_app
            sleep 2
            $0 start
            ;;
        help|"")
            show_help
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
