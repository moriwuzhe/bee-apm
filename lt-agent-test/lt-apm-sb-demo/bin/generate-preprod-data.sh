#!/bin/bash

set -euo pipefail

BASE_DIR=$(cd "$(dirname "$0")/../../.." && pwd)
DEMO_DIR="${BASE_DIR}/lt-agent-test/lt-monitor-sb-demo"
AGENT_JAR="${BASE_DIR}/packages/lt-agent.jar"

COLLECTOR_URL="${1:-${COLLECTOR_URL:-http://127.0.0.1:7001/stream}}"
APP="${LT_APP:-lt-preprod-demo}"
ENV_NAME="${LT_ENV:-preprod}"
INST="${LT_INST:-demo01}"
PORT="${SERVER_PORT:-8101}"

LOAD_ENABLE="${LOAD_ENABLE:-true}"
LOAD_QPS="${LOAD_QPS:-5}"
LOAD_THREADS="${LOAD_THREADS:-2}"
LOAD_DURATION_SECONDS="${LOAD_DURATION_SECONDS:-0}"

BISTOURY_PROXY_HOST="${BISTOURY_PROXY_HOST:-127.0.0.1}"
BISTOURY_PROXY_PORT="${BISTOURY_PROXY_PORT:-3333}"

if [ ! -f "${AGENT_JAR}" ]; then
  echo "Agent jar not found: ${AGENT_JAR}"
  exit 1
fi

TMP_CFG="${DEMO_DIR}/target/lt-agent-preprod.yml"
mkdir -p "$(dirname "${TMP_CFG}")"
cat > "${TMP_CFG}" <<EOF
logger:
  console: true
  level: info
reporter:
  name: okhttp
  serverUrl: "${COLLECTOR_URL}"
  queueSize: 2000
  threadNum: 2
  idleSleep: 50
  batchSize: 50
sampling:
  rate: 10000
bistoury:
  proxy:
    host: "${BISTOURY_PROXY_HOST}"
    port: ${BISTOURY_PROXY_PORT}
EOF

cd "${DEMO_DIR}"
mvn -DskipTests package

java -Xms256m -Xmx256m \
  -javaagent:"${AGENT_JAR}" \
  -Dlt.config="${TMP_CFG}" \
  -Dlt.app="${APP}" \
  -Dlt.env="${ENV_NAME}" \
  -Dlt.inst="${INST}" \
  -Dlt.port="${PORT}" \
  -Dlt.ip=127.0.0.1 \
  -Dserver.ip=127.0.0.1 \
  -Dserver.port="${PORT}" \
  -Dremote.ports="${PORT}" \
  -Dmax.counter=0 \
  -Dlt.demo.load.enable="${LOAD_ENABLE}" \
  -Dlt.demo.load.qps="${LOAD_QPS}" \
  -Dlt.demo.load.threads="${LOAD_THREADS}" \
  -Dlt.demo.load.durationSeconds="${LOAD_DURATION_SECONDS}" \
  -jar target/lt-monitor-sb-demo.jar

