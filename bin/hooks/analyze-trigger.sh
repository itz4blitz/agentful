#!/bin/bash

# analyze-trigger.sh
# Checks if changed files warrant an /agentful-analyze suggestion

FILE="${FILE:-}"

# Exit silently if no file specified
if [ -z "$FILE" ]; then
  exit 0
fi

# Normalize the file path to get just the filename
FILENAME=$(basename "$FILE")
FILEPATH="$FILE"

# Check for key files that should trigger analysis suggestions
case "$FILENAME" in
  package.json)
    # Only trigger for root package.json, not node_modules
    if echo "$FILEPATH" | grep -q "node_modules"; then
      exit 0
    fi
    echo "Dependencies changed in package.json. Consider running /agentful-analyze to update architecture understanding."
    exit 0
    ;;

  architecture.json)
    echo "Architecture configuration updated. Run /agentful-analyze to refresh tech stack analysis."
    exit 0
    ;;

  tsconfig.json|jsconfig.json)
    echo "TypeScript/JavaScript configuration changed. Consider running /agentful-analyze to update build settings."
    exit 0
    ;;

  vite.config.*|webpack.config.*|rollup.config.*|next.config.*)
    echo "Build configuration changed. Consider running /agentful-analyze to update bundler settings."
    exit 0
    ;;

  .env.example|.env.sample)
    echo "Environment template changed. Consider running /agentful-analyze to update configuration understanding."
    exit 0
    ;;

  docker-compose.yml|Dockerfile)
    echo "Docker configuration changed. Consider running /agentful-analyze to update deployment setup."
    exit 0
    ;;

  *)
    # No suggestion needed for other files
    exit 0
    ;;
esac
