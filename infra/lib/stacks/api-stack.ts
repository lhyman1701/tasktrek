import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.IVpc;
  databaseSecurityGroupId: string;
  databaseSecret: secretsmanager.ISecret;
  databaseEndpoint: string;
  databasePort: number;
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly apiSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const {
      envName,
      vpc,
      databaseSecurityGroupId,
      databaseSecret,
      databaseEndpoint,
      databasePort
    } = props;

    const isProd = envName === 'prod';

    // ECR Repository for API image
    const repository = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: `taskflow-api-${envName}`,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: !isProd
    });

    // API security group
    this.apiSecurityGroup = new ec2.SecurityGroup(this, 'ApiSg', {
      vpc,
      description: 'Security group for TaskFlow API',
      allowAllOutbound: true
    });

    // Import database security group and add ingress rule
    const databaseSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'DatabaseSgImport',
      databaseSecurityGroupId
    );

    // Allow API to connect to database (using CfnSecurityGroupIngress to avoid cyclic reference)
    new ec2.CfnSecurityGroupIngress(this, 'DbIngress', {
      groupId: databaseSecurityGroupId,
      ipProtocol: 'tcp',
      fromPort: databasePort,
      toPort: databasePort,
      sourceSecurityGroupId: this.apiSecurityGroup.securityGroupId,
      description: 'Allow API to connect to database'
    });

    // Redis security group
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSg', {
      vpc,
      description: 'Security group for TaskFlow Redis',
      allowAllOutbound: false
    });

    // Allow API to connect to Redis
    redisSecurityGroup.addIngressRule(
      this.apiSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow API to connect to Redis'
    );

    // Redis subnet group
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for TaskFlow Redis',
      subnetIds: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      }).subnetIds,
      cacheSubnetGroupName: `taskflow-redis-${envName}`
    });

    // Redis cluster
    const redis = new elasticache.CfnCacheCluster(this, 'Redis', {
      engine: 'redis',
      cacheNodeType: isProd ? 'cache.t3.small' : 'cache.t3.micro',
      numCacheNodes: 1,
      clusterName: `taskflow-${envName}`,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
      engineVersion: '7.0'
    });
    redis.addDependency(redisSubnetGroup);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: `taskflow-${envName}`
    });

    // Anthropic API Key secret (must be created manually before deployment)
    const anthropicApiKey = secretsmanager.Secret.fromSecretNameV2(
      this,
      'AnthropicApiKey',
      `taskflow/${envName}/anthropic-api-key`
    );

    // Fargate service with ALB
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'ApiService',
      {
        cluster,
        serviceName: `taskflow-api-${envName}`,
        cpu: isProd ? 512 : 256,
        memoryLimitMiB: isProd ? 1024 : 512,
        desiredCount: isProd ? 2 : 1,
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
          containerPort: 3000,
          environment: {
            NODE_ENV: envName === 'prod' ? 'production' : 'development',
            PORT: '3000',
            DATABASE_HOST: databaseEndpoint,
            DATABASE_PORT: databasePort.toString(),
            DATABASE_NAME: 'taskflow',
            REDIS_HOST: redis.attrRedisEndpointAddress,
            REDIS_PORT: redis.attrRedisEndpointPort
          },
          secrets: {
            DATABASE_USERNAME: ecs.Secret.fromSecretsManager(databaseSecret, 'username'),
            DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(databaseSecret, 'password'),
            ANTHROPIC_API_KEY: ecs.Secret.fromSecretsManager(anthropicApiKey)
          },
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: 'taskflow-api',
            logRetention: isProd
              ? logs.RetentionDays.ONE_MONTH
              : logs.RetentionDays.ONE_WEEK
          })
        },
        securityGroups: [this.apiSecurityGroup],
        publicLoadBalancer: true,
        assignPublicIp: false,
        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        },
        healthCheckGracePeriod: cdk.Duration.seconds(60)
      }
    );

    // Configure health check
    fargateService.targetGroup.configureHealthCheck({
      path: '/api/health',
      healthyHttpCodes: '200',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3
    });

    // Auto-scaling for production
    if (isProd) {
      const scaling = fargateService.service.autoScaleTaskCount({
        minCapacity: 2,
        maxCapacity: 10
      });

      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.minutes(5),
        scaleOutCooldown: cdk.Duration.minutes(2)
      });

      scaling.scaleOnMemoryUtilization('MemoryScaling', {
        targetUtilizationPercent: 80,
        scaleInCooldown: cdk.Duration.minutes(5),
        scaleOutCooldown: cdk.Duration.minutes(2)
      });
    }

    this.apiUrl = fargateService.loadBalancer.loadBalancerDnsName;

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `http://${this.apiUrl}`,
      exportName: `TaskFlow-${envName}-ApiUrl`
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri,
      exportName: `TaskFlow-${envName}-EcrRepositoryUri`
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      exportName: `TaskFlow-${envName}-ClusterName`
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: fargateService.service.serviceName,
      exportName: `TaskFlow-${envName}-ServiceName`
    });
  }
}
