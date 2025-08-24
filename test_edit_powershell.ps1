# PowerShell script to test NGO and Vendor edit functionality
# This script tests the data persistence issue that was reported.

Write-Host "🚀 Starting Admin Panel Edit Functionality Test" -ForegroundColor Green
Write-Host "=" * 50

# Configuration
$BASE_URL = "http://localhost:8000"
$ADMIN_EMAIL = "admin@dogoodhub.com"
$ADMIN_PASSWORD = "password"

# Function to get admin token
function Get-AdminToken {
    try {
        Write-Host "🔐 Authenticating as admin..." -ForegroundColor Yellow
        
        $body = @{
            email = $ADMIN_EMAIL
            password = $ADMIN_PASSWORD
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $body -ContentType 'application/json'
        
        if ($response.success) {
            Write-Host "✅ Admin authentication successful" -ForegroundColor Green
            return $response.data.access_token
        } else {
            Write-Host "❌ Failed to authenticate as admin" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "❌ Error during admin login: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Function to test NGO edit functionality
function Test-NGOEdit {
    param([string]$token)
    
    Write-Host "`n🔍 Testing NGO Edit Functionality..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            'Authorization' = "Bearer $token"
        }
        
        # Get list of NGOs
        $ngos = Invoke-RestMethod -Uri "$BASE_URL/api/admin/ngos" -Method GET -Headers $headers
        
        if ($ngos.Count -eq 0) {
            Write-Host "❌ No NGOs found to test edit functionality" -ForegroundColor Red
            return $false
        }
        
        # Test editing the first NGO
        $ngo = $ngos[0]
        $ngoId = $ngo.id
        $originalName = $ngo.name
        
        Write-Host "📝 Testing edit for NGO: $originalName (ID: $ngoId)" -ForegroundColor Cyan
        
        # Update NGO data
        $testName = "Updated NGO - $(Get-Date -Format 'HH:mm:ss')"
        $updateData = @{
            name = $testName
            description = "Updated description for testing"
            mission = "Updated mission statement"
            phone = "+1234567890"
            website = "https://updated-website.com"
        } | ConvertTo-Json
        
        # Send PUT request
        $updateHeaders = @{
            'Authorization' = "Bearer $token"
            'Content-Type' = 'application/json'
        }
        
        $updateResponse = Invoke-RestMethod -Uri "$BASE_URL/api/admin/ngos/$ngoId" -Method PUT -Body $updateData -Headers $updateHeaders
        
        if ($updateResponse.success) {
            Write-Host "✅ NGO update request successful" -ForegroundColor Green
            
            # Verify the update by fetching the NGO again
            Start-Sleep -Seconds 1
            $updatedNgo = Invoke-RestMethod -Uri "$BASE_URL/api/admin/ngos/$ngoId" -Method GET -Headers $headers
            
            if ($updatedNgo.name -eq $testName) {
                Write-Host "✅ NGO data persistence verified - Name updated to: $testName" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ NGO data not persisted - Expected: $testName, Got: $($updatedNgo.name)" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "❌ NGO update failed" -ForegroundColor Red
            return $false
        }
        
    } catch {
        Write-Host "❌ Error during NGO edit test: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test Vendor edit functionality
function Test-VendorEdit {
    param([string]$token)
    
    Write-Host "`n🔍 Testing Vendor Edit Functionality..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            'Authorization' = "Bearer $token"
        }
        
        # Get list of Vendors
        $vendors = Invoke-RestMethod -Uri "$BASE_URL/api/admin/vendors" -Method GET -Headers $headers
        
        if ($vendors.Count -eq 0) {
            Write-Host "❌ No Vendors found to test edit functionality" -ForegroundColor Red
            return $false
        }
        
        # Test editing the first Vendor
        $vendor = $vendors[0]
        $vendorId = $vendor.id
        $originalName = if ($vendor.shop_name) { $vendor.shop_name } else { $vendor.company_name }
        
        Write-Host "📝 Testing edit for Vendor: $originalName (ID: $vendorId)" -ForegroundColor Cyan
        
        # Update Vendor data
        $testCompanyName = "Updated Vendor - $(Get-Date -Format 'HH:mm:ss')"
        $updateData = @{
            company_name = $testCompanyName
            contact_person = "Updated Contact Person"
            phone = "+1987654321"
            address = "Updated Address for Testing"
        } | ConvertTo-Json
        
        # Send PUT request
        $updateHeaders = @{
            'Authorization' = "Bearer $token"
            'Content-Type' = 'application/json'
        }
        
        $updateResponse = Invoke-RestMethod -Uri "$BASE_URL/api/admin/vendors/$vendorId" -Method PUT -Body $updateData -Headers $updateHeaders
        
        if ($updateResponse.success) {
            Write-Host "✅ Vendor update request successful" -ForegroundColor Green
            
            # Verify the update by fetching vendors again
            Start-Sleep -Seconds 1
            $updatedVendors = Invoke-RestMethod -Uri "$BASE_URL/api/admin/vendors" -Method GET -Headers $headers
            $updatedVendor = $updatedVendors | Where-Object { $_.id -eq $vendorId }
            
            if ($updatedVendor) {
                $vendorName = if ($updatedVendor.shop_name) { $updatedVendor.shop_name } else { $updatedVendor.company_name }
                if ($vendorName -like "*Updated Vendor*" -or $vendorName -eq $testCompanyName) {
                    Write-Host "✅ Vendor data persistence verified - Company name updated" -ForegroundColor Green
                    return $true
                } else {
                    Write-Host "❌ Vendor data not persisted - Expected: $testCompanyName, Got: $vendorName" -ForegroundColor Red
                    return $false
                }
            } else {
                Write-Host "❌ Updated vendor not found in list" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "❌ Vendor update failed" -ForegroundColor Red
            return $false
        }
        
    } catch {
        Write-Host "❌ Error during Vendor edit test: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
$token = Get-AdminToken
if (-not $token) {
    Write-Host "❌ Failed to authenticate as admin. Exiting." -ForegroundColor Red
    exit 1
}

# Test NGO edit functionality
$ngoTestPassed = Test-NGOEdit -token $token

# Test Vendor edit functionality
$vendorTestPassed = Test-VendorEdit -token $token

# Summary
Write-Host "`n" + "=" * 50
Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 50

if ($ngoTestPassed) {
    Write-Host "NGO Edit Functionality: ✅ PASSED" -ForegroundColor Green
} else {
    Write-Host "NGO Edit Functionality: ❌ FAILED" -ForegroundColor Red
}

if ($vendorTestPassed) {
    Write-Host "Vendor Edit Functionality: ✅ PASSED" -ForegroundColor Green
} else {
    Write-Host "Vendor Edit Functionality: ❌ FAILED" -ForegroundColor Red
}

if ($ngoTestPassed -and $vendorTestPassed) {
    Write-Host "`n🎉 ALL TESTS PASSED! Data persistence issue has been resolved." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Some tests failed. Data persistence issue may still exist." -ForegroundColor Yellow
    exit 1
}