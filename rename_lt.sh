#!/bin/bash

find /workspace -type f -not -path "*/.git/*" -not -path "*/node_modules/*" -not -path "*/target/*" -not -path "*/build/*" -not -path "*/dist/*" -not -name "*.jar" -not -name "*.png" -not -name "*.jpg" -not -name "*.ico" -not -name "*.ttf" -not -name "*.woff" -not -name "*.eot" -not -name "*.svg" -not -name "pnpm-lock.yaml" -not -name "package-lock.json" | while read -r file; do
    sed -i 's/net\.ltmonitor/org\.xi\.lt/g' "$file"
    sed -i 's/ltmonitor/ltmonitor/g' "$file"
    sed -i 's/LtMonitor/LtMonitor/g' "$file"
    sed -i 's/LtMonitor/LtMonitor/g' "$file"
    sed -i 's/lt-monitor/lt-monitor/g' "$file"
    sed -i 's/LtConfig/LtConfig/g' "$file"
    sed -i 's/LtThread/LtThread/g' "$file"
    sed -i 's/LtConst/LtConst/g' "$file"
    sed -i 's/LtUtils/LtUtils/g' "$file"
    sed -i 's/LtTrace/LtTrace/g' "$file"
    sed -i 's/lt-heartbeat/lt-heartbeat/g' "$file"
    sed -i 's/LtDemo/LtDemo/g' "$file"
    sed -i 's/LtHttp/LtHttp/g' "$file"
    sed -i 's/LtServlet/LtServlet/g' "$file"
    sed -i 's/LtCallable/LtCallable/g' "$file"
    sed -i 's/LtForkJoin/LtForkJoin/g' "$file"
    sed -i 's/LtRunnable/LtRunnable/g' "$file"
    sed -i 's/LtStream/LtStream/g' "$file"
    sed -i 's/LtKafka/LtKafka/g' "$file"
    sed -i 's/LtUi/LtUi/g' "$file"
    sed -i 's/LtInitializer/LtInitializer/g' "$file"
    sed -i 's/lt-store/lt-store/g' "$file"
    sed -i 's/lt-stream/lt-stream/g' "$file"
    sed -i 's/lt-handler/lt-handler/g' "$file"
    sed -i 's/lt-agent/lt-agent/g' "$file"
    sed -i 's/Lt/Lt/g' "$file"
    sed -i 's/lt/lt/g' "$file"
    sed -i 's/LT/LT/g' "$file"
done

echo "Content replacement done."

# Rename directories and files
while find /workspace -depth -name "*lt*" -not -path "*/.git/*" -not -path "*/node_modules/*" | grep -q "lt"; do
    find /workspace -depth -name "*lt*" -not -path "*/.git/*" -not -path "*/node_modules/*" | while read -r f; do
        dir=$(dirname "$f")
        base=$(basename "$f")
        newbase=$(echo "$base" | sed 's/lt/lt/g; s/Lt/Lt/g')
        mv "$f" "$dir/$newbase"
    done
done

echo "Rename done."
