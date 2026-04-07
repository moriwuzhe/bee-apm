#!/bin/bash

# LT Monitor Agent Auto Installer
# Usage: curl -sSL http://<server-ip>:8080/api/agent/install.sh | bash -s -- <AppName> [ServerUrl]

APP_NAME=$1
SERVER_URL=${2:-"http://127.0.0.1:8080"}

if [ -z "$APP_NAME" ]; then
    echo "Error: AppName is required."
    echo "Usage: curl -sSL http://<server-ip>:8080/api/agent/install.sh | bash -s -- <AppName> [ServerUrl]"
    exit 1
fi

INSTALL_DIR="/opt/lt-monitor/agent"
TMP_DIR="/tmp/lt-agent-download"

echo "====================================================="
echo " Installing LT Monitor Agent for: $APP_NAME"
echo " APM Server URL: $SERVER_URL"
echo "====================================================="

# 1. Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$TMP_DIR"

# 2. Download the agent zip
echo "-> Downloading agent package from $SERVER_URL/api/agent/download ..."
curl -sSL "$SERVER_URL/api/agent/download" -o "$TMP_DIR/lt-agent.zip"

if [ $? -ne 0 ]; then
    echo "Error: Failed to download agent package."
    exit 1
fi

# 3. Unzip
echo "-> Extracting package..."
if ! command -v unzip &> /dev/null; then
    echo "Error: unzip is not installed. Please install unzip first."
    exit 1
fi

unzip -o "$TMP_DIR/lt-agent.zip" -d "$INSTALL_DIR" > /dev/null

# 4. Generate local config template
echo "-> Generating local config.yml..."
cat << EOF > "$INSTALL_DIR/config.yml"
app: $APP_NAME
control.server.url: $SERVER_URL
# The rest of configs will be pulled from Server automatically via heartbeat.
EOF

# 5. Clean up
rm -rf "$TMP_DIR"

echo "====================================================="
echo " Installation Completed Successfully!"
echo " "
echo " Please add the following JVM arguments to your Java application startup script:"
echo " "
echo " -javaagent:$INSTALL_DIR/lt-agent.jar -DltConfig=$INSTALL_DIR"
echo " "
echo " Example:"
echo " java -javaagent:$INSTALL_DIR/lt-agent.jar -DltConfig=$INSTALL_DIR -jar your-app.jar"
echo "====================================================="