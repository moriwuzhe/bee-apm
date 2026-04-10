#!/bin/bash
# Start Provider (Port 8082)
echo "Starting Provider (Port 8082)..."
/root/.local/share/mise/installs/java/temurin-8/bin/java -Xms128m -Xmx128m \
  -javaagent:/workspace/packages/lt-agent.jar \
  -Dnet.bytebuddy.experimental=true \
  -Dorg.xi.lt.agent.dependencies.net.bytebuddy.experimental=true \
  -Dlt.app.name=demo-provider \
  -Dlt.agent.enable=true \
  -Dlt.reporter.type=okhttp \
  -Dlt.agent.report.url=http://127.0.0.1:7001/stream \
  -Dlt.reporter.console.output=true \
  -Dlt.plugin.dir=/workspace/packages/plugins/ \
  -Dlt.log.level=INFO \
  -jar /workspace/test-demo/target/lt-monitor-test-demo-1.0.0.jar \
  --server.port=8082 > /workspace/test-demo/provider.log 2>&1 &

# Start Consumer (Port 8080)
echo "Starting Consumer (Port 8080)..."
/root/.local/share/mise/installs/java/temurin-8/bin/java -Xms128m -Xmx128m \
  -javaagent:/workspace/packages/lt-agent.jar \
  -Dnet.bytebuddy.experimental=true \
  -Dorg.xi.lt.agent.dependencies.net.bytebuddy.experimental=true \
  -Dlt.app.name=demo-consumer \
  -Dlt.agent.enable=true \
  -Dlt.reporter.type=okhttp \
  -Dlt.agent.report.url=http://127.0.0.1:7001/stream \
  -Dlt.reporter.console.output=true \
  -Dlt.plugin.dir=/workspace/packages/plugins/ \
  -Dlt.log.level=INFO \
  -jar /workspace/test-demo/target/lt-monitor-test-demo-1.0.0.jar \
  --server.port=8080 > /workspace/test-demo/consumer.log 2>&1 &
