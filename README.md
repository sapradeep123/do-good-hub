# CareFund - Transparent Donation Platform

A comprehensive donation platform connecting donors with verified NGOs across India, featuring transparent tracking, package-based donations, and real-time impact reporting.

## 🚀 Features

- **Verified NGOs**: Rigorous verification process for all NGO partners
- **Package-based Donations**: Clear, defined donation packages with specific outcomes
- **Transparent Tracking**: Real-time tracking from donation to delivery
- **80G Tax Benefits**: Instant tax exemption certificates
- **Multi-role Support**: Donors, NGOs, Vendors, and Admin dashboards
- **Escrow System**: Secure payment handling with vendor assignment
- **Content Management**: Dynamic page content editing
- **Responsive Design**: Mobile-first, accessible design

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** for component library
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Tanstack Query** for data fetching

### Backend Options

#### Option 1: Supabase (Current)
- **Supabase** for backend services
- **PostgreSQL** database
- **Row Level Security (RLS)**
- **Edge Functions** for server-side logic
- **Real-time subscriptions**

#### Option 2: Custom Backend (Migration Ready)
- **Node.js + Express** or **Python + FastAPI**
- **PostgreSQL** or **SQLite** database
- **JWT Authentication**
- **RESTful API**

## 📋 Prerequisites

- Node.js 18+
- Git
- For custom backend: PostgreSQL or Python 3.9+

## 🚀 Quick Start

### Using Lovable (Current Setup)
```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Migrating to Custom Backend
See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) and [CURSOR_SETUP.md](./CURSOR_SETUP.md) for detailed instructions.

## 📁 Project Structure

```
carefund/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn/ui components
│   │   └── ...             # Custom components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── data/               # Static data and mocks
│   └── integrations/       # External service integrations
├── public/                 # Static assets
├── backend-examples/       # Backend implementation examples
├── database/              # Database migration files
└── docs/                  # Documentation
```

## 🔧 Configuration

### Environment Variables

```bash
# Supabase Configuration (Current)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Custom Backend Configuration (After Migration)
VITE_API_URL=http://localhost:3001/api
```

## 📚 Key Components

### Authentication
- **Multi-role authentication** (Admin, NGO, Vendor, User)
- **Role-based access control**
- **Password reset functionality**

### Admin Dashboard
- **User management** with role assignment
- **NGO verification and management**
- **Vendor management and associations**
- **Package management**
- **Escrow transaction handling**
- **Content management system**

### NGO Dashboard
- **Profile management**
- **Package creation and management**
- **Donation tracking**
- **Transaction history**

### Vendor Dashboard
- **Purchase order management**
- **Invoice generation**
- **Delivery tracking**
- **NGO associations**

### User Features
- **Browse verified NGOs**
- **Package-based donations**
- **Donation history**
- **Impact tracking**

## 🗃 Database Schema

### Core Tables
- `profiles` - User profile information
- `user_roles` - Role-based access control
- `ngos` - NGO information and verification status
- `vendors` - Vendor information and services
- `packages` - Donation packages with items and pricing
- `donations` - Donation transactions and payments
- `transactions` - Order fulfillment tracking
- `purchase_orders` - Vendor purchase orders
- `vendor_invoices` - Invoice management
- `page_content` - Dynamic content management

## 🚀 Deployment

### Current (Lovable)
- Automatic deployment on Lovable platform
- Custom domain support available
- Simply open [Lovable](https://lovable.dev/projects/e109a82f-9493-4844-a7e5-d9673a59e47b) and click on Share → Publish

### After Migration
- Frontend: Vercel, Netlify, or custom hosting
- Backend: Railway, Render, AWS, or VPS
- Database: PostgreSQL on cloud providers

## 🧪 Testing

```bash
# Run tests
npm test

# Run type checking
npm run type-check

# Build for production
npm run build
```

## 📖 Documentation

- [Migration Guide](./MIGRATION_GUIDE.md) - How to migrate from Supabase to custom backend
- [Cursor Setup](./CURSOR_SETUP.md) - Development setup in Cursor IDE

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use meaningful component and variable names
- Implement proper error handling

### Database
- Use proper indexing for performance
- Implement data validation
- Follow security best practices
- Use transactions for data consistency

### Security
- Implement proper authentication
- Use environment variables for secrets
- Validate all user inputs
- Use HTTPS in production

## 🔒 Security Features

- **JWT-based authentication** (after migration)
- **Role-based access control (RBAC)**
- **Input validation and sanitization**
- **SQL injection prevention**
- **Cross-site scripting (XSS) protection**

## 📞 Support

For support and questions:
- Create an issue in this repository
- **Lovable Project**: https://lovable.dev/projects/e109a82f-9493-4844-a7e5-d9673a59e47b

## 🗺 Migration Roadmap

- [ ] Export code to GitHub ✅
- [ ] Set up custom backend (Node.js/Python)
- [ ] Migrate database schema
- [ ] Replace Supabase auth with JWT
- [ ] Update API calls in frontend
- [ ] Deploy to cloud platform

---

**Original Lovable Project**: [View in Lovable](https://lovable.dev/projects/e109a82f-9493-4844-a7e5-d9673a59e47b)

Made with ❤️ for transparent giving in India
