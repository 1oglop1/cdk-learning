import * as sdk from 'aws-sdk';

const ec2 = new sdk.EC2();

const resp = ec2.describeSubnets();

const y = resp.promise().then((x)=>{console.log(x)});

console.log('y',y);