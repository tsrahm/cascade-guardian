#!/bin/bash
PROJECT_PATH="${1:-.}"
echo "Building index for: $PROJECT_PATH"
node dist/index.js build-index "$PROJECT_PATH"
