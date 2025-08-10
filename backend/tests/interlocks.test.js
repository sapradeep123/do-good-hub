/**
 * Automated Test Suite for NGO↔Package↔Vendor Interlocks
 * 
 * Tests the complete business logic:
 * - Package ↔ NGO many-to-many via package_assignments
 * - Vendor linked to specific (NGO, Package) via vendor_package_assignments
 * - Copy Package with optional vendor links
 * - Role-based visibility for Admin, NGO_User, Vendor_User
 * 
 * Usage:
 * 1. Ensure backend is running on localhost:3001
 * 2. Run: node backend/tests/interlocks.test.js
 */

const request = require('supertest');
const { seedInterlocksTestData } = require('../seedinterlockstestdata');
const path = require('path');

// Load test IDs from JSON file
let ids;
try {
  ids = require('./interlocks.ids.json');
  console.log('📄 Loaded test IDs from interlocks.ids.json:');
  console.log(`  - NGO 11 (Helping Hands): ${ids.ngoId11}`);
  console.log(`  - NGO 12 (Care Trust): ${ids.ngoId12}`);
  console.log(`  - Vendor 21 (Swift Logistics): ${ids.vendorId21}`);
  console.log(`  - Vendor 22 (City Couriers): ${ids.vendorId22}`);
  console.log(`  - Package 42 (Education Kit): ${ids.packageId42}`);
  console.log(`  - Assignment ID: ${ids.assignmentId}`);
  console.log('');
} catch (error) {
  console.error('❌ Failed to load interlocks.ids.json. Run the seed script first:');
  console.error('   npm run seed:interlocks');
  process.exit(1);
}

const BASE_URL = process.env.TEST_API_BASE || 'http://localhost:3001';

let testResults = [];

// Mock authentication middleware for testing
const mockAuth = (role, userId) => ({
  user: { id: userId, role: role }
});

async function runTest(testName, testFn) {
  try {
    console.log(`🧪 Running: ${testName}`);
    await testFn();
    console.log(`✅ PASS: ${testName}`);
    testResults.push({ name: testName, status: 'PASS' });
  } catch (error) {
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.push({ name: testName, status: 'FAIL', error: error.message });
  }
}

async function testGetPackage() {
  const response = await request(BASE_URL)
    .get(`/api/packages/${ids.packageId42}`)
    .set('x-dev-role', 'admin')
    .set('x-dev-user-id', '1')
    .expect(200);

  const data = response.body.data;
  
  if (data.title !== 'Education Kit') {
    throw new Error(`Expected title 'Education Kit', got '${data.title}'`);
  }
  
  if (!data.assignments || data.assignments.length === 0) {
    throw new Error('Expected assignments array');
  }
  
  const assignment = data.assignments[0];
  if (assignment.ngo_id !== ids.ngoId11 || assignment.ngo_name !== 'Helping Hands') {
    throw new Error(`Expected NGO ${ids.ngoId11} 'Helping Hands', got ${assignment.ngo_id} '${assignment.ngo_name}'`);
  }
  
  if (!assignment.vendor_package_vendors || !assignment.vendor_package_vendors.includes(ids.vendorId21)) {
    throw new Error(`Expected vendor ${ids.vendorId21} in vendor_package_vendors`);
  }
}

async function testAssignNGO() {
  // First assignment should succeed
  await request(BASE_URL)
    .post(`/api/packages/${ids.packageId42}/assign-ngo`)
    .set('x-dev-role', 'admin')
    .set('x-dev-user-id', '1')
    .send({ ngoId: ids.ngoId12 })
    .expect(200);

  // Duplicate assignment should fail
  await request(BASE_URL)
    .post(`/api/packages/${ids.packageId42}/assign-ngo`)
    .set('x-dev-role', 'admin')
    .set('x-dev-user-id', '1')
    .send({ ngoId: ids.ngoId12 })
    .expect(409);
}

async function testAssignVendor() {
  // First assignment should succeed
  await request(BASE_URL)
    .post(`/api/packages/${ids.packageId42}/assign-vendor`)
    .set('x-dev-role', 'admin')
    .set('x-dev-user-id', '1')
    .send({ ngoId: ids.ngoId12, vendorId: ids.vendorId22 })
    .expect(200);

  // Duplicate assignment should fail
  await request(BASE_URL)
    .post(`/api/packages/${ids.packageId42}/assign-vendor`)
    .set('x-dev-role', 'admin')
    .set('x-dev-user-id', '1')
    .send({ ngoId: ids.ngoId12, vendorId: ids.vendorId22 })
    .expect(409);
}

async function testCopyPackageWithVendors() {
  const response = await request(BASE_URL)
    .post(`/api/packages/${ids.packageId42}/copy`)
    .set('x-dev-role', 'admin')
    .set('x-dev-user-id', '1')
    .send({ includeVendors: true })
    .expect(200);

  const data = response.body.data;
  
  if (!data.title.includes('(Copy)')) {
    throw new Error('Expected copied package title to include "(Copy)"');
  }
  
  if (!data.assigned_ngos || data.assigned_ngos.length === 0) {
    throw new Error('Expected NGO assignments in copied package');
  }
  
  if (!data.assigned_vendors || data.assigned_vendors.length === 0) {
    throw new Error('Expected vendor assignments in copied package');
  }
}

async function testCopyPackageWithoutVendors() {
  const response = await request(BASE_URL)
    .post(`/api/packages/${ids.packageId42}/copy`)
    .set('x-dev-role', 'admin')
    .set('x-dev-user-id', '1')
    .send({ includeVendors: false })
    .expect(200);

  const data = response.body.data;
  
  if (!data.title.includes('(Copy)')) {
    throw new Error('Expected copied package title to include "(Copy)"');
  }
  
  if (!data.assigned_ngos || data.assigned_ngos.length === 0) {
    throw new Error('Expected NGO assignments in copied package');
  }
  
  if (data.assigned_vendors && data.assigned_vendors.length > 0) {
    throw new Error('Expected NO vendor assignments in copied package');
  }
}

async function testGetNGO() {
  const response = await request(BASE_URL)
    .get(`/api/ngos/${ids.ngoId11}`)
    .set('x-dev-role', 'ngo')
    .set('x-dev-user-id', '2')
    .set('x-dev-ngo-id', ids.ngoId11)
    .expect(200);

  const data = response.body.data;
  
  if (data.name !== 'Helping Hands') {
    throw new Error(`Expected NGO name 'Helping Hands', got '${data.name}'`);
  }
  
  if (!data.packages || data.packages.length === 0) {
    throw new Error('Expected packages array');
  }
  
  const package = data.packages[0];
  if (package.id !== ids.packageId42 || package.title !== 'Education Kit') {
    throw new Error(`Expected package ${ids.packageId42} 'Education Kit', got ${package.id} '${package.title}'`);
  }
  
  if (!package.vendor_ids || !package.vendor_ids.includes(ids.vendorId21)) {
    throw new Error(`Expected vendor ${ids.vendorId21} in vendor_ids`);
  }
}

async function testGetVendor() {
  const response = await request(BASE_URL)
    .get(`/api/vendors/${ids.vendorId21}`)
    .set('x-dev-role', 'vendor')
    .set('x-dev-user-id', '3')
    .set('x-dev-vendor-id', ids.vendorId21)
    .expect(200);

  const data = response.body.data;
  
  if (data.company_name !== 'Swift Logistics') {
    throw new Error(`Expected vendor name 'Swift Logistics', got '${data.company_name}'`);
  }
  
  if (!data.served_pairs || data.served_pairs.length === 0) {
    throw new Error('Expected served_pairs array');
  }
  
  const pair = data.served_pairs[0];
  if (pair.package_id !== ids.packageId42 || pair.ngo_id !== ids.ngoId11) {
    throw new Error(`Expected package ${ids.packageId42}, NGO ${ids.ngoId11}, got package ${pair.package_id}, NGO ${pair.ngo_id}`);
  }
}

async function testRBACNGOUser() {
  const response = await request(BASE_URL)
    .get(`/api/packages/${ids.packageId42}`)
    .set('x-dev-role', 'ngo')
    .set('x-dev-user-id', '2')
    .set('x-dev-ngo-id', ids.ngoId11)
    .expect(200);

  const data = response.body.data;
  
  // NGO user should only see their NGO's assignments
  if (!data.assignments || data.assignments.length === 0) {
    throw new Error('Expected assignments for NGO user');
  }
  
  const assignment = data.assignments[0];
  if (assignment.ngo_id !== ids.ngoId11) {
    throw new Error(`Expected only NGO ${ids.ngoId11} assignments, got ${assignment.ngo_id}`);
  }
}

async function testRBACVendorUser() {
  const response = await request(BASE_URL)
    .get(`/api/packages/${ids.packageId42}`)
    .set('x-dev-role', 'vendor')
    .set('x-dev-user-id', '3')
    .set('x-dev-vendor-id', ids.vendorId21)
    .expect(200);

  const data = response.body.data;
  
  // Vendor user should only see their vendor assignments
  if (!data.assignments || data.assignments.length === 0) {
    throw new Error('Expected assignments for vendor user');
  }
  
  const assignment = data.assignments[0];
  if (!assignment.vendor_package_vendors || !assignment.vendor_package_vendors.includes(ids.vendorId21)) {
    throw new Error(`Expected only vendor ${ids.vendorId21} assignments`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Interlocks Test Suite...');
  console.log('📊 Testing NGO↔Package↔Vendor business logic');
  console.log('');
  
  // Seed test data first
  console.log('🌱 Seeding test data...');
  await seedInterlocksTestData();
  console.log('✅ Test data seeded successfully!');
  console.log('');
  
  // Run all tests
  await runTest(`GET /api/packages/${ids.packageId42} - Verify package with assignments`, testGetPackage);
  await runTest(`POST /api/packages/${ids.packageId42}/assign-ngo - Assign NGO (200 then 409)`, testAssignNGO);
  await runTest(`POST /api/packages/${ids.packageId42}/assign-vendor - Assign Vendor (200 then 409)`, testAssignVendor);
  await runTest(`POST /api/packages/${ids.packageId42}/copy - Copy with vendors`, testCopyPackageWithVendors);
  await runTest(`POST /api/packages/${ids.packageId42}/copy - Copy without vendors`, testCopyPackageWithoutVendors);
  await runTest(`GET /api/ngos/${ids.ngoId11} - Verify NGO with packages and vendors`, testGetNGO);
  await runTest(`GET /api/vendors/${ids.vendorId21} - Verify vendor with (NGO,Package) pairs`, testGetVendor);
  await runTest('RBAC - NGO User sees only their NGO assignments', testRBACNGOUser);
  await runTest('RBAC - Vendor User sees only their vendor assignments', testRBACVendorUser);
  
  // Print summary
  console.log('');
  console.log('📋 Test Summary:');
  console.log('================');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  
  testResults.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('');
  console.log(`📊 Results: ${passed} PASS, ${failed} FAIL`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! NGO↔Package↔Vendor logic is working correctly.');
  } else {
    console.log('💥 Some tests failed. Check the errors above.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('🏁 Test suite completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
