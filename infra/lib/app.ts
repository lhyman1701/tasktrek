#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from './stacks/api-stack';
import { DatabaseStack } from './stacks/database-stack';
import { WebStack } from './stacks/web-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
};

// Get environment name from context or default to 'dev'
const envName = app.node.tryGetContext('env') || 'dev';

// Database stack (RDS PostgreSQL)
const databaseStack = new DatabaseStack(app, `TaskFlow-Database-${envName}`, {
  env,
  envName,
  description: `TaskFlow Database Stack (${envName})`
});

// API stack (ECS Fargate)
const apiStack = new ApiStack(app, `TaskFlow-Api-${envName}`, {
  env,
  envName,
  vpc: databaseStack.vpc,
  databaseSecurityGroupId: databaseStack.databaseSecurityGroupId,
  databaseSecret: databaseStack.databaseSecret,
  databaseEndpoint: databaseStack.databaseEndpoint,
  databasePort: databaseStack.databasePort,
  description: `TaskFlow API Stack (${envName})`
});

// Web stack (S3 + CloudFront)
new WebStack(app, `TaskFlow-Web-${envName}`, {
  env,
  envName,
  apiUrl: apiStack.apiUrl,
  description: `TaskFlow Web Stack (${envName})`
});

app.synth();
