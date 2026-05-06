# API Endpoints Testing Guide

## 🚀 Quick Start

1. **Start the server:**

   ```bash
   npm run dev
   ```

2. **Server will be running at:** `http://localhost:3000`

## 🔐 Authentication Flow

### Step 1: Login to get JWT token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "admin@example.com",
    "password": "admin123"
  }'
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
      "phone": "admin@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token for other requests!**

## 🏠 Properties Endpoints

### Create Property

```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Downtown Apartment",
    "address": "123 Main St, New York, NY 10001",
    "type": "apartment",
    "status": "active"
  }'
```

### Get All Properties

```bash
curl -X GET "http://localhost:3000/api/properties?page=1&limit=10&search=downtown" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Property by ID

```bash
curl -X GET http://localhost:3000/api/properties/PROPERTY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Property

```bash
curl -X PUT http://localhost:3000/api/properties/PROPERTY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Updated Apartment Name",
    "status": "inactive"
  }'
```

### Delete Property

```bash
curl -X DELETE http://localhost:3000/api/properties/PROPERTY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 👥 Tenants Endpoints

### Create Tenant

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "address": "123 Main St",
    "propertyId": "PROPERTY_ID",
    "status": "active"
  }'
```

### Get All Tenants

```bash
curl -X GET "http://localhost:3000/api/tenants?page=1&limit=10&status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Tenant by ID

```bash
curl -X GET http://localhost:3000/api/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Tenant

```bash
curl -X PUT http://localhost:3000/api/tenants/TENANT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Smith",
    "email": "johnsmith@example.com"
  }'
```

### Delete Tenant

```bash
curl -X DELETE http://localhost:3000/api/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📋 Leases Endpoints

### Create Lease

```bash
curl -X POST http://localhost:3000/api/leases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "propertyId": "PROPERTY_ID",
    "tenantId": "TENANT_ID",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "monthlyRent": 1500.00,
    "notes": "First year lease"
  }'
```

### Get All Leases

```bash
curl -X GET "http://localhost:3000/api/leases?page=1&limit=10&status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Lease by ID

```bash
curl -X GET http://localhost:3000/api/leases/LEASE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Lease

```bash
curl -X PUT http://localhost:3000/api/leases/LEASE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "monthlyRent": 1600.00,
    "status": "active"
  }'
```

### Delete Lease

```bash
curl -X DELETE http://localhost:3000/api/leases/LEASE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Maintenance Endpoints

### Create Maintenance Request

```bash
curl -X POST http://localhost:3000/api/maintenance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Broken Window",
    "description": "Window in bedroom is cracked and needs replacement",
    "priority": "medium",
    "propertyId": "PROPERTY_ID",
    "cost": 200.00,
    "scheduledDate": "2024-01-15",
    "notes": "Urgent repair needed"
  }'
```

### Get All Maintenance Requests

```bash
curl -X GET "http://localhost:3000/api/maintenance?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Maintenance by ID

```bash
curl -X GET http://localhost:3000/api/maintenance/MAINTENANCE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Maintenance Request

```bash
curl -X PUT http://localhost:3000/api/maintenance/MAINTENANCE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "in_progress",
    "cost": 250.00,
    "notes": "Started repair work"
  }'
```

### Delete Maintenance Request

```bash
curl -X DELETE http://localhost:3000/api/maintenance/MAINTENANCE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔍 Query Parameters

### Pagination

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Sorting

- `sortBy` - Field to sort by (default: createdAt)
- `sortOrder` - ASC or DESC (default: DESC)

### Filtering

- `search` - Search in text fields
- `status` - Filter by status
- `type` - Filter by type (for properties)
- `priority` - Filter by priority (for maintenance)
- `propertyId` - Filter by property ID
- `tenantId` - Filter by tenant ID

### Example with all parameters:

```bash
curl -X GET "http://localhost:3000/api/properties?page=1&limit=5&sortBy=name&sortOrder=ASC&search=apartment&status=active&type=apartment" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Using Postman

1. **Import Collection:** Create a new collection in Postman
2. **Set Base URL:** `http://localhost:3000/api`
3. **Set Authorization:**
   - Type: Bearer Token
   - Token: Your JWT token from login
4. **Create requests for each endpoint**

## 🐍 Using Python (requests)

```python
import requests
import json

# Base URL
BASE_URL = "http://localhost:3000/api"

# Login
login_data = {
    "phone": "admin@example.com",
    "password": "admin123"
}

response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
token = response.json()["data"]["token"]

# Headers with token
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Create property
property_data = {
    "name": "Test Property",
    "address": "123 Test St",
    "type": "house",
    "status": "active"
}

response = requests.post(f"{BASE_URL}/properties", json=property_data, headers=headers)
print(response.json())
```

## 🧪 Using JavaScript (fetch)

```javascript
// Login
const login = async () => {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: "admin@example.com",
      password: "admin123",
    }),
  });

  const data = await response.json();
  return data.data.token;
};

// Use token for other requests
const token = await login();

const createProperty = async () => {
  const response = await fetch("http://localhost:3000/api/properties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Test Property",
      address: "123 Test St",
      type: "house",
      status: "active",
    }),
  });

  return response.json();
};
```

## 🚨 Common Error Responses

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

## 📊 Health Check

```bash
curl -X GET http://localhost:3000/api/health
```

**Response:**

```json
{
  "success": true,
  "message": "House Rental Management API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔄 Complete Workflow Example

1. **Login** → Get JWT token
2. **Create Property** → Get property ID
3. **Create Tenant** → Link to property, get tenant ID
4. **Create Lease** → Link property and tenant
5. **Create Maintenance** → Link to property
6. **Query all data** → Test filtering and pagination

This gives you a complete rental management system test! 🏠
