const http = require('http');

const data = JSON.stringify({
  username: 'test_user_01',
  email: 'test01@example.com',
  password: 'Password123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', error => {
  console.error('Error connecting to Server!', error.message);
});

req.write(data);
req.end();
