const pool = require('./dist/database/connection').default;
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

async function seedInterlocksTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding Interlocks Test Data...');
    
    // Generate UUIDs for all entities
    const userId1 = randomUUID(); // Admin
    const userId2 = randomUUID(); // NGO User
    const userId3 = randomUUID(); // Vendor User
    const ngoId11 = randomUUID();
    const ngoId12 = randomUUID();
    const vendorId21 = randomUUID();
    const vendorId22 = randomUUID();
    const packageId42 = randomUUID();
    const assignmentId = randomUUID();
    
    // Start transaction
    await client.query('BEGIN');
    
    // Clear relevant tables in reverse dependency order
    console.log('🧹 Clearing existing test data...');
    await client.query('DELETE FROM vendor_package_assignments WHERE vendor_id IN ($1, $2)', [vendorId21, vendorId22]);
    await client.query('DELETE FROM package_assignments WHERE id IN ($1, $2)', [assignmentId, randomUUID()]);
    await client.query('DELETE FROM packages WHERE id = $1', [packageId42]);
    await client.query('DELETE FROM vendors WHERE id IN ($1, $2)', [vendorId21, vendorId22]);
    await client.query('DELETE FROM ngos WHERE id IN ($1, $2)', [ngoId11, ngoId12]);
    await client.query('DELETE FROM profiles WHERE user_id IN ($1, $2, $3)', [userId1, userId2, userId3]);
    
    // Insert test users with UUIDs
    console.log('👥 Creating test users...');
    await client.query(`
      INSERT INTO profiles (user_id, first_name, last_name, email, role) 
      VALUES 
        ($1, 'Admin', 'User', 'admin@test.com', 'admin'),
        ($2, 'NGO', 'Manager', 'ngo@test.com', 'ngo'),
        ($3, 'Vendor', 'Manager', 'vendor@test.com', 'vendor')
    `, [userId1, userId2, userId3]);
    
    // Insert test NGOs with UUIDs
    console.log('🏢 Creating test NGOs...');
    await client.query(`
      INSERT INTO ngos (id, user_id, name, description, mission, city, state, verified) 
      VALUES 
        ($1, $2, 'Helping Hands', 'A test NGO for education', 'To help people through education', 'Mumbai', 'Maharashtra', true),
        ($3, $2, 'Care Trust', 'A test NGO for healthcare', 'To provide healthcare services', 'Delhi', 'Delhi', true)
    `, [ngoId11, userId2, ngoId12]);
    
    // Insert test vendors with UUIDs
    console.log('🚚 Creating test vendors...');
    await client.query(`
      INSERT INTO vendors (id, user_id, company_name, description, city, state, verified) 
      VALUES 
        ($1, $2, 'Swift Logistics', 'Fast delivery services', 'Mumbai', 'Maharashtra', true),
        ($3, $2, 'City Couriers', 'Reliable courier services', 'Delhi', 'Delhi', true)
    `, [vendorId21, userId3, vendorId22]);
    
    // Insert test package with UUID
    console.log('📦 Creating test package...');
    await client.query(`
      INSERT INTO packages (id, ngo_id, title, description, amount, category, status) 
      VALUES ($1, $2, 'Education Kit', 'A comprehensive education package for students', 1000, 'Education', 'active')
    `, [packageId42, ngoId11]);
    
    // Create package assignment with UUID
    console.log('🔗 Creating package assignment...');
    await client.query(`
      INSERT INTO package_assignments (id, package_id, ngo_id, is_active) 
      VALUES ($1, $2, $3, true)
    `, [assignmentId, packageId42, ngoId11]);
    
    // Create vendor assignment
    console.log('🏪 Creating vendor assignment...');
    await client.query(`
      INSERT INTO vendor_package_assignments (vendor_id, package_assignment_id) 
      VALUES ($1, $2)
    `, [vendorId21, assignmentId]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Write IDs to JSON file
    const ids = {
      userId1,
      userId2,
      userId3,
      ngoId11,
      ngoId12,
      vendorId21,
      vendorId22,
      packageId42,
      assignmentId
    };
    
    const idsPath = path.join(__dirname, 'tests', 'interlocks.ids.json');
    fs.writeFileSync(idsPath, JSON.stringify(ids, null, 2));
    
    console.log('✅ Interlocks test data seeded successfully!');
    console.log('📊 Created with UUIDs:');
    console.log('  👥 Users:');
    console.log(`    - Admin: user_id=${userId1}, email=admin@test.com`);
    console.log(`    - NGO User: user_id=${userId2}, email=ngo@test.com`);
    console.log(`    - Vendor User: user_id=${userId3}, email=vendor@test.com`);
    console.log('  🏢 NGOs:');
    console.log(`    - Helping Hands: id=${ngoId11}, user_id=${userId2}`);
    console.log(`    - Care Trust: id=${ngoId12}, user_id=${userId2}`);
    console.log('  🚚 Vendors:');
    console.log(`    - Swift Logistics: id=${vendorId21}, user_id=${userId3}`);
    console.log(`    - City Couriers: id=${vendorId22}, user_id=${userId3}`);
    console.log('  📦 Package:');
    console.log(`    - Education Kit: id=${packageId42}, ngo_id=${ngoId11}`);
    console.log('  🔗 Assignments:');
    console.log(`    - Package Assignment: id=${assignmentId}, package_id=${packageId42}, ngo_id=${ngoId11}`);
    console.log(`    - Vendor Assignment: vendor_id=${vendorId21}, package_assignment_id=${assignmentId}`);
    console.log('');
    console.log(`📄 IDs saved to: ${idsPath}`);
    console.log('🧪 Ready for testing! Run: node backend/tests/interlocks.test.js');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedInterlocksTestData()
    .then(() => {
      console.log('🎉 Seed script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedInterlocksTestData };
