# Interlocks Testing Guide

## 🎯 Overview

This testing setup verifies the complete NGO↔Package↔Vendor business logic:

- **Package ↔ NGO many-to-many** via `package_assignments`
- **Vendor linked to specific (NGO, Package)** via `vendor_package_assignments`
- **Copy Package** with optional vendor links
- **Role-based visibility** for Admin, NGO_User, Vendor_User

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Migration
```bash
npm run migrate
```

### 3. Start Backend
```bash
npm run dev
```

### 4. Run Tests
```bash
# In a new terminal
npm run test:interlocks
```

## 📁 Files

- **`seedinterlockstestdata.js`** - Fixed ID seed script
- **`tests/interlocks.test.js`** - Automated test suite
- **`INTERLOCKS_TESTING.md`** - This guide

## 🧪 Test Scenarios

### Fixed IDs Used:
- **Users**: 1 (admin), 2 (ngo), 3 (vendor)
- **NGOs**: 11 (Helping Hands), 12 (Care Trust)
- **Vendors**: 21 (Swift Logistics), 22 (City Couriers)
- **Package**: 42 (Education Kit)
- **Assignments**: 101 (Package↔NGO), 201 (Vendor↔Assignment)

### Test Flow:
1. **GET /api/packages/42** → Verify package with assignments
2. **POST /api/packages/42/assign-ngo** → Assign NGO (200 then 409)
3. **POST /api/packages/42/assign-vendor** → Assign Vendor (200 then 409)
4. **POST /api/packages/42/copy** → Copy with/without vendors
5. **GET /api/ngos/11** → Verify NGO with packages and vendors
6. **GET /api/vendors/21** → Verify vendor with (NGO,Package) pairs
7. **RBAC Tests** → Verify role-based access control

## 🔧 Manual Testing

### Seed Data Only:
```bash
npm run seed:interlocks
```

### Individual Test:
```bash
node tests/interlocks.test.js
```

## 📊 Expected Results

### ✅ Success Output:
```
🚀 Starting Interlocks Test Suite...
📊 Testing NGO↔Package↔Vendor business logic

🌱 Seeding test data...
✅ Test data seeded successfully!

🧪 Running: GET /api/packages/42 - Verify package with assignments
✅ PASS: GET /api/packages/42 - Verify package with assignments
🧪 Running: POST /api/packages/42/assign-ngo - Assign NGO (200 then 409)
✅ PASS: POST /api/packages/42/assign-ngo - Assign NGO (200 then 409)
...

📋 Test Summary:
================
✅ GET /api/packages/42 - Verify package with assignments
✅ POST /api/packages/42/assign-ngo - Assign NGO (200 then 409)
✅ POST /api/packages/42/assign-vendor - Assign Vendor (200 then 409)
✅ POST /api/packages/42/copy - Copy with vendors
✅ POST /api/packages/42/copy - Copy without vendors
✅ GET /api/ngos/11 - Verify NGO with packages and vendors
✅ GET /api/vendors/21 - Verify vendor with (NGO,Package) pairs
✅ RBAC - NGO User sees only their NGO assignments
✅ RBAC - Vendor User sees only their vendor assignments

📊 Results: 9 PASS, 0 FAIL
🎉 All tests passed! NGO↔Package↔Vendor logic is working correctly.
```

## 🐛 Troubleshooting

### Common Issues:

1. **Backend not running**: Ensure `npm run dev` is running on port 3001
2. **Database connection**: Check PostgreSQL is running and accessible
3. **Migration not run**: Run `npm run migrate` first
4. **Port conflicts**: Ensure port 3001 is available

### Debug Commands:
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check database connection
node -e "require('./dist/database/connection').default.query('SELECT 1')"

# Run seed manually
node seedinterlockstestdata.js
```

## 📝 Notes

- Tests use **fixed IDs** for deterministic results
- **Transaction-based** seeding ensures clean state
- **Mock authentication** for RBAC testing
- **Automatic cleanup** of test data between runs
- **Comprehensive coverage** of all business logic paths

## 🎯 Business Logic Verified

- ✅ **Package ↔ NGO many-to-many** relationships
- ✅ **Vendor ↔ (NGO,Package)** specific assignments
- ✅ **Copy Package** with optional vendor links
- ✅ **Role-based access control** (Admin/NGO/Vendor)
- ✅ **Duplicate protection** (409 errors)
- ✅ **Cascade operations** (unassign NGO removes vendors)
- ✅ **Data integrity** (foreign key constraints)
