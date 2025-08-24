# Do Good Hub - FastAPI Backend

This is the FastAPI backend implementation for the Do Good Hub NGO platform, converted from the original Node.js/Express backend.

## Features

- **FastAPI Framework**: Modern, fast web framework for building APIs with Python
- **Async/Await Support**: Full asynchronous support for better performance
- **SQLAlchemy ORM**: Powerful ORM with async support for database operations
- **Pydantic Models**: Data validation and serialization using Pydantic
- **JWT Authentication**: Secure authentication with JSON Web Tokens
- **Role-based Authorization**: Support for admin, NGO, and vendor roles
- **Database Migrations**: Alembic for database schema management
- **CORS Support**: Cross-Origin Resource Sharing configuration
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Mock Database Mode**: Development mode without requiring a database

## Project Structure

```
backend_python/
├── app/
│   ├── __init__.py
│   ├── database/
│   │   ├── __init__.py
│   │   └── connection.py          # Database connection and configuration
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py                # Authentication middleware
│   │   └── error_handler.py       # Error handling middleware
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py              # SQLAlchemy database models
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py                # Authentication routes
│   │   ├── users.py               # User management routes
│   │   ├── ngos.py                # NGO management routes
│   │   ├── vendors.py             # Vendor management routes
│   │   ├── packages.py            # Package management routes
│   │   ├── donations.py           # Donation management routes
│   │   ├── transactions.py        # Transaction management routes
│   │   └── tickets.py             # Support ticket routes
│   └── schemas/
│       ├── __init__.py
│       └── schemas.py             # Pydantic models for validation
├── alembic/
│   ├── versions/                  # Database migration files
│   ├── env.py                     # Alembic environment configuration
│   └── script.py.mako             # Migration template
├── main.py                        # FastAPI application entry point
├── requirements.txt               # Python dependencies
├── alembic.ini                    # Alembic configuration
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## Installation

### Prerequisites

- Python 3.8 or higher
- PostgreSQL database (optional, can use mock mode)
- pip (Python package manager)

### Setup

1. **Clone the repository and navigate to the backend directory:**
   ```bash
   cd backend_python
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

5. **Database setup (if not using mock mode):**
   ```bash
   # Initialize Alembic
   alembic revision --autogenerate -m "Initial migration"
   
   # Run migrations
   alembic upgrade head
   ```

## Configuration

### Environment Variables

Key environment variables in `.env`:

- `DATABASE_URL`: PostgreSQL connection string
- `MOCK_DATABASE`: Set to `true` for development without database
- `SECRET_KEY`: JWT secret key
- `ALLOWED_ORIGINS`: CORS allowed origins
- `DEBUG`: Enable debug mode

### Mock Database Mode

For development without setting up PostgreSQL:

1. Set `MOCK_DATABASE=true` in your `.env` file
2. The application will use in-memory mock data
3. Includes sample profiles and NGOs for testing

## Running the Application

### Development Mode

```bash
# With auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using the FastAPI CLI
fastapi dev main.py
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Client-side logout

### Users
- `GET /users/` - Get all users (admin only)
- `GET /users/{user_id}` - Get user by ID (admin only)
- `PUT /users/me` - Update current user profile
- `DELETE /users/{user_id}` - Delete user (admin only)

### NGOs
- `GET /ngos/` - Get all NGOs
- `GET /ngos/{ngo_id}` - Get NGO by ID
- `POST /ngos/` - Create NGO (authenticated users)
- `PUT /ngos/{ngo_id}` - Update NGO (owner/admin)
- `DELETE /ngos/{ngo_id}` - Delete NGO (owner/admin)

### Vendors
- `GET /vendors/` - Get all vendors
- `GET /vendors/{vendor_id}` - Get vendor by ID
- `POST /vendors/` - Create vendor (authenticated users)
- `PUT /vendors/{vendor_id}` - Update vendor (owner/admin)
- `DELETE /vendors/{vendor_id}` - Delete vendor (owner/admin)

### Packages
- `GET /packages/` - Get all packages
- `GET /packages/{package_id}` - Get package by ID
- `POST /packages/` - Create package (NGO users)
- `PUT /packages/{package_id}` - Update package (owner/admin)
- `DELETE /packages/{package_id}` - Delete package (owner/admin)

### Donations
- `GET /donations/` - Get donations (own/all for admin)
- `GET /donations/{donation_id}` - Get donation by ID
- `POST /donations/` - Create donation
- `PUT /donations/{donation_id}` - Update donation (owner/admin)
- `DELETE /donations/{donation_id}` - Delete donation (admin only)

### Transactions
- `GET /transactions/` - Get transactions (own/all for admin)
- `GET /transactions/{transaction_id}` - Get transaction by ID
- `POST /transactions/` - Create transaction
- `PUT /transactions/{transaction_id}` - Update transaction (owner/admin)
- `DELETE /transactions/{transaction_id}` - Delete transaction (admin only)
- `GET /transactions/user/{user_id}/summary` - Get user transaction summary

### Tickets
- `GET /tickets/` - Get tickets (own/all for admin)
- `GET /tickets/{ticket_id}` - Get ticket by ID
- `POST /tickets/` - Create ticket
- `PUT /tickets/{ticket_id}` - Update ticket (owner/admin)
- `DELETE /tickets/{ticket_id}` - Delete ticket (owner/admin)
- `GET /tickets/stats/summary` - Get ticket statistics (admin only)

## Database Models

### Core Models
- **Profile**: User profiles with roles (admin, ngo, vendor, donor)
- **NGO**: Non-governmental organizations
- **Vendor**: Service/product vendors
- **Package**: Donation packages created by NGOs
- **Donation**: Individual donations to packages
- **Transaction**: Financial transactions
- **Ticket**: Support tickets and issues

### Relationships
- Users can have multiple NGOs, vendors, donations, transactions, and tickets
- NGOs can have multiple packages
- Packages can have multiple donations
- All models include timestamps and UUID primary keys

## Authentication & Authorization

### JWT Authentication
- Bearer token authentication
- Configurable token expiration
- Automatic token validation on protected routes

### Role-based Access Control
- **Admin**: Full access to all resources
- **NGO**: Can manage own NGOs and packages
- **Vendor**: Can manage own vendor profiles
- **Donor**: Can create donations and view own data

## Development

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migrations
alembic downgrade -1
```

### Code Style

- Follow PEP 8 Python style guidelines
- Use type hints for better code documentation
- Async/await for all database operations
- Comprehensive error handling

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Deployment

### Docker (Recommended)

```dockerfile
# Example Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Considerations

- Use environment variables for all configuration
- Set up proper logging
- Configure HTTPS/SSL
- Use a production WSGI server (Gunicorn + Uvicorn)
- Set up database connection pooling
- Configure monitoring and health checks

## Migration from Node.js

This FastAPI backend maintains API compatibility with the original Node.js implementation:

- Same endpoint URLs and HTTP methods
- Compatible request/response formats
- Equivalent authentication and authorization
- Matching database schema and relationships
- Similar error handling and status codes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.