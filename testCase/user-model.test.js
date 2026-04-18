/**
 * User Model Tests
 * Tests for User schema methods: pre-save hook, getSignedJwtToken, matchPassword
 * These tests exercise the REAL User model code (lines 42-54 in User.js)
 */

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Import the REAL User model (do NOT mock mongoose)
const User = require("../models/User");

describe("User Model - Real Schema Methods", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================
    // getSignedJwtToken — covers LINE 48
    // =========================================
    describe("getSignedJwtToken", () => {
        it("should call jwt.sign with correct payload and options", () => {
            process.env.JWT_SECRET = "test-secret";
            process.env.JWT_EXPIRE = "30d";
            jwt.sign.mockReturnValue("mock-jwt-token");

            const user = new User({
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                tel: "1234567890",
            });

            const token = user.getSignedJwtToken();

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: user._id },
                "test-secret",
                { expiresIn: "30d" }
            );
            expect(token).toBe("mock-jwt-token");
        });

        it("should return the token from jwt.sign", () => {
            jwt.sign.mockReturnValue("another-token");

            const user = new User({
                name: "Test",
                email: "test2@example.com",
                password: "pass123",
                tel: "9876543210",
            });

            const result = user.getSignedJwtToken();
            expect(result).toBe("another-token");
        });
    });

    // =========================================
    // matchPassword — covers LINE 54
    // =========================================
    describe("matchPassword", () => {
        it("should return true when password matches", async () => {
            bcrypt.compare.mockResolvedValue(true);

            const user = new User({
                name: "Test User",
                email: "test@example.com",
                password: "hashedPassword123",
                tel: "1234567890",
            });

            const result = await user.matchPassword("plainPassword");

            expect(bcrypt.compare).toHaveBeenCalledWith(
                "plainPassword",
                "hashedPassword123"
            );
            expect(result).toBe(true);
        });

        it("should return false when password does not match", async () => {
            bcrypt.compare.mockResolvedValue(false);

            const user = new User({
                name: "Test User",
                email: "test3@example.com",
                password: "hashedPassword123",
                tel: "1234567890",
            });

            const result = await user.matchPassword("wrongPassword");

            expect(bcrypt.compare).toHaveBeenCalledWith(
                "wrongPassword",
                "hashedPassword123"
            );
            expect(result).toBe(false);
        });

        it("should propagate bcrypt errors", async () => {
            bcrypt.compare.mockRejectedValue(new Error("Bcrypt error"));

            const user = new User({
                name: "Test User",
                email: "test4@example.com",
                password: "hashedPassword",
                tel: "1234567890",
            });

            await expect(user.matchPassword("test")).rejects.toThrow(
                "Bcrypt error"
            );
        });
    });

    // =========================================
    // pre-save hook — covers LINES 43-44
    // Override $__save to run pre-save hooks without a real DB connection.
    // =========================================
    describe("pre-save hook (password hashing)", () => {
        /**
         * Helper: override $__save to execute pre/post hooks
         * while skipping the actual DB insert/update operation.
         */
        function stubDbSave(user) {
            user.$__save = async function (options) {
                await this._execDocumentPreHooks("save", options, [options]);
                await this._execDocumentPostHooks("save", options);
            };
        }

        it("should hash password before saving", async () => {
            bcrypt.genSalt.mockResolvedValue("salt123");
            bcrypt.hash.mockResolvedValue("hashedPassword");

            const user = new User({
                name: "Test User",
                email: "test5@example.com",
                password: "plaintext",
                tel: "1234567890",
            });

            stubDbSave(user);
            await user.save();

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith("plaintext", "salt123");
            expect(user.password).toBe("hashedPassword");
        });

        it("should handle bcrypt.genSalt errors in pre-save", async () => {
            bcrypt.genSalt.mockRejectedValue(new Error("Salt error"));

            const user = new User({
                name: "Test User",
                email: "test6@example.com",
                password: "plaintext",
                tel: "1234567890",
            });

            stubDbSave(user);
            await expect(user.save()).rejects.toThrow("Salt error");
        });

        it("should handle bcrypt.hash errors in pre-save", async () => {
            bcrypt.genSalt.mockResolvedValue("salt");
            bcrypt.hash.mockRejectedValue(new Error("Hash error"));

            const user = new User({
                name: "Test User",
                email: "test7@example.com",
                password: "plaintext",
                tel: "1234567890",
            });

            stubDbSave(user);
            await expect(user.save()).rejects.toThrow("Hash error");
        });
    });

    // =========================================
    // Schema structure validation
    // =========================================
    describe("Schema structure", () => {
        it("should have required fields defined in schema", () => {
            const schemaPaths = User.schema.paths;
            expect(schemaPaths.name).toBeDefined();
            expect(schemaPaths.email).toBeDefined();
            expect(schemaPaths.password).toBeDefined();
            expect(schemaPaths.tel).toBeDefined();
            expect(schemaPaths.role).toBeDefined();
            expect(schemaPaths.createdAt).toBeDefined();
        });

        it("should have role with default 'user'", () => {
            const user = new User({
                name: "Test",
                email: "test8@example.com",
                password: "pass",
                tel: "123",
            });
            expect(user.role).toBe("user");
        });

        it("should have password with select: false", () => {
            const passwordPath = User.schema.paths.password;
            expect(passwordPath.options.select).toBe(false);
        });
    });
});
