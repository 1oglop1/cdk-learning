import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as iot from '@aws-cdk/aws-iot';
import * as kinesis from '@aws-cdk/aws-kinesis';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import {spawn} from "child_process";

interface IVpc extends ec2.IVpc {

}

export class IotDataPipelinesStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const TenantParameter = this.node.tryGetContext("TenantParameter");

        // const LocationParameter = this.node.tryGetContext("LocationParameter");
        // reference to existing resource - attrs does not need to be loaded only from AWS env

        const vpc = ec2.Vpc.fromVpcAttributes(
            this,
            'VPC',
            {
                vpcId: 'vpc-058190638810b6d16',
                availabilityZones: ['eu-west-1a', 'eu-west-1b'],
                publicSubnetIds: [
                    'subnet-04e1a9976746d1437',
                    'subnet-0e4e9a3802d6d0ff9',
                ],
                privateSubnetIds: [
                    'subnet-0e1f815dd39df3e1d',
                    'subnet-0432c056c7259dba0'
                ]
            });

        const stream = new kinesis.Stream(
            this,
            'jan-kinesis-stream', // TODO naming convention
            {
                streamName: 'jan-kstream-name', //TODO naming convention
                retentionPeriodHours: 24,
                shardCount: 2 // TODO parametrize small 1, medium 2, large 5
            }
        );

        const kinesisRole = new iam.Role(
            this,
            'jan-kin-role', // TODO naming convention
            {
                assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
                roleName: "jan-kin-role", // TODO optional parameter && naming convention
                inlinePolicies: {
                    'jan-kin-inline-pol': new iam.PolicyDocument({
                        statements: [
                            new iam.PolicyStatement({
                                effect: iam.Effect.ALLOW,
                                actions: ['kinesis:PutRecord'],
                                resources: [
                                    stream.streamArn
                                ]
                            })
                        ]
                    })
                }
            }
        );

        new iot.CfnTopicRule(
            this,
            'jan-topic-rule', // TODO naming convention
            {
                ruleName: 'jan_topic_rulename', // TODO naming convention
                topicRulePayload: {
                    description: "Pipes data from IOT core to specific tenant Kinesis Stream",
                    awsIotSqlVersion: '2016-03-23',
                    ruleDisabled: false,
                    sql: `SELECT *, topic() as topic FROM 'data/${TenantParameter}/#'`,
                    actions: [
                        {
                            kinesis: {
                                roleArn: kinesisRole.roleArn,
                                streamName: stream.streamName,
                                partitionKey: 'newuudi()' // recommended by AWS to distribute data evenly
                            }
                        }
                    ]
                },
            }
        );


        const lambdaSG = new ec2.SecurityGroup(
            this,
            'jan-sg-id', // TODO naming convention?
            {
                description: "For lambda which consumes IoT data from Kinesis. Has access to DB.",
                vpc: vpc
            }
        );


        const nfPath = 'functions/iot-data-ingester/data-ingestion-consumer/';
        spawn(
            'npm',
            ['install'],
            {
                cwd: nfPath
            }
        );

        const nodeFunction = new lambda.Function(
            this,
            'jan-lamdba-f-id', // TODO naming convention?
            {
                code: lambda.Code.fromAsset(nfPath),
                description: "Consumer of IOT data from Kinesis Stream",
                environment: {
                    "SECRET_KEY_ARN": 'Secret manager path' // TODO reference to secret manager
                },
                handler: "index.handler",
                runtime: lambda.Runtime.NODEJS_12_X,
                // securityGroup: undefined,
                securityGroups: [
                    lambdaSG
                ],
                vpc: vpc,
                vpcSubnets: {
                    subnetType: ec2.SubnetType.PRIVATE
                }
                // https://docs.aws.amazon.com/cdk/api/latest/typescript/api/aws-lambda/functionprops.html#aws_lambda_FunctionProps_role
            }
        );
        const statement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['secretsmanager:GetSecretValue'],
            resources: [
                this.node.tryGetContext("SECRET_KEY_ARN")
            ]
        });

        nodeFunction.addToRolePolicy(statement);
        new lambda.Function(
            this,
            'py',
            {
                code: lambda.Code.fromAsset(
                    'functions/pylambda'
                ),
                handler: "fun.handler",
                runtime: lambda.Runtime.PYTHON_3_7

            }
        )
    }
}
