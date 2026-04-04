#!/bin/bash
set -e

echo "Running TDD Test: Config unification"

if grep -q "AsyncHttpClient" /workspace/lt-agent/lt-agent-core/src/main/java/org/xi/lt/agent/diagnostic/agent/Configs.java; then
    echo "FAIL: Configs.java should no longer use AsyncHttpClient to fetch config."
    exit 1
fi

if ! grep -q "ConfigUtils.me().getStr" /workspace/lt-agent/lt-agent-core/src/main/java/org/xi/lt/agent/diagnostic/agent/Configs.java; then
    echo "FAIL: Configs.java should use ConfigUtils.me().getStr to fetch config."
    exit 1
fi

echo "CONFIG UNIFICATION PASS"
