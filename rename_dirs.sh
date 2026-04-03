#!/bin/bash

# Find all net/beeapm directories
find /workspace -type d -path "*/src/*/java/net/beeapm" -not -path "*/\.git/*" -not -path "*/target/*" | while read -r dir; do
    echo "Processing $dir"
    parent_dir=$(dirname "$dir") # gets .../src/*/java/net
    grandparent_dir=$(dirname "$parent_dir") # gets .../src/*/java
    
    # Create the target directory structure
    mkdir -p "$grandparent_dir/org/xi/lt"
    
    # Move the contents of net/beeapm to org/xi/lt
    mv "$dir"/* "$grandparent_dir/org/xi/lt/" 2>/dev/null || true
    
    # Check if the old net directory is now empty and remove if so
    rmdir "$dir" 2>/dev/null || true
    rmdir "$parent_dir" 2>/dev/null || true
done
echo "DONE"
