#!/bin/bash
set -e

# Configuration
ENV_NAME=${1:-dev}
AWS_PROFILE=${AWS_PROFILE:-todobloom}
BUCKET_NAME="taskflow-web-${ENV_NAME}-635165708055"
DISTRIBUTION_ID="E3TFSUO02HOYYK"

echo "=== TaskFlow Web Deployment ==="
echo "Environment: ${ENV_NAME}"
echo "Profile: ${AWS_PROFILE}"
echo "Bucket: ${BUCKET_NAME}"
echo ""

# Step 1: Build the web app
echo "Step 1: Building web app..."
cd "$(dirname "$0")/.."
npm run build --workspace=@taskflow/web

# Step 2: Sync to S3
echo "Step 2: Uploading to S3..."
aws s3 sync packages/web/dist "s3://${BUCKET_NAME}" --delete --profile "${AWS_PROFILE}"

# Step 3: Invalidate CloudFront
echo "Step 3: Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "${DISTRIBUTION_ID}" \
  --paths "/*" \
  --profile "${AWS_PROFILE}" \
  --output text

echo ""
echo "=== Deployment complete ==="
echo "Website URL: https://d34lvftbnikqz7.cloudfront.net"
