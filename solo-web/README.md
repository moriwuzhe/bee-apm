# solo-web

## 目录结构
- server/lt-monitor-server.jar
- ui/（bee-apm-ui-web 的构建产物 dist 内容）
- packages/（lt-agent.jar、lt-agent-spy.jar、config.yml 等）
- bin/start-solo-web.(ps1|bat|sh)

## 启动
- Windows（PowerShell）：`.\bin\start-solo-web.ps1`
- Windows（cmd）：`.\bin\start-solo-web.bat`
- Linux/Mac：`sh ./bin/start-solo-web.sh`

默认端口：8081
访问：`http://localhost:8081/`

