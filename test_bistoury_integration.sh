#!/bin/bash
set -e

echo "Running Integration Test: bistoury in bee-apm"

if [ ! -d "bistoury" ]; then
    echo "FAIL: bistoury directory not found."
    exit 1
fi

if [ ! -f "bistoury/pom.xml" ]; then
    echo "FAIL: bistoury/pom.xml not found."
    exit 1
fi

if ! grep -q "<module>bistoury</module>" pom.xml; then
    echo "FAIL: bistoury is not included as a module in the root pom.xml."
    exit 1
fi

echo "PASS"

echo "Running Integration Test: docker-compose"

if ! grep -q "bistoury-backend" docker-compose.yml; then
    echo "FAIL: bistoury-backend not found in docker-compose.yml"
    exit 1
fi

if ! grep -q "bistoury-frontend" docker-compose.yml; then
    echo "FAIL: bistoury-frontend not found in docker-compose.yml"
    exit 1
fi

echo "ALL PASS"

echo "Running Integration Test: true code merge (no submodules)"

if [ -f ".gitmodules" ]; then
    echo "FAIL: .gitmodules found. bistoury should be merged as code, not as a submodule."
    exit 1
fi

echo "TRUE MERGE PASS"
