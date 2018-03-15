# service-acme-auto
AWS service for custom car ordering using the serverless framework. Clients can place orders, or get orders (with proper authentication). Orders are stores in DynamoDB and a copy saved in S3 with public read access for users to download.

Once Orders are placed a DynamoDb stream event triggers a lambda to place an order to the corresponding suppliers api.

To place Order:
  ```
  POST https://vxvtlzhbh8.execute-api.us-east-1.amazonaws.com/dev/order_id
  ~BODY (application/json)
  {
	"order_id" : "1231r13414r",
	"customer_id" : "customer12",
	"make" : "Dodge",
	"model" : "olympic",
	"pkg" : "14k"
  }
```

To retrieve JSON object of all order: 
```
GET https://vxvtlzhbh8.execute-api.us-east-1.amazonaws.com/dev/orders
```

To retrieve Single order
```
GET https://vxvtlzhbh8.execute-api.us-east-1.amazonaws.com/dev/orders/($order_id)
```
