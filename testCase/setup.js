/**
 * Test Setup Configuration
 * Initializes test environment and database connections
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../config/config.env") });

// Timeout for tests
jest.setTimeout(10000);

// Handle warnings
beforeAll(async () => {
    // Suppress mongoose connection warnings
    process.on("warning", (warning) => {
        if (warning.name === "DeprecationWarning") {
            return;
        }
        console.warn(warning);
    });
});

// Cleanup after all tests
afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
});

module.exports = {
    mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/test-db",
};
