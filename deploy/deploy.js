
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./AwsConfig.json');
var fs = require('fs');
var s3 = new AWS.S3();
var lambda = new AWS.Lambda();

var archiver = require('archiver');
var archive = archiver('zip');

var BUCKET_NAME = 'lambda-deploy-bucket'; // Bucket name
var baseURL='https://s3-eu-west-1.amazonaws.com/'; // S3 Base URL
var entry = 'product.zip'; // final product file name
var key_folder = 'fj-api'; // folder name under bucket
var lambda_role = ''; // lambda function role ARN

var func_prefix = 'fj_'; // Default lambda function prefix

function zipStation(folder,process,func_prefix){

  var ZIP_PATH = __dirname + '/zips';
  var output = fs.createWriteStream(ZIP_PATH+'/product.zip');


  output.on('close', function() {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');

    var remoteFilename = key_folder+'/'+folder+'/' + entry;
    uploadFile(remoteFilename,  ZIP_PATH + '/' + entry,function(err){

      if(process == 'create'){
        createLambda(remoteFilename,folder,func_prefix)
      } else if(process == 'update'){
        updateLambda(remoteFilename,folder,func_prefix);
      }

    });

  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);
  
  var directories = ['../'+folder]

  for(var i in directories) {
    archive.directory(directories[i], directories[i]);
  }
  archive.finalize();

}



if (process.argv.length < 3) noParamsGiven();
else runWithParams();


function noParamsGiven() {
  showUsage();
  process.exit(-1);
}


function runWithParams() {
  console.log('S3 Deployer ... running option is [' + JSON.stringify(process.argv) + ']');

  if (process.argv[2] && process.argv[3]) {
      upload(process.argv[2],process.argv[3],process.argv[4]);
  } else {
      console.log('...that option isn\'t recognized');
  }
}


function upload(folderName,process,isFj) {

  if(typeof isFj != "undefined"){
      func_prefix = isFj;
  }

  zipStation(folderName,process,func_prefix);


}
function updateLambda(remoteFilename,folderName,func_prefix){
  var params = {
    FunctionName: func_prefix+folderName, /* required */
    Publish: true,
    S3Bucket: BUCKET_NAME,
    S3Key: remoteFilename
  };
  lambda.updateFunctionCode(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}
function createLambda(remoteFilename,folderName,func_prefix){

  var params = {
    Code: { /* required */
      S3Bucket: BUCKET_NAME,
      S3Key: remoteFilename
    },
    FunctionName: func_prefix+folderName, /* required */
    Handler: folderName+'/index.handler', /* required */
    Role: lambda_role, /* required */
    Runtime: 'nodejs', /* required */
    Description: '',
    MemorySize: 768,
    Publish: true,
    Timeout: 10
  };

  lambda.createFunction(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });


}

function uploadFile(remoteFilename, fileName,callback) {
  var fileBuffer = fs.readFileSync(fileName);
  s3.putObject({

    Bucket: BUCKET_NAME,
    Key: remoteFilename,
    Body: fileBuffer
  }, function(error, response) {
    console.log('uploaded file[' + fileName + '] to ['+baseURL+BUCKET_NAME+'/'+remoteFilename + ']');
    console.log(arguments);
    callback(null,arguments);
  });
}


function showUsage() {
  console.log('Use one of these command line parameters:');
  console.log(' folder_name update||create function_prefix');

}
