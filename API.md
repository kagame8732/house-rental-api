# House Rental Management API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints except `/auth/login` require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "message": string,
  "data": any,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## Endpoints

### Authentication

#### POST /auth/login

Login with phone and password.

**Request Body:**

```json
{
  "phone": "+1234567890",
  "password": "admin123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "System Administrator",
      "phone": "+1234567890",
      "role": "admin"
    },
    "token": "jwt-token"
  }
}
```

#### GET /auth/profile

Get current user profile (requires authentication).

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "System Administrator",
    "phone": "+1234567890",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Properties

#### GET /properties

Get all properties with pagination and filtering.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sortBy` (optional): Field to sort by (default: createdAt)
- `sortOrder` (optional): ASC or DESC (default: DESC)
- `search` (optional): Search in name and address
- `status` (optional): Filter by status (active, inactive)
- `type` (optional): Filter by type (house, apartment)

**Response:**

```json
{
  "success": true,
  "message": "Properties retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Downtown Apartment",
      "address": "123 Main St, City, State",
      "type": "apartment",
      "status": "active",
      "ownerId": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### POST /properties

Create a new property.

**Request Body:**

```json
{
  "name": "Downtown Apartment",
  "address": "123 Main St, City, State",
  "type": "apartment",
  "status": "active"
}
```

#### GET /properties/:id

Get property by ID.

#### PUT /properties/:id

Update property.

#### DELETE /properties/:id

Delete property.

### Tenants

#### GET /tenants

Get all tenants with pagination and filtering.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`: Same as properties
- `search`: Search in name, phone, and email
- `status`: Filter by status (active, inactive, evicted)
- `propertyId`: Filter by property ID

**Response:**

```json
{
  "success": true,
  "message": "Tenants retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "address": "123 Main St",
      "status": "active",
      "propertyId": "uuid",
      "property": {
        "id": "uuid",
        "name": "Downtown Apartment"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /tenants

Create a new tenant.

**Request Body:**

```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "address": "123 Main St",
  "propertyId": "uuid",
  "status": "active"
}
```

#### GET /tenants/:id

Get tenant by ID.

#### PUT /tenants/:id

Update tenant.

#### DELETE /tenants/:id

Delete tenant.

### Leases

#### GET /leases

Get all leases with pagination and filtering.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`: Same as properties
- `search`: Search in tenant name and property name
- `status`: Filter by status (active, expired, terminated)
- `propertyId`: Filter by property ID
- `tenantId`: Filter by tenant ID

**Response:**

```json
{
  "success": true,
  "message": "Leases retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "tenantId": "uuid",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "monthlyRent": 1500.0,
      "status": "active",
      "notes": "First year lease",
      "property": {
        "id": "uuid",
        "name": "Downtown Apartment"
      },
      "tenant": {
        "id": "uuid",
        "name": "John Doe"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /leases

Create a new lease.

**Request Body:**

```json
{
  "propertyId": "uuid",
  "tenantId": "uuid",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "monthlyRent": 1500.0,
  "notes": "First year lease"
}
```

#### GET /leases/:id

Get lease by ID.

#### PUT /leases/:id

Update lease.

#### DELETE /leases/:id

Delete lease.

### Maintenance

#### GET /maintenance

Get all maintenance requests with pagination and filtering.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`: Same as properties
- `search`: Search in title and description
- `status`: Filter by status (pending, in_progress, completed, cancelled)
- `priority`: Filter by priority (low, medium, high, urgent)
- `propertyId`: Filter by property ID

**Response:**

```json
{
  "success": true,
  "message": "Maintenance requests retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Broken Window",
      "description": "Window in bedroom is cracked",
      "status": "pending",
      "priority": "medium",
      "propertyId": "uuid",
      "cost": null,
      "scheduledDate": null,
      "completedDate": null,
      "notes": null,
      "property": {
        "id": "uuid",
        "name": "Downtown Apartment"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /maintenance

Create a new maintenance request.

**Request Body:**

```json
{
  "title": "Broken Window",
  "description": "Window in bedroom is cracked",
  "priority": "medium",
  "propertyId": "uuid",
  "cost": 200.0,
  "scheduledDate": "2024-01-15",
  "notes": "Urgent repair needed"
}
```

#### GET /maintenance/:id

Get maintenance request by ID.

#### PUT /maintenance/:id

Update maintenance request.

#### DELETE /maintenance/:id

Delete maintenance request.

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": ["Name is required", "Phone must be valid"]
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Property not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Data Types

### Property Types

- `house`
- `apartment`

### Property Status

- `active`
- `inactive`

### Tenant Status

- `active`
- `inactive`
- `evicted`

### Lease Status

- `active`
- `expired`
- `terminated`

### Maintenance Status

- `pending`
- `in_progress`
- `completed`
- `cancelled`

### Maintenance Priority

- `low`
- `medium`
- `high`
- `urgent`

### User Roles

- `admin`
- `owner`
