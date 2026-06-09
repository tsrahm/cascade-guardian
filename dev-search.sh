#!/bin/bash
PROJECT_PATH="${1:-.}"
QUERY="${2:-test}"
echo "Searching '$QUERY' in: $PROJECT_PATH"
node dist/index.js search "$PROJECT_PATH" "$QUERY"
