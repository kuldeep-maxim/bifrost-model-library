#!/bin/bash

# Script to fetch and update the list of available providers from Bifrost API
# This should be run periodically to keep the list up-to-date

echo "Fetching latest providers from Bifrost API..."

# Fetch providers from the API
providers=$(curl -s 'https://www.getmaxim.ai/bifrost/api/models' | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    providers = sorted(set(model.get('provider', 'unknown') for model in data.values()))
    for p in providers:
        print(f'  \'{p}\',')
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
")

if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch providers"
    exit 1
fi

echo ""
echo "✅ Available providers (copy this to config/providers.ts):"
echo ""
echo "export const ALL_AVAILABLE_PROVIDERS = ["
echo "$providers"
echo "] as const;"
echo ""
echo "📊 Total providers: $(echo "$providers" | wc -l | tr -d ' ')"
echo ""
echo "⚠️  Remember to manually update the WHITELISTED_PROVIDERS array!"
