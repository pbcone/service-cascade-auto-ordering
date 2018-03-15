let http = require('http');
let querystring = require('querystring');
let axios = require('axios');

const AWS = require('aws-sdk');
const ORDERS_TABLE = process.env.ORDERS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

let getRainierToken = () => {
  let bodyData ={
      storefront: 'ccas-bb9630c04f'
  };
  axios.get('http://localhost:3051/rainier/v10.0/nonce_token', bodyData)
  .then((response) => {
      if(response.nonce_token){
          return response.nonce_token;
      } else {
          console.log('Error Fetching Token');
      }
  });
}

let addOrderIdToDynamo = (supplierOrderId, orderId) => {
  const params = {
      TableName: ORDERS_TABLE,
      Key: {
          order_id: order_id
      },
      UpdateExpression: 'SET supplier_order_id =:newSupplierOrderId',
      ExpressionAttributeValues : {
        'newSupplierOrderId' : supplierOrderId
      }
  };
  dynamoDb.update(params, (error) => {
      if (error) {
          console.log(error);
          res.status(400).json({ error: 'Could not find order' });
      }
  });
}

// Following Request won't actually work, because local:3050 is not an open port in firewall
module.exports.handler = (event, context) => {

    let acmeModel = ['anvil','wile','roadrunner'];
    let acmePkg = ['std','super','elite'];

    let rainierModel = ['pugetsound','olympic'];
    let rainierPkg = ['mtn','ltd','14k']

    let order = event.Records[0].dynamodb.NewImage;

    if (acmeModel.includes(order.model.S) && acmePkg.includes(order.pkg.S)){
        console.log("*********** placing Acme Order for a", order.pkg.S, ' ', order.model.S);
        let postData = querystring.stringify({
          api_key: "cascade.53bce4f1dfa0fe8e7ca126f91b35d3a6",
          model: order.model.S,
          pkg: order.pkg.S
        });
        let options = {
          host: 'localhost',
          port: 3050,
          method: 'POST',
          path: '/acme/api/v45.1',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
          }
        };
        let req = http.request(options, (res) => {
          let result = '';
          res.on('data', (chunk) => {
            result += chunk;
          });
          res.on('end', () => {
            console.log(result);
          });
          res.on('error', (err) => {
            console.log(err);
          })
        });
        req.on('error', (err) => {
          console.log(err);
        });
        req.write(postData);
        req.end();
    } else if (rainierModel.includes(order.model.S) && rainierPkg.includes(order.pkg.S)){
        console.log("*********** placing RAINIER Order for a", order.pkg.S, ' ', order.model.S);
        let nonce_token = getRainierToken ();
        let postData = {
            "token": nonce_token,
            "model": order.model.S,
            "pkg": order.pkg.S
        };
        axios.post('http://localhost:3051/rainier/v10.0/request_customized_model', postData)
        .then((response) => {
            addOrderIdToDynamo(response.order_id, order.order_id.S);
        });
    } else {
        console.log('MODEL/ PACKAGE not found on current list of suppliers');
    }
}

module.exports.addOrderIdToDynamo = addOrderIdToDynamo;
module.exports.getRainierToken = getRainierToken;
