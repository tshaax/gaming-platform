const http = require('http');

console.log('Verifying API response format for players...\n');

http.get('http://localhost:8080/api/players', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const players = parsed.data || [];
      
      console.log(`Total players: ${players.length}`);
      console.log('\nChecking data format...');
      
      if (players.length > 0) {
        const player = players[0];
        console.log('\nFirst player structure:');
        console.log(`  id: ${player.id ? '✓' : '✗'} (${typeof player.id})`);
        console.log(`  email: ${player.email ? '✓' : '✗'} (${typeof player.email})`);
        console.log(`  cellphone: ${player.cellphone ? '✓' : '✗'} (${typeof player.cellphone})`);
        
        console.log('\nExpected by User interface:');
        console.log('  id: string (required)');
        console.log('  email?: string (optional)');
        console.log('  cellphone?: string (optional)');
        
        const hasRequired = player.id !== undefined && player.id !== null;
        const hasOptionals = (player.email !== undefined && player.email !== null) || 
                            (player.cellphone !== undefined && player.cellphone !== null);
        
        if (hasRequired) {
          console.log('\n✅ Player data matches User interface!');
        } else {
          console.log('\n⚠️ Player data missing required fields');
        }
      }
      
      console.log('\nAll players with email/cellphone:');
      players.slice(0, 8).forEach((p, i) => {
        const display = p.email || p.cellphone || p.id;
        console.log(`  [${i+1}] ${display}`);
      });
      
    } catch (e) {
      console.error('Failed to parse:', e.message);
    }
  });
}).on('error', err => console.error('Request error:', err));
