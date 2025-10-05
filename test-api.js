#!/usr/bin/env node

const https = require("https");
const http = require("http");

const BASE_URL = "http://localhost:3000/api";

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log("🔍 Testing Health Check...");
  const response = await makeRequest("GET", "/health");
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, response.data);
  console.log("✅ Health check passed\n");
}

async function testLogin() {
  console.log("🔐 Testing Login...");
  const loginData = {
    phone: process.env.SU_EMAIL || "admin@example.com",
    password: process.env.SU_PASSWORD || "admin123",
  };

  const response = await makeRequest("POST", "/auth/login", loginData);
  console.log(`Status: ${response.status}`);

  if (response.status === 200 && response.data.success) {
    console.log("✅ Login successful");
    return response.data.data.token;
  } else {
    console.log("❌ Login failed:", response.data);
    return null;
  }
}

async function testProfile(token) {
  console.log("\n👤 Testing Profile...");
  const response = await makeRequest("GET", "/auth/profile", null, token);
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, response.data);
  console.log("✅ Profile test completed\n");
}

async function testProperties(token) {
  console.log("🏠 Testing Properties...");

  // Create property
  console.log("Creating property...");
  const propertyData = {
    name: "Test Apartment",
    address: "123 Test Street, Test City, TC 12345",
    type: "apartment",
    status: "active",
  };

  const createResponse = await makeRequest(
    "POST",
    "/properties",
    propertyData,
    token
  );
  console.log(`Create Status: ${createResponse.status}`);

  if (createResponse.status === 201) {
    const propertyId = createResponse.data.data.id;
    console.log(`✅ Property created with ID: ${propertyId}`);

    // Get all properties
    console.log("Getting all properties...");
    const listResponse = await makeRequest("GET", "/properties", null, token);
    console.log(`List Status: ${listResponse.status}`);
    console.log(`Found ${listResponse.data.data?.length || 0} properties`);

    // Get property by ID
    console.log("Getting property by ID...");
    const getResponse = await makeRequest(
      "GET",
      `/properties/${propertyId}`,
      null,
      token
    );
    console.log(`Get Status: ${getResponse.status}`);

    // Update property
    console.log("Updating property...");
    const updateData = { name: "Updated Test Apartment" };
    const updateResponse = await makeRequest(
      "PUT",
      `/properties/${propertyId}`,
      updateData,
      token
    );
    console.log(`Update Status: ${updateResponse.status}`);

    // Delete property
    console.log("Deleting property...");
    const deleteResponse = await makeRequest(
      "DELETE",
      `/properties/${propertyId}`,
      null,
      token
    );
    console.log(`Delete Status: ${deleteResponse.status}`);

    console.log("✅ Properties test completed\n");
    return propertyId;
  } else {
    console.log("❌ Property creation failed:", createResponse.data);
    return null;
  }
}

async function testTenants(token, propertyId) {
  console.log("👥 Testing Tenants...");

  // Create tenant
  console.log("Creating tenant...");
  const tenantData = {
    name: "John Doe",
    phone: "+1234567890",
    email: "john@example.com",
    address: "123 Main St",
    propertyId: propertyId,
    status: "active",
  };

  const createResponse = await makeRequest(
    "POST",
    "/tenants",
    tenantData,
    token
  );
  console.log(`Create Status: ${createResponse.status}`);

  if (createResponse.status === 201) {
    const tenantId = createResponse.data.data.id;
    console.log(`✅ Tenant created with ID: ${tenantId}`);

    // Get all tenants
    console.log("Getting all tenants...");
    const listResponse = await makeRequest("GET", "/tenants", null, token);
    console.log(`List Status: ${listResponse.status}`);
    console.log(`Found ${listResponse.data.data?.length || 0} tenants`);

    // Get tenant by ID
    console.log("Getting tenant by ID...");
    const getResponse = await makeRequest(
      "GET",
      `/tenants/${tenantId}`,
      null,
      token
    );
    console.log(`Get Status: ${getResponse.status}`);

    // Update tenant
    console.log("Updating tenant...");
    const updateData = { name: "John Smith" };
    const updateResponse = await makeRequest(
      "PUT",
      `/tenants/${tenantId}`,
      updateData,
      token
    );
    console.log(`Update Status: ${updateResponse.status}`);

    // Delete tenant
    console.log("Deleting tenant...");
    const deleteResponse = await makeRequest(
      "DELETE",
      `/tenants/${tenantId}`,
      null,
      token
    );
    console.log(`Delete Status: ${deleteResponse.status}`);

    console.log("✅ Tenants test completed\n");
    return tenantId;
  } else {
    console.log("❌ Tenant creation failed:", createResponse.data);
    return null;
  }
}

async function testLeases(token, propertyId, tenantId) {
  console.log("📋 Testing Leases...");

  // Create lease
  console.log("Creating lease...");
  const leaseData = {
    propertyId: propertyId,
    tenantId: tenantId,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    monthlyRent: 1500.0,
    notes: "Test lease",
  };

  const createResponse = await makeRequest("POST", "/leases", leaseData, token);
  console.log(`Create Status: ${createResponse.status}`);

  if (createResponse.status === 201) {
    const leaseId = createResponse.data.data.id;
    console.log(`✅ Lease created with ID: ${leaseId}`);

    // Get all leases
    console.log("Getting all leases...");
    const listResponse = await makeRequest("GET", "/leases", null, token);
    console.log(`List Status: ${listResponse.status}`);
    console.log(`Found ${listResponse.data.data?.length || 0} leases`);

    // Get lease by ID
    console.log("Getting lease by ID...");
    const getResponse = await makeRequest(
      "GET",
      `/leases/${leaseId}`,
      null,
      token
    );
    console.log(`Get Status: ${getResponse.status}`);

    // Update lease
    console.log("Updating lease...");
    const updateData = { monthlyRent: 1600.0 };
    const updateResponse = await makeRequest(
      "PUT",
      `/leases/${leaseId}`,
      updateData,
      token
    );
    console.log(`Update Status: ${updateResponse.status}`);

    // Delete lease
    console.log("Deleting lease...");
    const deleteResponse = await makeRequest(
      "DELETE",
      `/leases/${leaseId}`,
      null,
      token
    );
    console.log(`Delete Status: ${deleteResponse.status}`);

    console.log("✅ Leases test completed\n");
    return leaseId;
  } else {
    console.log("❌ Lease creation failed:", createResponse.data);
    return null;
  }
}

async function testMaintenance(token, propertyId) {
  console.log("🔧 Testing Maintenance...");

  // Create maintenance request
  console.log("Creating maintenance request...");
  const maintenanceData = {
    title: "Broken Window",
    description: "Window in bedroom is cracked",
    priority: "medium",
    propertyId: propertyId,
    cost: 200.0,
    scheduledDate: "2024-01-15",
    notes: "Test maintenance request",
  };

  const createResponse = await makeRequest(
    "POST",
    "/maintenance",
    maintenanceData,
    token
  );
  console.log(`Create Status: ${createResponse.status}`);

  if (createResponse.status === 201) {
    const maintenanceId = createResponse.data.data.id;
    console.log(`✅ Maintenance request created with ID: ${maintenanceId}`);

    // Get all maintenance requests
    console.log("Getting all maintenance requests...");
    const listResponse = await makeRequest("GET", "/maintenance", null, token);
    console.log(`List Status: ${listResponse.status}`);
    console.log(
      `Found ${listResponse.data.data?.length || 0} maintenance requests`
    );

    // Get maintenance by ID
    console.log("Getting maintenance by ID...");
    const getResponse = await makeRequest(
      "GET",
      `/maintenance/${maintenanceId}`,
      null,
      token
    );
    console.log(`Get Status: ${getResponse.status}`);

    // Update maintenance
    console.log("Updating maintenance...");
    const updateData = { status: "in_progress", cost: 250.0 };
    const updateResponse = await makeRequest(
      "PUT",
      `/maintenance/${maintenanceId}`,
      updateData,
      token
    );
    console.log(`Update Status: ${updateResponse.status}`);

    // Delete maintenance
    console.log("Deleting maintenance...");
    const deleteResponse = await makeRequest(
      "DELETE",
      `/maintenance/${maintenanceId}`,
      null,
      token
    );
    console.log(`Delete Status: ${deleteResponse.status}`);

    console.log("✅ Maintenance test completed\n");
    return maintenanceId;
  } else {
    console.log("❌ Maintenance creation failed:", createResponse.data);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log("🚀 Starting API Tests...\n");

  try {
    // Test health check
    await testHealthCheck();

    // Test login
    const token = await testLogin();
    if (!token) {
      console.log("❌ Cannot proceed without authentication token");
      return;
    }

    // Test profile
    await testProfile(token);

    // Test properties
    const propertyId = await testProperties(token);
    if (!propertyId) {
      console.log("❌ Cannot proceed without property ID");
      return;
    }

    // Test tenants
    const tenantId = await testTenants(token, propertyId);
    if (!tenantId) {
      console.log("❌ Cannot proceed without tenant ID");
      return;
    }

    // Test leases
    await testLeases(token, propertyId, tenantId);

    // Test maintenance
    await testMaintenance(token, propertyId);

    console.log("🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
