#!/usr/bin/env node

/**
 * Initial Admin Setup Script
 * This script creates the initial admin user and store for the Playground system
 */

const http = require('http');
const url = require('url');

const API_URL = 'http://127.0.0.1:3333';

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@playground.local',
  password: 'Admin@123',
  role: 'admin'
};

const INITIAL_STORE = {
  name: 'Downtown Gaming Hub',
  slug: 'downtown-hub',
  address: '123 Gaming Street, Downtown',
  taxNumber: '12-3456789',
  manager: 'John Manager',
  contactPerson: 'Jane Contact',
  contactPhone: '+1-555-0100'
};

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3333,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function setupAdmin() {
  console.log('🎮 Playground Admin Setup\n');
  console.log('Starting admin user setup...\n');

  try {
    // Step 1: Create initial store
    console.log('📍 Creating initial store...');
    const storeResponse = await makeRequest('POST', '/api/stores', INITIAL_STORE);

    if (storeResponse.status !== 201 && storeResponse.status !== 200) {
      throw new Error(`Failed to create store: ${storeResponse.status} - ${JSON.stringify(storeResponse.data)}`);
    }

    const storeId = storeResponse.data.data?.id;
    if (!storeId) {
      throw new Error('No store ID returned from API');
    }

    console.log(`✅ Store created: ${storeId}\n`);

    // Step 2: Register admin user
    console.log('👤 Creating admin user...');
    const adminData = {
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      storeId: storeId,
      role: ADMIN_CREDENTIALS.role
    };

    const adminResponse = await makeRequest('POST', '/api/auth/register', adminData);

    if (adminResponse.status !== 201 && adminResponse.status !== 200) {
      throw new Error(`Failed to create admin: ${adminResponse.status} - ${JSON.stringify(adminResponse.data)}`);
    }

    console.log('✅ Admin user created\n');

    // Display credentials
    console.log('═══════════════════════════════════════════════════════');
    console.log('✨ Admin Setup Complete!\n');
    console.log('📌 Admin Credentials:');
    console.log(`   Email:    ${ADMIN_CREDENTIALS.email}`);
    console.log(`   Password: ${ADMIN_CREDENTIALS.password}`);
    console.log(`   Role:     ${ADMIN_CREDENTIALS.role}\n`);
    console.log('🏪 Initial Store:');
    console.log(`   Name:     ${INITIAL_STORE.name}`);
    console.log(`   Slug:     ${INITIAL_STORE.slug}`);
    console.log(`   Address:  ${INITIAL_STORE.address}\n`);
    console.log('🔗 Access the Admin App at: http://localhost:4200');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n⚠️  Make sure:');
    console.error('   1. The API server is running on http://localhost:3333');
    console.error('   2. PostgreSQL database is running');
    console.error('   3. Database migrations have been applied\n');
    process.exit(1);
  }
}

setupAdmin();
