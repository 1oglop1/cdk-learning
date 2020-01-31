import * as cdk from '@aws-cdk/core';
import * as iot from '@aws-cdk/aws-iot';
import * as iam from '@aws-cdk/aws-iam';



export class IotCorePolicyStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const TenantParameter = this.node.tryGetContext("TenantParameter");
        const LocationParameter = this.node.tryGetContext("LocationParameter");

        const policyDoc = new iam.PolicyDocument({
            assignSids: true,
            statements: [
                statements(
                    iam.Effect.ALLOW,
                    ["iot:Connect"],
                    [
                        `arn:aws:iot:${this.region}:${this.account}:client/basicPubSub`,
                        `arn:aws:iot:${this.region}:${this.account}:client/sdk-nodejs-*`
                    ]
                ),
                statements(
                    iam.Effect.ALLOW,
                    ["iot:Publish"],
                    [
                        `arn:aws:iot:${this.region}:${this.account}:topic/data/${TenantParameter}/${LocationParameter}/*`
                    ]
                ),
                statements(
                    iam.Effect.ALLOW,
                    ['iot:Receive'],
                    [
                        `arn:aws:iot:${this.region}:${this.account}:topic/command/${TenantParameter}/${LocationParameter}/*`
                    ]
                ),
                statements(
                    iam.Effect.ALLOW,
                    ['iot:Subscribe'],
                    [
                        `arn:aws:iot:${this.region}:${this.account}:topicfilter/command/${TenantParameter}/${LocationParameter}/*`
                    ]
                )
            ]
        });

        new iot.CfnPolicy(this,
            'my-iot-policy', //TODO wtf is this ID
            {
                policyName: 'my-policy',
                policyDocument: policyDoc
            }
        )

    }
}


function statements(effect: iam.Effect, actions: string[], resources: string[]): iam.PolicyStatement {

    return new iam.PolicyStatement(
        {
            effect: effect,
            actions: actions,
            resources: resources
        }
    );
}