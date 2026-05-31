const http = require('http');

// Test 1: Verify players endpoint is accessible
const testPlayersEndpoint = () => {
  return new Promise((resolve) => {
    http.get('http://localhost:8080/api/players', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('✓ Players endpoint accessible');
          console.log(`  Status: ${res.statusCode}`);
          console.log(`  Players count: ${parsed.data?.length || 0}`);
          console.log(`  Sample data:`, parsed.data?.[0] ? { id: parsed.data[0].id, email: parsed.data[0].email } : 'No data');
        } catch (e) {
          console.log('✗ Failed to parse players response:', e.message);
        }
        resolve();
      });
    }).on('error', err => {
      console.log('✗ Failed to fetch players:', err.message);
      resolve();
    });
  });
};

console.log('Testing Events Player Dropdown Fix...\n');
testPlayersEndpoint().then(() => {
  console.log('\nTest complete!');
  process.exit(0);
});
