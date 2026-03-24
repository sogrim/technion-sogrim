#!/bin/bash
# Retry pulumi up until the instance is created (OCI ARM capacity issue)
set -euo pipefail

INTERVAL=${1:-60}  # seconds between retries, default 60

echo "Retrying pulumi up every ${INTERVAL}s until success..."
while true; do
    if pulumi up -s benny-n/sogrim/prod --yes --skip-preview 2>&1 | tee /dev/stderr | grep -q "Resources:"; then
        if pulumi up -s benny-n/sogrim/prod --yes --skip-preview 2>&1 | grep -q "0 to create"; then
            echo "All resources created successfully!"
            pulumi stack output -s benny-n/sogrim/prod
            break
        fi
    fi
    echo "$(date): Out of capacity, retrying in ${INTERVAL}s..."
    sleep "$INTERVAL"
done
