# Testing Guide - Package Management with Assignments

## 🚀 Quick Setup

### 1. Run Migration
```bash
cd backend
npm run migrate
```

### 2. Seed Test Data
```bash
node seed-test-data.js
```

### 3. Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

## 🧪 Test Scenarios

### **Scenario 1: Create Package → Assign NGOs → Add Vendors**

1. **Login as Admin**: Go to `http://localhost:8080/auth` and login with `admin@test.com`
2. **Create Package**: 
   - Go to Package Management tab
   - Click "Create Package"
   - Fill: Title="Education Kit", Amount=500, Category="Education"
   - Click "Create"

3. **Assign NGOs**:
   - Click the "🔗" (Link) button on the new package
   - Check "Test NGO" 
   - Click "Assign"

4. **Add Vendors**:
   - Click the "👁️" (Eye) button to view details
   - In the assignment section, select "Test Vendor" from dropdown
   - Click "Assign NGO" to add vendor to that NGO

### **Scenario 2: Copy Package with Vendor Links**

1. **Copy with Vendors**:
   - Click the "📋" (Copy) button on the package
   - Check "Include vendor assignments in the copy"
   - Modify title to "Education Kit (Copy)"
   - Click "Duplicate"

2. **Verify Copy**:
   - Check that the new package has the same NGO and vendor assignments
   - Title should be "Education Kit (Copy)"

### **Scenario 3: Copy Package without Vendor Links**

1. **Copy without Vendors**:
   - Click "📋" (Copy) on the original package
   - **Uncheck** "Include vendor assignments in the copy"
   - Click "Duplicate"

2. **Verify Copy**:
   - Check that the new package has NGO assignments but NO vendor assignments

### **Scenario 4: Role-Based Access**

1. **NGO User Access**:
   - Login with `ngo@test.com`
   - Should only see packages assigned to their NGO
   - No edit buttons visible

2. **Vendor User Access**:
   - Login with `vendor@test.com`
   - Should only see (NGO,Package) pairs they serve
   - No edit buttons visible

## 📊 Expected API Responses

### GET `/api/packages/:id`
```json
{
  "success": true,
  "data": {
    "id": "package-id",
    "title": "Education Kit",
    "amount": 500,
    "assignments": [
      {
        "assignment_id": "assignment-id",
        "ngo_id": "ngo-id",
        "ngo_name": "Test NGO",
        "vendor_package_vendors": ["vendor-id"]
      }
    ]
  }
}
```

### GET `/api/ngos/:id`
```json
{
  "success": true,
  "data": {
    "id": "ngo-id",
    "name": "Test NGO",
    "packages": [
      {
        "id": "package-id",
        "title": "Education Kit",
        "vendor_ids": ["vendor-id"],
        "vendor_names": ["Test Vendor"]
      }
    ]
  }
}
```

### GET `/api/vendors/:id`
```json
{
  "success": true,
  "data": {
    "id": "vendor-id",
    "company_name": "Test Vendor",
    "served_pairs": [
      {
        "package_id": "package-id",
        "package_title": "Education Kit",
        "ngo_id": "ngo-id",
        "ngo_name": "Test NGO"
      }
    ]
  }
}
```

## 🔧 Troubleshooting

### Common Issues:

1. **"NGO already assigned" error**: This is expected - the NGO is already linked
2. **"Vendor already assigned" error**: This is expected - the vendor is already linked to that NGO-Package
3. **Blank page**: Check browser console for errors, ensure backend is running
4. **Permission errors**: Make sure you're logged in with correct role

### Debug Commands:

```bash
# Check if backend is running
curl http://localhost:3001/health

# Check packages endpoint
curl http://localhost:3001/api/packages

# Check database connection
cd backend
node -e "require('./dist/database/connection').default.query('SELECT 1')"
```

## ✅ Success Checklist

- [ ] Create package → assign 2 NGOs → add different vendors under each NGO
- [ ] Copy Package with vendor links → verify all links copied
- [ ] Copy Package without vendor links → only NGO links copied
- [ ] NGO_User sees only their NGO's packages + vendors; no edit buttons
- [ ] Vendor_User sees only their (NGO,Package) pairs

## 📝 Notes

- The `packages.ngo_id` field is treated as legacy/read-only
- All new logic uses `package_assignments` and `vendor_package_assignments` tables
- Role-based filtering happens at the API level
- Frontend automatically refreshes after assignments to show updated data
