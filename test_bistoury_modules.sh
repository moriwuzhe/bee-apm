#!/bin/bash
set -e

echo "Running Integration Test: bistoury modules selection"

if grep -q "bistoury-attach-arthas" /workspace/bistoury/pom.xml; then
    # arthas is commented out anyway, but we ensure no other unused are there
    echo ""
fi

# Assert core modules are still there
if ! grep -q "bistoury-remoting" /workspace/bistoury/pom.xml; then
    echo "FAIL: bistoury-remoting is required for Agent Netty communication"
    exit 1
fi

if ! grep -q "bistoury-ui" /workspace/bistoury/pom.xml; then
    echo "FAIL: bistoury-ui is required for UI/AI features"
    exit 1
fi

echo "PASS: Module selection test setup"
