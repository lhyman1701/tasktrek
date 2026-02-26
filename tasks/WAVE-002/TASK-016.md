# TASK-016: Deploy API to AWS (CDK)

## Status: blocked

## Dependencies

- All WAVE-002 tasks

## Description

Create AWS CDK infrastructure for deploying the API to production.

## Files to Create

```
infra/
├── package.json
├── tsconfig.json
├── cdk.json
├── bin/
│   └── infra.ts
└── lib/
    ├── api-stack.ts
    ├── database-stack.ts
    └── constructs/
        └── express-lambda.ts
```

## CDK Stacks

### API Stack

```typescript
// lib/api-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const api = new NodejsFunction(this, 'ApiHandler', {
      entry: '../packages/api/src/lambda.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        DATABASE_URL: props.databaseUrl,
        NODE_ENV: 'production',
        ANTHROPIC_API_KEY: props.anthropicApiKey
      },
      bundling: {
        minify: true,
        sourceMap: true
      }
    });

    const gateway = new apigateway.LambdaRestApi(this, 'ApiGateway', {
      handler: api,
      proxy: true,
      deployOptions: {
        stageName: 'v1',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200
      }
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: gateway.url
    });
  }
}
```

### Database Stack

```typescript
// lib/database-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class DatabaseStack extends cdk.Stack {
  public readonly databaseUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1
    });

    const cluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_1
      }),
      writer: rds.ClusterInstance.serverlessV2('writer'),
      vpc,
      defaultDatabaseName: 'taskflow',
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2
    });

    this.databaseUrl = `postgresql://${cluster.secret?.secretValueFromJson('username')}:${cluster.secret?.secretValueFromJson('password')}@${cluster.clusterEndpoint.hostname}:5432/taskflow`;
  }
}
```

### Lambda Handler

```typescript
// packages/api/src/lambda.ts
import serverlessExpress from '@codegenie/serverless-express';
import { createApp } from './app';

const app = createApp();
export const handler = serverlessExpress({ app });
```

## Deployment Commands

```bash
# Bootstrap CDK (first time)
cd infra
npx cdk bootstrap

# Deploy database
npx cdk deploy DatabaseStack

# Deploy API
npx cdk deploy ApiStack

# Deploy all
npx cdk deploy --all
```

## Acceptance Criteria

1. [ ] CDK stacks for database and API
2. [ ] Aurora Serverless v2 for PostgreSQL
3. [ ] Lambda with API Gateway
4. [ ] Environment variables configured
5. [ ] Rate limiting enabled
6. [ ] Outputs include API URL
7. [ ] Deployment succeeds

## Notes

- Use AWS Secrets Manager for sensitive values
- Enable CloudWatch logs
- Consider adding WAF for additional security
- Set up CI/CD for automated deployments
