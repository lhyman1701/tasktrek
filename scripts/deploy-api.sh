#!/bin/bash
set -e

# Configuration
ENV_NAME=${1:-dev}
REGION=${AWS_REGION:-us-east-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="taskflow-api-${ENV_NAME}"
IMAGE_TAG=${2:-latest}

echo "=== TaskFlow API Deployment ==="
echo "Environment: ${ENV_NAME}"
echo "Region: ${REGION}"
echo "Account: ${ACCOUNT_ID}"
echo "Image Tag: ${IMAGE_TAG}"
echo ""

# Step 1: Build the Docker image
echo "Step 1: Building Docker image..."
docker build -t ${ECR_REPO}:${IMAGE_TAG} -f packages/api/Dockerfile .

# Step 2: Authenticate with ECR
echo "Step 2: Authenticating with ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# Step 3: Tag and push the image
echo "Step 3: Pushing image to ECR..."
docker tag ${ECR_REPO}:${IMAGE_TAG} ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}

# Step 4: Force new deployment
echo "Step 4: Forcing new ECS deployment..."
aws ecs update-service \
  --cluster taskflow-${ENV_NAME} \
  --service taskflow-api-${ENV_NAME} \
  --force-new-deployment \
  --region ${REGION}

echo ""
echo "=== Deployment initiated ==="
echo "Monitor progress with: aws ecs describe-services --cluster taskflow-${ENV_NAME} --services taskflow-api-${ENV_NAME}"
