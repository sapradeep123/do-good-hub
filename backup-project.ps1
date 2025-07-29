# Do Good Hub - Project Backup Script
# This script creates a backup of all important project files

Write-Host "🔧 Creating Do Good Hub Project Backup..." -ForegroundColor Green

# Create backup directory with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "do-good-hub-backup_$timestamp"

Write-Host "📁 Creating backup directory: $backupDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Copy important directories
Write-Host "📦 Copying project files..." -ForegroundColor Yellow

# Copy backend
if (Test-Path "backend") {
    Copy-Item -Path "backend" -Destination "$backupDir/backend" -Recurse -Force
    Write-Host "✅ Backend copied" -ForegroundColor Green
}

# Copy frontend source
if (Test-Path "src") {
    Copy-Item -Path "src" -Destination "$backupDir/src" -Recurse -Force
    Write-Host "✅ Frontend source copied" -ForegroundColor Green
}

# Copy important configuration files
$configFiles = @(
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tailwind.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "eslint.config.js",
    "postcss.config.js",
    "components.json",
    "docker-compose.yml",
    ".env"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "$backupDir/$file" -Force
        Write-Host "✅ $file copied" -ForegroundColor Green
    }
}

# Copy documentation files
$docFiles = @(
    "README.md",
    "MIGRATION_COMPLETE_SUMMARY.md",
    "MIGRATION_TO_POSTGRES.md"
)

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "$backupDir/$file" -Force
        Write-Host "✅ $file copied" -ForegroundColor Green
    }
}

# Create credentials file
$credentials = @"
# Do Good Hub - User Credentials
# Generated on: $(Get-Date)

## Regular User
Email: testuser2@gmail.com
Password: Password123
Role: user

## Admin User
Email: admin@dogoodhub.com
Password: Admin@123
Role: admin

## Database
Host: localhost:5432
Database: do_good_hub
User: postgres
Password: postgres@123

## Application URLs
Frontend: http://localhost:8080
Backend API: http://localhost:3001
Health Check: http://localhost:3001/health
"@

$credentials | Out-File -FilePath "$backupDir/CREDENTIALS.txt" -Encoding UTF8
Write-Host "✅ Credentials file created" -ForegroundColor Green

# Create startup instructions
$startupInstructions = @"
# Do Good Hub - Startup Instructions

## 1. Start Backend
cd backend
npm install
npm run dev

## 2. Start Frontend (in new terminal)
npm install
npm run dev

## 3. Access Application
Frontend: http://localhost:8080
Backend: http://localhost:3001

## 4. Login Credentials
Regular User: testuser2@gmail.com / Password123
Admin User: admin@dogoodhub.com / Admin@123
"@

$startupInstructions | Out-File -FilePath "$backupDir/STARTUP_INSTRUCTIONS.txt" -Encoding UTF8
Write-Host "✅ Startup instructions created" -ForegroundColor Green

Write-Host "`n🎉 Backup completed successfully!" -ForegroundColor Green
Write-Host "📁 Backup location: $backupDir" -ForegroundColor Cyan
Write-Host "📋 Files included:" -ForegroundColor Yellow
Write-Host "   - Backend (Node.js + Express)" -ForegroundColor White
Write-Host "   - Frontend (React + Vite)" -ForegroundColor White
Write-Host "   - Configuration files" -ForegroundColor White
Write-Host "   - Documentation" -ForegroundColor White
Write-Host "   - Credentials" -ForegroundColor White
Write-Host "   - Startup instructions" -ForegroundColor White

Write-Host "`n💡 To restore this backup:" -ForegroundColor Yellow
Write-Host "   1. Copy the backup folder to your desired location" -ForegroundColor White
Write-Host "   2. Follow the STARTUP_INSTRUCTIONS.txt file" -ForegroundColor White
Write-Host "   3. Make sure PostgreSQL is running" -ForegroundColor White 