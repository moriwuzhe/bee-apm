#!/bin/bash
echo "Starting LT Monitor Build..."

# 1. Build Frontend
echo "--> Building Modern UI..."
cd /workspace/lt-ui/lt-apm-ui-web
npm install
npm run build

# 2. Copy UI to Server resources
echo "--> Copying UI to Server..."
rm -rf /workspace/lt-server-apm/server-web/src/main/resources/static/*
mkdir -p /workspace/lt-server-apm/server-web/src/main/resources/static
cp -r dist/* /workspace/lt-server-apm/server-web/src/main/resources/static/

# 3. Build Backend
echo "--> Building Backend & Agent (Maven)..."
cd /workspace
export MAVEN_OPTS="-Djava.net.preferIPv4Stack=true"
mvn clean package -DskipTests

echo "--> Build Completed!"
