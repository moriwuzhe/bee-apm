#!/bin/bash
set -euo pipefail

# Use system Java 11 by default, can be overridden by environment variable
if [ -z "${JAVA_HOME:-}" ]; then
    JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"
fi
JAVA_OPTS="-Dbistoury.conf=$BISTOURY_COF_DIR"
