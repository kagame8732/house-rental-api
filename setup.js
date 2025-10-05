#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🏠 House Rental Management System Setup");
console.log("=====================================\n");

// Check if .env file exists
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.log("📝 Creating .env file...");
  const envContent = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=house_rental

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Superuser Configuration
SU_EMAIL=admin@example.com
SU_PASSWORD=admin123

# Server Configuration
PORT=3000
NODE_ENV=development
`;
  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env file created successfully");
} else {
  console.log("✅ .env file already exists");
}

console.log("\n📦 Installing dependencies...");
try {
  execSync("npm install", { stdio: "inherit" });
  console.log("✅ Dependencies installed successfully");
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message);
  process.exit(1);
}

console.log("\n🔧 Database Setup Instructions:");
console.log("1. Make sure PostgreSQL is running");
console.log('2. Create a database named "house_rental"');
console.log("3. Update the .env file with your database credentials");
console.log("4. Run: npm run dev");

console.log("\n🚀 Superuser Configuration:");
console.log("Set SU_EMAIL and SU_PASSWORD in your .env file");
console.log("Default values: admin@example.com / admin123");

console.log("\n📚 Available Commands:");
console.log("- npm run dev          : Start development server");
console.log("- npm run build        : Build the project");
console.log("- npm run start        : Start production server");
console.log("- npm run migration:run : Run database migrations");
console.log("- npm run seed         : Run database seeds");

console.log("\n✨ Setup completed! Happy coding!");
