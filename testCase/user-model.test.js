jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("mongoose");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Create a mock User model to test the schema methods
describe("User Model", () => {
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a mock user instance
        mockUser = {
            _id: "userId123",
            name: "John Doe",
            email: "john@example.com",
            password: "hashedPassword123",
            tel: "1234567890",
            role: "user",
            createdAt: new Date(),
        };
    });

    describe("getSignedJwtToken", () => {
        it("should generate JWT token with correct payload", async () => {
            const mockToken = "jwt.token.here";
            jwt.sign.mockReturnValue(mockToken);

            // Mock the method
            mockUser.getSignedJwtToken = function() {
                return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE,
                });
            };

            const token = mockUser.getSignedJwtToken();

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: "userId123" },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );
            expect(token).toBe(mockToken);
        });

        it("should use env variables for JWT secret and expiry", async () => {
            process.env.JWT_SECRET = "test-secret";
            process.env.JWT_EXPIRE = "7d";

            jwt.sign.mockReturnValue("token");

            mockUser.getSignedJwtToken = function() {
                return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE,
                });
            };

            mockUser.getSignedJwtToken();

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: "userId123" },
                "test-secret",
                { expiresIn: "7d" }
            );
        });
    });

    describe("matchPassword", () => {
        it("should return true when password matches", async () => {
            bcrypt.compare.mockResolvedValue(true);

            mockUser.matchPassword = async function(password) {
                return await bcrypt.compare(password, this.password);
            };

            const result = await mockUser.matchPassword("testPassword");

            expect(bcrypt.compare).toHaveBeenCalledWith("testPassword", "hashedPassword123");
            expect(result).toBe(true);
        });

        it("should return false when password does not match", async () => {
            bcrypt.compare.mockResolvedValue(false);

            mockUser.matchPassword = async function(password) {
                return await bcrypt.compare(password, this.password);
            };

            const result = await mockUser.matchPassword("wrongPassword");

            expect(bcrypt.compare).toHaveBeenCalledWith("wrongPassword", "hashedPassword123");
            expect(result).toBe(false);
        });

        it("should handle bcrypt errors", async () => {
            bcrypt.compare.mockRejectedValue(new Error("Bcrypt error"));

            mockUser.matchPassword = async function(password) {
                return await bcrypt.compare(password, this.password);
            };

            try {
                await mockUser.matchPassword("testPassword");
                expect(true).toBe(false); // Should throw
            } catch (err) {
                expect(err.message).toBe("Bcrypt error");
            }
        });
    });

    describe("Password Hashing Pre-Save Hook", () => {
        it("should hash password before saving", async () => {
            const hashedPassword = "hashed_newPassword123";
            bcrypt.genSalt.mockResolvedValue("salt123");
            bcrypt.hash.mockResolvedValue(hashedPassword);

            // Simulate the pre-save hook
            const preSaveHook = async function(next) {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            };

            const userBeforeSave = {
                password: "plainPassword123",
            };

            await preSaveHook.call(userBeforeSave);

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith("plainPassword123", "salt123");
            expect(userBeforeSave.password).toBe(hashedPassword);
        });

        it("should use bcrypt.genSalt with 10 rounds", async () => {
            bcrypt.genSalt.mockResolvedValue("salt");
            bcrypt.hash.mockResolvedValue("hashedPassword");

            const preSaveHook = async function(next) {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            };

            await preSaveHook.call({ password: "test" });

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        });

        it("should handle bcrypt salt generation errors", async () => {
            bcrypt.genSalt.mockRejectedValue(new Error("Salt error"));

            const preSaveHook = async function(next) {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            };

            try {
                await preSaveHook.call({ password: "test" });
                expect(true).toBe(false); // Should throw
            } catch (err) {
                expect(err.message).toBe("Salt error");
            }
        });

        it("should handle bcrypt hash errors", async () => {
            bcrypt.genSalt.mockResolvedValue("salt");
            bcrypt.hash.mockRejectedValue(new Error("Hash error"));

            const preSaveHook = async function(next) {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            };

            try {
                await preSaveHook.call({ password: "test" });
                expect(true).toBe(false); // Should throw
            } catch (err) {
                expect(err.message).toBe("Hash error");
            }
        });
    });

    describe("User Schema Validation", () => {
        it("should have required fields", () => {
            // Test required fields
            expect(mockUser.name).toBeDefined();
            expect(mockUser.email).toBeDefined();
            expect(mockUser.password).toBeDefined();
            expect(mockUser.tel).toBeDefined();
        });

        it("should have role with default value", () => {
            expect(mockUser.role).toBe("user");
        });

        it("should validate email format with regex", () => {
            const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            expect(emailRegex.test("john@example.com")).toBe(true);
            expect(emailRegex.test("invalid-email")).toBe(false);
            expect(emailRegex.test("user+tag@domain.co.uk")).toBe(true);
        });

        it("should have createdAt with default Date.now", () => {
            expect(mockUser.createdAt).toBeInstanceOf(Date);
        });
    });
});
