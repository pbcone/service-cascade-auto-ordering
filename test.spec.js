const index = require('./index.js');
const supplier = require ('./supplier.js');
const authorizer = require ('./authorizer.js');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();


describe('Tests S3 functionality', () => {
    let tempJson = {
      order_id: 'testCase123',
      name:'Hello',
      pass: 'World',
      data: 'moredata'
    }
    it('Can Save a record in S3', () => {

      index.saveOrderRecordInS3(tempJson);
      let params = {
       Bucket: "acme-auto-dev-order-storage",
       Key: "testCase123"
      };
      s3.getObject(params, (err, data) => {
          expect(data.Body.toString('utf-8')).toBe(JSON.stringify(tempJson))
      });

    });
});
describe('Authorizer', () => {
    let response = {
        principalId: 'user123',
        policyDocument: {
            Version: '2012-10-17',
            Statement: [ [Object] ]
        }
    }
    let context = {
        logGroupName: '/aws/lambda/service-acme-auto-dev-authorizerUser',
        logStreamName: '2018/03/13/[$LATEST]2908cbf604c049f0bc6de309a46996fc',
        functionName: 'service-acme-auto-dev-authorizerUser',
        memoryLimitInMB: '1024',
        functionVersion: '$LATEST',
        invokeid: '7c600a8d-26f2-11e8-a0f4-1d0e4e392664',
        awsRequestId: '7c600a8d-26f2-11e8-a0f4-1d0e4e392664',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:022673376606:function:service-acme-auto-dev-authorizerUser'
    };
    let event = {
        type: 'TOKEN',
        methodArn: 'arn:aws:execute-api:us-east-1:022673376606:vxvtlzhbh8/dev/GET/orders',
        authorizationToken: null
    }
    it('will approve user', () => {
        event.authorizationToken ='Bearer allow'
        let callback = (err, data) => {
            // console.log('Data: ',data.policyDocument.Statement[0].Effect);
            expect(data.policyDocument.Statement[0].Effect).toBe('Allow');
        }
        authorizer.user(event,context,callback);
    });
    it('will deny user', () => {
        event.authorizationToken ='Bearer deny';
        let callback = (err, data) => {
            expect(data.policyDocument.Statement[0].Effect).toBe('Deny');
        }
        authorizer.user(event,context,callback);
    });
    it('will reject Unauthorized user', () => {
        event.authorizationToken ='Bearer sdfacew123';
        let callback = (data) => {
            expect(data).toBe('Unauthorized');
        }
        authorizer.user(event,context,callback);
    });
});
