#!/bin/bash
set -e

echo "Running Integration Test: Native code integration"

if [ -d "/workspace/bistoury" ]; then
    echo "FAIL: bistoury directory should be completely removed."
    exit 1
fi

if grep -q "<module>bistoury</module>" /workspace/pom.xml; then
    echo "FAIL: bistoury module should be removed from root pom.xml."
    exit 1
fi

if ! ls /workspace/lt-agent/lt-agent-core/src/main/java/org/xi/lt/agent/diagnostic >/dev/null 2>&1; then
    echo "FAIL: Diagnostic code not found in lt-agent-core."
    exit 1
fi

if ! ls /workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic >/dev/null 2>&1; then
    echo "FAIL: Diagnostic code not found in server-web."
    exit 1
fi

echo "NATIVE INTEGRATION PASS"
