const http = require('http');

function makeRequest(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:8080${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message });
        }
      });
    }).on('error', err => {
      resolve({ status: 0, error: err.message });
    });
  });
}

async function test() {
  console.log('Testing Analytics API Endpoints...\n');

  const endpoints = [
    '/api/analytics/weekly-activity',
    '/api/analytics/revenue-trend',
    '/api/analytics/total-revenue'
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint);
    console.log(`📊 ${endpoint}`);
    console.log(`  Status: ${result.status}`);
    if (result.data) {
      if (Array.isArray(result.data.data)) {
        console.log(`  Records: ${result.data.data.length}`);
        if (result.data.data.length > 0) {
          console.log(`  Sample: ${JSON.stringify(result.data.data[0])}`);
        }
      } else {
        console.log(`  Value: ${result.data.data}`);
      }
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log();
  }
}

test();
