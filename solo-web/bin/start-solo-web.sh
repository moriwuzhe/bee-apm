set -e

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_JAR="$BASE_DIR/server/lt-monitor-server.jar"

if [ ! -f "$SERVER_JAR" ]; then
  echo "[ERROR] server jar not found: $SERVER_JAR"
  exit 1
fi

JAVA_OPTS="-Xms256m -Xmx1024m"
APP_OPTS="--server.port=8081 --spring.web.resources.static-locations=file:$BASE_DIR/ui/ --spring.web.resources.cache.cachecontrol.no-store=true --spring.web.resources.cache.cachecontrol.max-age=0 --seed.enabled=true"

echo "[INFO] BASE_DIR=$BASE_DIR"
echo "[INFO] SERVER_JAR=$SERVER_JAR"

exec java $JAVA_OPTS -jar "$SERVER_JAR" $APP_OPTS
