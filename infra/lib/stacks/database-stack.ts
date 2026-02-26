import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  envName: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroupId: string;
  public readonly databaseSecret: secretsmanager.ISecret;
  public readonly databaseEndpoint: string;
  public readonly databasePort: number;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { envName } = props;
    const isProd = envName === 'prod';

    // VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: isProd ? 3 : 2,
      natGateways: isProd ? 2 : 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }
      ]
    });

    // Database security group
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSg', {
      vpc: this.vpc,
      description: 'Security group for TaskFlow RDS',
      allowAllOutbound: false
    });
    this.databaseSecurityGroupId = this.databaseSecurityGroup.securityGroupId;

    // Database credentials in Secrets Manager
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `taskflow/${envName}/database`,
      description: 'TaskFlow database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'taskflow' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32
      }
    });

    // RDS PostgreSQL instance
    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_6
      }),
      instanceType: isProd
        ? ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
        : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [this.databaseSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      databaseName: 'taskflow',
      allocatedStorage: isProd ? 50 : 20,
      maxAllocatedStorage: isProd ? 200 : 50,
      storageType: rds.StorageType.GP3,
      multiAz: isProd,
      backupRetention: isProd ? cdk.Duration.days(30) : cdk.Duration.days(7),
      deletionProtection: isProd,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      enablePerformanceInsights: isProd,
      performanceInsightRetention: isProd
        ? rds.PerformanceInsightRetention.MONTHS_12
        : undefined
    });

    this.databaseEndpoint = database.dbInstanceEndpointAddress;
    this.databasePort = 5432; // PostgreSQL default port

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `TaskFlow-${envName}-VpcId`
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      exportName: `TaskFlow-${envName}-DatabaseSecretArn`
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.databaseEndpoint,
      exportName: `TaskFlow-${envName}-DatabaseEndpoint`
    });
  }
}
