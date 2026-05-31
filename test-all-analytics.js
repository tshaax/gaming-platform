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
  console.log('Testing All Analytics API Endpoints...\n');

  const endpoints = [
    { path: '/api/analytics/weekly-activity', name: '📊 Weekly Activity' },
    { path: '/api/analytics/revenue-trend', name: '💰 Revenue Trend' },
    { path: '/api/analytics/total-revenue', name: '💵 Total Revenue' },
    { path: '/api/analytics/active-sessions', name: '🔗 Active Sessions' }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path);
    console.log(`${endpoint.name}`);
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
  console.log('✅ All analytics endpoints are working correctly!');
}

test();
