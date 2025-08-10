import bcrypt from 'bcryptjs';
import pool from './connection';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const adminUser = await pool.query(`
      INSERT INTO profiles (user_id, first_name, last_name, email, password_hash, role)
      VALUES (uuid_generate_v4(), 'Admin', 'User', 'admin@dogoodhub.com', $1, 'admin')
      RETURNING id, user_id
    `, [adminPassword]);
    
    console.log('✅ Admin user created');
    
    // Create test user
    const testPassword = await bcrypt.hash('Password123', 10);
    const testUser = await pool.query(`
      INSERT INTO profiles (user_id, first_name, last_name, email, password_hash, role)
      VALUES (uuid_generate_v4(), 'Test', 'User', 'testuser2@gmail.com', $1, 'user')
      RETURNING id, user_id
    `, [testPassword]);
    
    console.log('✅ Test user created');
    
    // Create sample NGOs
    const ngo1 = await pool.query(`
      INSERT INTO ngos (user_id, name, description, mission, website, address, city, state, phone, email, verified)
      VALUES ($1, 'Hope Foundation', 'Providing education to underprivileged children', 'To ensure every child has access to quality education', 'https://hopefoundation.org', '123 Education St', 'Mumbai', 'Maharashtra', '+91-9876543210', 'info@hopefoundation.org', true)
      RETURNING id
    `, [testUser.rows[0].user_id]);
    
    const ngo2 = await pool.query(`
      INSERT INTO ngos (user_id, name, description, mission, website, address, city, state, phone, email, verified)
      VALUES ($1, 'Green Earth Initiative', 'Environmental conservation and sustainability', 'To protect and preserve our environment for future generations', 'https://greenearth.org', '456 Nature Ave', 'Delhi', 'Delhi', '+91-9876543211', 'contact@greenearth.org', true)
      RETURNING id
    `, [adminUser.rows[0].user_id]);
    
    console.log('✅ Sample NGOs created');
    
    // Create sample packages
    await pool.query(`
      INSERT INTO packages (ngo_id, title, description, amount, category, target_quantity, current_quantity, status)
      VALUES 
        ($1, 'School Supplies Package', 'Basic school supplies for 1 child for 1 year', 2500.00, 'Education', 100, 0, 'active'),
        ($1, 'Computer Lab Setup', 'Complete computer lab setup for 20 students', 50000.00, 'Education', 5, 0, 'active'),
        ($2, 'Tree Plantation Drive', 'Plant 100 trees in urban areas', 15000.00, 'Environment', 10, 0, 'active'),
        ($2, 'Solar Panel Installation', 'Install solar panels in rural schools', 75000.00, 'Environment', 3, 0, 'active')
    `, [ngo1.rows[0].id, ngo2.rows[0].id]);
    
    console.log('✅ Sample packages created');
    
    // Create sample vendors
    await pool.query(`
      INSERT INTO vendors (user_id, company_name, description, website, address, city, state, phone, email, business_type, verified)
      VALUES ($1, 'EduTech Solutions', 'Educational technology and supplies', 'https://edutech.com', '789 Tech Park', 'Bangalore', 'Karnataka', '+91-9876543212', 'sales@edutech.com', 'Technology', true)
    `, [adminUser.rows[0].user_id]);
    
    await pool.query(`
      INSERT INTO vendors (user_id, company_name, description, website, address, city, state, phone, email, business_type, verified)
      VALUES ($1, 'Green Supplies Co.', 'Eco-friendly products and materials', 'https://greensupplies.com', '321 Eco Street', 'Chennai', 'Tamil Nadu', '+91-9876543213', 'info@greensupplies.com', 'Environmental', true)
    `, [adminUser.rows[0].user_id]);
    
    console.log('✅ Sample vendors created');
    
    console.log('✅ Database seeding completed successfully!');
    
    // Show summary
    const profilesCount = await pool.query('SELECT COUNT(*) FROM profiles');
    const ngosCount = await pool.query('SELECT COUNT(*) FROM ngos');
    const packagesCount = await pool.query('SELECT COUNT(*) FROM packages');
    const vendorsCount = await pool.query('SELECT COUNT(*) FROM vendors');
    
    console.log(`📊 Database Summary:`);
    console.log(`   - Users: ${profilesCount.rows[0].count}`);
    console.log(`   - NGOs: ${ngosCount.rows[0].count}`);
    console.log(`   - Packages: ${packagesCount.rows[0].count}`);
    console.log(`   - Vendors: ${vendorsCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;