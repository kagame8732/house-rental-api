# House Rental Management System

A comprehensive backend API for managing rental properties, tenants, leases, and maintenance requests. Built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **User Management**: JWT-based authentication with admin/owner roles
- **Property Management**: CRUD operations for rental properties
- **Tenant Management**: Track tenant information and property assignments
- **Lease Management**: Handle lease agreements with start/end dates and rent
- **Maintenance Tracking**: Manage repair requests and maintenance schedules
- **Pagination & Filtering**: Efficient data retrieval with search and pagination
- **Data Validation**: Comprehensive input validation and error handling

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT tokens
- **Language**: TypeScript
- **Package Manager**: npm

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd house-rental
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=house_rental

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
```

4. Set up the database:

```bash
# Create PostgreSQL database
createdb house_rental

# Run migrations (if needed)
npm run migration:run
```

5. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Properties

- `GET /api/properties` - Get all properties (with pagination/filtering)
- `POST /api/properties` - Create new property
- `GET /api/properties/:id` - Get property by ID
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Tenants

- `GET /api/tenants` - Get all tenants (with pagination/filtering)
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/:id` - Get tenant by ID
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Leases

- `GET /api/leases` - Get all leases (with pagination/filtering)
- `POST /api/leases` - Create new lease
- `GET /api/leases/:id` - Get lease by ID
- `PUT /api/leases/:id` - Update lease
- `DELETE /api/leases/:id` - Delete lease

### Maintenance

- `GET /api/maintenance` - Get all maintenance requests (with pagination/filtering)
- `POST /api/maintenance` - Create new maintenance request
- `GET /api/maintenance/:id` - Get maintenance request by ID
- `PUT /api/maintenance/:id` - Update maintenance request
- `DELETE /api/maintenance/:id` - Delete maintenance request

## Default Admin User

The system creates a default admin user on first run:

- **Phone**: +1234567890
- **Password**: admin123

## Database Schema

### Users

- id (UUID, Primary Key)
- name (VARCHAR)
- phone (VARCHAR, Unique)
- password (VARCHAR, Hashed)
- role (ENUM: admin, owner)
- createdAt, updatedAt (Timestamps)

### Properties

- id (UUID, Primary Key)
- name (VARCHAR)
- address (TEXT)
- type (ENUM: house, apartment)
- status (ENUM: active, inactive)
- ownerId (UUID, Foreign Key)
- createdAt, updatedAt (Timestamps)

### Tenants

- id (UUID, Primary Key)
- name (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR, Optional)
- address (TEXT, Optional)
- status (ENUM: active, inactive, evicted)
- propertyId (UUID, Foreign Key)
- createdAt, updatedAt (Timestamps)

### Leases

- id (UUID, Primary Key)
- propertyId (UUID, Foreign Key)
- tenantId (UUID, Foreign Key)
- startDate (DATE)
- endDate (DATE)
- monthlyRent (DECIMAL)
- status (ENUM: active, expired, terminated)
- notes (TEXT, Optional)
- createdAt, updatedAt (Timestamps)

### Maintenance

- id (UUID, Primary Key)
- title (VARCHAR)
- description (TEXT)
- status (ENUM: pending, in_progress, completed, cancelled)
- priority (ENUM: low, medium, high, urgent)
- propertyId (UUID, Foreign Key)
- cost (DECIMAL, Optional)
- scheduledDate (DATE, Optional)
- completedDate (DATE, Optional)
- notes (TEXT, Optional)
- createdAt, updatedAt (Timestamps)

## Query Parameters

### Pagination

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by (default: createdAt)
- `sortOrder` - Sort order: ASC or DESC (default: DESC)

### Filtering

- `search` - Search term for text fields
- `status` - Filter by status
- `type` - Filter by type (for properties)
- `priority` - Filter by priority (for maintenance)
- `propertyId` - Filter by property ID

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": {
    "errors": ["Detailed validation errors"]
  }
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project
- `npm run start` - Start production server
- `npm run migration:run` - Run database migrations
- `npm run migration:revert` - Revert last migration
- `npm run seed` - Run database seeds

### Project Structure

```
src/
├── constants/          # Application constants
├── controllers/        # Route controllers
├── database/          # Database configuration and models
│   ├── migrations/    # Database migrations
│   ├── models/        # TypeORM entities
│   └── seeds/         # Database seeds
├── helpers/           # Utility helpers
├── middleware/        # Express middleware
├── routes/            # API routes
├── utils/             # Utility functions
└── index.ts           # Application entry point
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection protection via TypeORM
- CORS enabled for cross-origin requests

## License

This project is licensed under the ISC License.
