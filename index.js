const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const fs = require('fs');
const tmp = require('tmp');

const ORDERS_TABLE = process.env.ORDERS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

function createTempJsonFile (jsonObject) {
  fs.writeFile("/tmp/test.txt", "testing", function (err) {
        if (err) {
            context.fail("writeFile failed: " + err);
        } else {
            context.succeed("writeFile succeeded");
        }
    });



  let filename = '/tpm/tempOrder.json';
  // fs.writeFile(filename, JSON.stringify(jsonObject), function (err) {
  //   if (err) throw err;
  //   console.log('JSON Saved!');
  // });
  return filename;
}


function saveToS3 (jsonObject, order_id) {
  // var tmpobj = tmp.fileSync();
  // console.log('File: ', tmpobj.name);
  // console.log('Filedescriptor: ', tmpobj.fd);

  var s3 = new AWS.S3();
  console.log('Starting upload to S3');
  var params = {Bucket: 'acme-auto-dev-order-storage', Key: 'testcase', Body: 'helloWorld'};
  s3.upload(params, function(err, data) {
    if(err){
      console.log(err);
    }else{
      console.log('Sucessfully uploaded to S3');
    }
  });


  // fs.readFile(createTempJsonFile(jsonObject), function(err,data){
  //   if(err) throw err;
  //   var params = {Bucket: 'acme-auto-dev-order-storage', Key: order_id, Body: data};
  //   s3.upload(params, function(err, data) {
  //     if(err){
  //       console.log(err);
  //     }else{
  //       console.log('Sucessfully uploaded to S3');
  //     }
  //   });
  // })
}

app.use(bodyParser.json({ strict: false }));

app.get('/', function (req, res) {
  res.send('Hello World!')
})

// Get Order endpoint
app.get('/orders/:order_id', function (req, res) {
  const params = {
    TableName: ORDERS_TABLE,
    Key: {
      order_id: req.params.order_id,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get order' });
    }
    if (result.Item) {
      const {order_id, customer_id} = result.Item;
      res.json({ order_id, customer_id });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });
})
app.get('/orders', function (req, res) {
  const params = {
    TableName: ORDERS_TABLE
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get orders' });
    }
    if (result) {

      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': '*',
        },
        body: JSON.stringify({
          orders: result
        }),
      };
      // res.send(response);
      // const {order_id, customer_id} = result;
      res.json({ result });
    } else {
      res.status(404).json({ error: "Orders not found" });
    }
  });
})

// Create User endpoint
app.post('/order_id', function (req, res) {
  const { order_id, customer_id, make, model, package } = req.body;
  if (typeof order_id !== 'string') {
    res.status(400).json({ error: '"order_id" must be a string' });
  } else if (typeof customer_id !== 'string') {
    res.status(400).json({ error: '"customer_id" must be a string' });
  } else if (typeof make !== 'string') {
    res.status(400).json({ error: '"make" must be a string' });
  } else if (typeof model !== 'string') {
    res.status(400).json({ error: '"model" must be a string' });
  } else if (typeof package !== 'string') {
    res.status(400).json({ error: '"package" must be a string' });
  }

  const params = {
    TableName: ORDERS_TABLE,
    Item: {
      order_id: order_id,
      customer_id: customer_id,
      make: make,
      model: model,
      package: package
    },
  };

  saveToS3(req.body, order_id);

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create order' });
    }
    res.json({ order_id, customer_id });
  });
})


module.exports.handler = serverless(app);
module.exports.saveToS3 = saveToS3;
