/*
  Database de-duplication script
  - Removes duplicate package assignments for the same (package_id, ngo_id, vendor_id)
  - Merges duplicate vendors by email, then by company_name (when email is null)
  - Merges duplicate NGOs by email, then by name (when email is null)
  - Updates references in package_assignments to point to the kept records
  - Optionally enforces unique indexes on LOWER(email) for vendors and NGOs
*/

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'do_good_hub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres@123',
});

function groupRowsBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const k = row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  }
  return map;
}

async function dedupeAssignments(client) {
  console.log('\n➡️  Removing duplicate package_assignments...');
  const res = await client.query(`
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY package_id, ngo_id, vendor_id
               ORDER BY created_at ASC, id ASC
             ) AS rn
      FROM package_assignments
    )
    DELETE FROM package_assignments pa
    USING ranked r
    WHERE pa.id = r.id AND r.rn > 1
    RETURNING pa.id;
  `);
  console.log(`   - Deleted ${res.rowCount} duplicate assignment rows`);
}

async function mergeDuplicatesByKey(client, table, keyExpr, label) {
  console.log(`\n➡️  Merging duplicate ${label} by ${keyExpr}...`);
  const rows = await client.query(
    `SELECT ${keyExpr} AS k,
            (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] AS keep_id,
            ARRAY_AGG(id ORDER BY created_at ASC, id ASC) AS ids
       FROM ${table}
      WHERE ${keyExpr} IS NOT NULL
   GROUP BY ${keyExpr}
     HAVING COUNT(*) > 1`
  );
  let totalUpdated = 0;
  let totalDeleted = 0;
  for (const row of rows.rows) {
    const keepId = row.keep_id;
    const ids = row.ids.filter((id) => id !== keepId);
    if (ids.length === 0) continue;
    // Repoint references in package_assignments
    if (table === 'vendors') {
      const u = await client.query(
        'UPDATE package_assignments SET vendor_id = $1 WHERE vendor_id = ANY($2::uuid[])',
        [keepId, ids]
      );
      totalUpdated += u.rowCount;
    } else if (table === 'ngos') {
      const u = await client.query(
        'UPDATE package_assignments SET ngo_id = $1 WHERE ngo_id = ANY($2::uuid[])',
        [keepId, ids]
      );
      totalUpdated += u.rowCount;
    }
    // Delete duplicates
    const d = await client.query(`DELETE FROM ${table} WHERE id = ANY($1::uuid[])`, [ids]);
    totalDeleted += d.rowCount;
  }
  console.log(`   - Updated ${totalUpdated} references and deleted ${totalDeleted} duplicate rows`);
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('🧹 Starting de-duplication...');
    await client.query('BEGIN');

    // Step 1: Remove incomplete assignments (vendor_id NULL)
    console.log('\n➡️  Deleting incomplete assignments (vendor_id IS NULL)...');
    const delIncomplete = await client.query(
      'DELETE FROM package_assignments WHERE vendor_id IS NULL RETURNING id'
    );
    console.log(`   - Deleted ${delIncomplete.rowCount} incomplete assignments`);

    // Step 2: Merge vendor duplicates by LOWER(email), then by LOWER(company_name) when email is NULL
    await mergeDuplicatesByKey(client, 'vendors', 'LOWER(email)', 'vendors (email)');
    await mergeDuplicatesByKey(client, 'vendors', "CASE WHEN email IS NULL OR email = '' THEN LOWER(company_name) ELSE NULL END", 'vendors (company_name when email null)');

    // Step 3: Merge NGO duplicates by LOWER(email), then by LOWER(name) when email is NULL
    await mergeDuplicatesByKey(client, 'ngos', 'LOWER(email)', 'ngos (email)');
    await mergeDuplicatesByKey(client, 'ngos', "CASE WHEN email IS NULL OR email = '' THEN LOWER(name) ELSE NULL END", 'ngos (name when email null)');

    // Step 4: Remove duplicate package assignments per (package_id, ngo_id, vendor_id)
    await dedupeAssignments(client);

    // Step 5: Enforce unique constraints going forward (optional, will fail harmlessly if duplicates remain)
    console.log('\n➡️  Ensuring unique indexes on emails...');
    await client.query(`
      DO $$ BEGIN
        BEGIN
          CREATE UNIQUE INDEX IF NOT EXISTS uniq_vendors_email ON public.vendors ((LOWER(email))) WHERE email IS NOT NULL AND email <> '';
        EXCEPTION WHEN others THEN NULL; END;
        BEGIN
          CREATE UNIQUE INDEX IF NOT EXISTS uniq_ngos_email ON public.ngos ((LOWER(email))) WHERE email IS NOT NULL AND email <> '';
        EXCEPTION WHEN others THEN NULL; END;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('\n✅ De-duplication complete.');

    // Show summary snapshot
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM vendors) AS vendor_count,
        (SELECT COUNT(*) FROM ngos) AS ngo_count,
        (SELECT COUNT(*) FROM package_assignments) AS assignment_count
    `);
    console.table(summary.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during de-duplication:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();


