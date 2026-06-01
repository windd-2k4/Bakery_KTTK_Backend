const http = require('http');

const data = JSON.stringify({
  items: [
    {
      productId: "c2b4b1a4-9e7c-4e8c-8f1a-5b1b4b1a49e7",
      quantity: 1,
      productPrice: 100
    }
  ],
  totalAmount: 100,
  paymentMethod: "CASH",
  shippingAddress: { address: "123 Test St" }
});

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let resData = '';
  res.on('data', (chunk) => {
    resData += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${resData}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
