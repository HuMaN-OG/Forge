// backend/tests/test-all.js
const { spawnSync } = require('node:child_process');
const path = require('node:path');

console.log('====================================================');
console.log('       FORGE AI BACKEND - FULL TEST RUNNER          ');
console.log('====================================================\n');

console.log('Step 1: Running Unit & Persistence Tests...');
const unitRes = spawnSync(process.execPath, [path.join(__dirname, 'test-unit.js')], { stdio: 'inherit' });
if (unitRes.status !== 0) {
  console.error('\n✖ Unit tests failed.');
  process.exit(unitRes.status || 1);
}

console.log('\nStep 2: Running Authenticated Backend-to-Python Integration Tests (Contract v1.0)...');
const authRes = spawnSync(process.execPath, [path.join(__dirname, 'test-authenticated-integration.js')], { stdio: 'inherit' });
if (authRes.status !== 0) {
  console.error('\n✖ Authenticated integration tests failed.');
  process.exit(authRes.status || 1);
}

console.log('\nStep 3: Running API Integration Tests (Ollama + SQLite + Express)...');
const apiRes = spawnSync(process.execPath, [path.join(__dirname, 'test-api.js')], { stdio: 'inherit' });
if (apiRes.status !== 0) {
  console.error('\n✖ API integration tests failed.');
  process.exit(apiRes.status || 1);
}

console.log('\n====================================================');
console.log('   ALL FORGE AI BACKEND TEST SUITES PASSED 100%!    ');
console.log('====================================================');
