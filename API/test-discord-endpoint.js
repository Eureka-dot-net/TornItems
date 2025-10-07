#!/usr/bin/env node

/**
 * Manual test script for Discord bot API endpoint
 * 
 * This script demonstrates how to use the /api/discord/setkey endpoint
 * Run with: node test-discord-endpoint.js
 */

const http = require('http');

// Test data
const testData = {
  discordId: '999888777666',
  apiKey: 'test-api-key-12345'
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/discord/setkey',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

function testEndpoint() {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\n=== Discord Bot API Test ===');
        console.log(`Status Code: ${res.statusCode}`);
        console.log('Response:', JSON.parse(data));
        console.log('===========================\n');
        
        if (res.statusCode === 200 || res.statusCode === 400) {
          resolve();
        } else {
          reject(new Error(`Unexpected status code: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      console.log('\nMake sure the server is running on port 3000');
      console.log('Run: npm start\n');
      reject(error);
    });

    req.write(JSON.stringify(testData));
    req.end();
  });
}

async function main() {
  console.log('\nTesting Discord Bot API Endpoint...');
  console.log('Sending POST request to http://localhost:3000/api/discord/setkey');
  console.log('Request body:', JSON.stringify(testData, null, 2));
  
  try {
    await testEndpoint();
    console.log('✓ Test completed successfully');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

main();
