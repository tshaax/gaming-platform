// Using built-in fetch (Node.js 18+)

const API_URL = 'http://localhost:8080';

async function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT');
  const decoded = JSON.parse(
    Buffer.from(parts[1], 'base64').toString()
  );
  return decoded;
}

async function test() {
  console.log('=== Testing Capture Results Fix ===\n');

  try {
    const cashierAuthRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cashier@playground.com',
        password: 'cashier123'
      })
    });
    const cashierAuthData = await cashierAuthRes.json();
    const cashierToken = cashierAuthData.data.accessToken;
    const cashierPayload = await decodeJWT(cashierToken);
    const storeId = cashierPayload.storeId;

    const gamerAuthRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'gamer@playground.com',
        password: 'gamer123'
      })
    });
    const gamerAuthData = await gamerAuthRes.json();
    const gamerPayload = await decodeJWT(gamerAuthData.data.accessToken);
    const gamerId = gamerPayload.sub;

    const stationsRes = await fetch(
      `${API_URL}/api/gaming-sessions/stations/${storeId}`,
      { headers: { 'Authorization': `Bearer ${cashierToken}` } }
    );
    const stationsData = await stationsRes.json();
    const stationId = stationsData.data[0].id;

    const createSessionRes = await fetch(`${API_URL}/api/gaming-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cashierToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: gamerId,
        stationId: stationId,
        durationMins: 60,
        ratePerHour: '25.00'
      })
    });
    const sessionId = (await createSessionRes.json()).data.id;
    console.log(`Created session: ${sessionId}\n`);

    const resultRes = await fetch(
      `${API_URL}/api/gaming-sessions/${sessionId}/results`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cashierToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game: 'Chess',
          score: 100,
          gameType: 'vs',
          opponentUserId: gamerId,
          player1Score: 100,
          player2Score: 80,
          winner: 'player1'
        })
      }
    );

    const resultData = await resultRes.json();

    if (!resultData.data) {
      console.log('❌ Failed:', resultData.error);
      process.exit(1);
    }

    const result = resultData.data;
    console.log('Saved Result:');
    console.log(`  game Type: ${result.gameType} ✅`);
    console.log(`  opponent: ${result.opponentUserId === gamerId ? '✅' : '❌'}`);
    console.log(`  player1Score: ${result.player1Score} ✅`);
    console.log(`  player2Score: ${result.player2Score} ✅`);
    console.log(`  winner: ${result.winner} ✅`);
    console.log(`  score: ${result.score} ✅`);

    if (result.gameType === 'vs' && result.player1Score === 100) {
      console.log('\n🎉 SUCCESS: VS mode fields saved!');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
