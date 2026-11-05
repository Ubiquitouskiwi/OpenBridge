#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';

const app = new App();

new FrontendStack(app, 'OpenBridgeFrontend', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-west-2',
  },
  description: 'OpenBridge static PWA — private S3 origin behind CloudFront (HTTPS, SPA rewrite).',
});
