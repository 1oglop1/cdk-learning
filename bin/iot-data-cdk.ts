#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from '@aws-cdk/core';

import { IotCorePolicyStack } from '../lib/iot-core-policy-stack';
import { IotDataPipelinesStack } from '../lib/iot-data-pipeline-stack';

// import { IotDataCdkStack } from '../lib/iot-data-cdk-stack';
const app = new cdk.App();
// new IotDataCdkStack(app, 'IotDataCdkStack');
new IotCorePolicyStack(app, 'IotCorePolicyStack');
new IotDataPipelinesStack(app, 'IotDataPipelinesStack');
