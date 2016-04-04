# NodeJS-Lambda-Deploy
deploy nodeJS function to Amazon Lambda with S3
 
**Configuration**


AwsConfig.json  // Aws credentials

deploy.js


var BUCKET_NAME = 'lambda-deploy-bucket'; // Bucket name

var baseURL='https://s3-eu-west-1.amazonaws.com/'; // S3 Base URL

var entry = 'product.zip'; // final product file name
var key_folder = 'fj-api'; // folder name under bucket
var lambda_role = ''; // lambda function role ARN

var func_prefix = 'fj_'; // Default lambda function prefix
 
**Usage**

node deploy.js functionName create||update prefix(optional)
node deploy.js functionName create pre_
node deploy.js functionName update pre_  // Updates existing function

