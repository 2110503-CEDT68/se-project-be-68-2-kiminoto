/**
 * Test Utilities
 * Helper functions for testing
 */

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

/**
 * Create a mock JWT token for testing
 */
function createMockToken(userId, role = "user") {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "24h" }
    );
}

/**
 * Generate a mock user object
 */
function createMockUser(overrides = {}) {
    const userId = new mongoose.Types.ObjectId();
    return {
        _id: userId,
        id: userId.toString(),
        name: "Test User",
        email: "test@example.com",
        role: "user",
        ...overrides,
    };
}

/**
 * Generate a mock car provider object
 */
function createMockCarProvider(overrides = {}) {
    return {
        _id: new mongoose.Types.ObjectId(),
        name: "Test Car Provider",
        email: "provider@example.com",
        phone: "1234567890",
        ...overrides,
    };
}

/**
 * Generate a mock booking object
 */
function createMockBooking(overrides = {}) {
    return {
        _id: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        carProvider: new mongoose.Types.ObjectId(),
        status: "completed",
        review: null,
        ...overrides,
    };
}

/**
 * Generate a mock review object
 */
function createMockReview(overrides = {}) {
    return {
        rating: 5,
        comment: "Great service!",
        ...overrides,
    };
}

/**
 * Generate a mock vote object
 */
function createMockVote(overrides = {}) {
    return {
        user: new mongoose.Types.ObjectId(),
        booking: new mongoose.Types.ObjectId(),
        voteType: "upvote",
        ...overrides,
    };
}

module.exports = {
    createMockToken,
    createMockUser,
    createMockCarProvider,
    createMockBooking,
    createMockReview,
    createMockVote,
};
