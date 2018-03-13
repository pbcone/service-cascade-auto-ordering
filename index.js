const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const ORDERS_TABLE = process.env.ORDERS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3Bucket= 'acme-auto-dev-order-storage.s3.amazonaws.com'

app.use(bodyParser.json({ strict: false }));

app.get('/orders/:order_id', (req, res) => {
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

app.get('/orders', (req, res) => {
    const params = {
        TableName: ORDERS_TABLE
    }
    dynamoDb.scan(params, (error, result) => {
        if (error) {
            console.log(error);
            res.status(400).json({ error: 'Could not get orders' });
        }
        if (result) {
            console.log('RESULTS:' ,result);
            orders = result.Items;
            console.log('ARRAY: ', orders);
            res.json({ orders });
        } else {
            res.status(404).json({ error: "Orders not found" });
        }
    });
})

app.post('/order_id', (req, res) => {
    const { order_id, customer_id, make, model, pkg } = req.body;
    if (typeof order_id !== 'string') {
        res.status(400).json({ error: '"order_id" must be a string' });
    } else if (typeof customer_id !== 'string') {
        res.status(400).json({ error: '"customer_id" must be a string' });
    } else if (typeof make !== 'string') {
        res.status(400).json({ error: '"make" must be a string' });
    } else if (typeof model !== 'string') {
        res.status(400).json({ error: '"model" must be a string' });
    } else if (typeof pkg !== 'string') {
        res.status(400).json({ error: '"pkg" must be a string' });
    }
    const params = {
        TableName: ORDERS_TABLE,
        Item: {
            order_id: order_id,
            customer_id: customer_id,
            make: make,
            model: model,
            pkg: pkg
        },
    };
    saveOrderRecordInS3(req.body);
    dynamoDb.put(params, (error) => {
        if (error) {
            console.log(error);
            res.status(400).json({ error: 'Could not create order' });
        }
        let url ='https://acme-auto-dev-order-storage.s3.amazonaws.com/'+ order_id;
        let status = 'Your Order has been Submited';
        res.status(200).json({status , url });
    });
})

let saveOrderRecordInS3 = (jsonObject) => {
    let s3 = new AWS.S3();
    let params = {
        ACL : 'public-read',
        Bucket : 'acme-auto-dev-order-storage',
        Key : jsonObject.order_id,
        Body : JSON.stringify(jsonObject),
        ContentType: "application/json"
    }
    s3.upload(params, (err, data) => {
        if (err) {
            console.log(err, err.stack);
        }else{
            console.log("Success", data);
        }
    });
}

module.exports.handler = serverless(app);
module.exports.saveOrderRecordInS3 = saveOrderRecordInS3;
