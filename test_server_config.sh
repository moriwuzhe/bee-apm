#!/bin/bash
set -e

echo "Running TDD Test: Server Config Unification"

if grep -q "ServiceLoader.load" /workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic/serverside/configuration/DynamicConfigLoader.java; then
    echo "FAIL: DynamicConfigLoader still uses ServiceLoader"
    exit 1
fi

if ! grep -q "ConfigHolder.getProperty" /workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic/serverside/configuration/DynamicConfigLoader.java; then
    echo "FAIL: DynamicConfigLoader should delegate to ConfigHolder"
    exit 1
fi

if ! grep -q "zk:" /workspace/lt-server-apm/server-web/src/main/resources/application.yml; then
    echo "FAIL: zk config is missing in application.yml"
    exit 1
fi

echo "SERVER CONFIG UNIFICATION PASS"
