#!/bin/bash
set -e

echo "Running TDD Test: Diagnostic Agent Client Integration"

if ! grep -q "AgentClient.getInstance().start()" /workspace/lt-agent/lt-agent-bootstrap/src/main/java/org/xi/lt/agent/boot/LtAgent.java; then
    echo "FAIL: AgentClient.getInstance().start() not found in LtAgent.java"
    exit 1
fi

echo "INTEGRATION LOGIC PASS"
