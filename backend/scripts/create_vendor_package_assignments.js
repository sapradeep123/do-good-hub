// backend/scripts/create_vendor_package_assignments.js
/* eslint-disable @typescript-eslint/no-var-requires */
const pool = require('../dist/database/connection').default;

async function createVendorPackageAssignmentsTable() {
  const client = await pool.connect();
  try {
    console.log('🔧 (Re)creating vendor_package_assignments table...');

    await client.query('BEGIN');

    // If it exists with wrong types, drop and recreate
    await client.query(`
      DROP TABLE IF EXISTS vendor_package_assignments CASCADE;
    `);

    await client.query(`
      CREATE TABLE vendor_package_assignments (
        id BIGSERIAL PRIMARY KEY,
        vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        package_assignment_id UUID NOT NULL REFERENCES package_assignments(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (vendor_id, package_assignment_id)
      );
    `);

    await client.query('COMMIT');

    console.log('✅ vendor_package_assignments created with UUID FKs.');
    console.log('   - vendor_id -> vendors.id (UUID)');
    console.log('   - package_assignment_id -> package_assignments.id (UUID)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating vendor_package_assignments table:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  createVendorPackageAssignmentsTable()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Script failed:', err);
      process.exit(1);
    });
}

module.exports = { createVendorPackageAssignmentsTable };
