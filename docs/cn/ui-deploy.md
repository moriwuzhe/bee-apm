## 开发调试
### 1、启动lt-monitor-ui-server
   - 执行net.beeapm.ui.WebServerApplication::main
### 2、启动lt-monitor-ui-web
   - 执行命令：npm run dev
   - 访问http://localhost:8080

## 部署
 - cd lt-monitor-ui/lt-monitor-ui-server
 - mvn package
 - 复制lt-monitor/lt-monitor-ui/lt-monitor-ui-server/target/lt-monitor-ui.war进行部署
