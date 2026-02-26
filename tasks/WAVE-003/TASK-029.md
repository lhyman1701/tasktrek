# TASK-029: Deploy to S3 + CloudFront

## Status: blocked

## Dependencies

- All WAVE-003 tasks

## Description

Deploy web app to S3 with CloudFront CDN.

## CDK Stack

```typescript
// infra/lib/web-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class WebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    // S3 bucket for static assets
    const bucket = new s3.Bucket(this, 'WebBucket', {
      bucketName: 'taskflow-web',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // CloudFront OAI
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    bucket.grantRead(oai);

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(bucket, {
          originAccessIdentity: oai
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0)
        }
      ]
    });

    // Deploy assets
    new s3deploy.BucketDeployment(this, 'DeployWeb', {
      sources: [s3deploy.Source.asset('../packages/web/dist')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*']
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebUrl', {
      value: `https://${distribution.distributionDomainName}`
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName
    });
  }
}
```

## Build & Deploy Script

```bash
#!/bin/bash
# scripts/deploy-web.sh

set -e

# Build web app
cd packages/web
npm run build

# Deploy to AWS
cd ../../infra
npx cdk deploy WebStack --require-approval never

echo "Deployment complete!"
```

## GitHub Actions

```yaml
# .github/workflows/deploy-web.yml
name: Deploy Web

on:
  push:
    branches: [main]
    paths: ['packages/web/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build --workspace=packages/web

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - run: npx cdk deploy WebStack --require-approval never
        working-directory: infra
```

## Acceptance Criteria

1. [ ] S3 bucket created
2. [ ] CloudFront distribution works
3. [ ] HTTPS enforced
4. [ ] SPA routing works (404 → index.html)
5. [ ] Assets cached correctly
6. [ ] CI/CD pipeline works
7. [ ] Output shows deployment URL
