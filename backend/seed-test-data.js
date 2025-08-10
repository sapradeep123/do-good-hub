const pool = require('./dist/database/connection').default;

async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...');

    // Create test users
    const adminUser = await pool.query(`
      INSERT INTO profiles (user_id, first_name, last_name, email, role) 
      VALUES ('admin-1', 'Admin', 'User', 'admin@test.com', 'admin')
      RETURNING *
    `);

    const ngoUser = await pool.query(`
      INSERT INTO profiles (user_id, first_name, last_name, email, role) 
      VALUES ('ngo-1', 'NGO', 'Manager', 'ngo@test.com', 'ngo')
      RETURNING *
    `);

    const vendorUser = await pool.query(`
      INSERT INTO profiles (user_id, first_name, last_name, email, role) 
      VALUES ('vendor-1', 'Vendor', 'Manager', 'vendor@test.com', 'vendor')
      RETURNING *
    `);

    // Create test NGO
    const ngo = await pool.query(`
      INSERT INTO ngos (user_id, name, description, mission, location, category, is_active) 
      VALUES ($1, 'Test NGO', 'A test NGO for demonstration', 'To help people', 'Mumbai', 'Education', true)
      RETURNING *
    `, [ngoUser.rows[0].user_id]);

    // Create test vendor
    const vendor = await pool.query(`
      INSERT INTO vendors (user_id, company_name, contact_person, email, phone, description, is_active) 
      VALUES ($1, 'Test Vendor', 'John Doe', 'john@testvendor.com', '+1234567890', 'A test vendor for demonstration', true)
      RETURNING *
    `, [vendorUser.rows[0].user_id]);

    // Create test package
    const package = await pool.query(`
      INSERT INTO packages (ngo_id, title, description, amount, category, is_active) 
      VALUES ($1, 'Test Package', 'A test package for demonstration', 1000, 'Education', true)
      RETURNING *
    `, [ngo.rows[0].id]);

    // Create package assignment
    const assignment = await pool.query(`
      INSERT INTO package_assignments (package_id, ngo_id, is_active) 
      VALUES ($1, $2, true)
      RETURNING *
    `, [package.rows[0].id, ngo.rows[0].id]);

    // Create vendor assignment
    await pool.query(`
      INSERT INTO vendor_package_assignments (vendor_id, package_assignment_id) 
      VALUES ($1, $2)
    `, [vendor.rows[0].id, assignment.rows[0].id]);

    console.log('✅ Test data seeded successfully!');
    console.log('📊 Created:');
    console.log(`  - Admin user: ${adminUser.rows[0].email}`);
    console.log(`  - NGO: ${ngo.rows[0].name} (${ngo.rows[0].email})`);
    console.log(`  - Vendor: ${vendor.rows[0].company_name} (${vendor.rows[0].email})`);
    console.log(`  - Package: ${package.rows[0].title} (₹${package.rows[0].amount})`);
    console.log(`  - Assignment: Package ↔ NGO`);
    console.log(`  - Vendor Assignment: Vendor ↔ (NGO,Package)`);

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    await pool.end();
  }
}

seedTestData();
