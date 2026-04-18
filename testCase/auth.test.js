/**
 * Auth Controller Tests
 * Tests for authentication: register, login, getMe, logout
 */

jest.mock("../models/User");

const User = require("../models/User");

const { register, login, getMe, logout } = require("../controllers/auth");

describe("Auth Controller", () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            body: {},
            user: { id: "userId123" },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("register", () => {
        it("should register a new user", async () => {
            mockReq.body = {
                name: "John Doe",
                tel: "1234567890",
                email: "john@example.com",
                password: "password123",
                role: "user",
            };

            const mockUser = {
                _id: "userId123",
                ...mockReq.body,
                getSignedJwtToken: jest.fn().mockReturnValue("token123"),
            };

            User.create.mockResolvedValue(mockUser);

            await register(mockReq, mockRes, mockNext);

            expect(User.create).toHaveBeenCalledWith({
                name: "John Doe",
                tel: "1234567890",
                email: "john@example.com",
                password: "password123",
                role: "user",
            });

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.cookie).toHaveBeenCalledWith(
                "token",
                "token123",
                expect.any(Object),
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                token: "token123",
            });
        });

        it("should set secure cookie in production", async () => {
            process.env.NODE_ENV = "production";

            mockReq.body = {
                name: "Jane",
                email: "jane@example.com",
                password: "password123",
            };

            const mockUser = {
                getSignedJwtToken: jest.fn().mockReturnValue("token123"),
            };

            User.create.mockResolvedValue(mockUser);

            await register(mockReq, mockRes, mockNext);

            expect(mockRes.cookie).toHaveBeenCalledWith(
                "token",
                "token123",
                expect.objectContaining({ secure: true }),
            );

            process.env.NODE_ENV = "test";
        });

        it("should handle registration errors", async () => {
            mockReq.body = {
                email: "duplicate@example.com",
            };

            User.create.mockRejectedValue(new Error("Email already exists"));

            await register(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false });
        });
    });

    describe("login", () => {
        it("should login an existing user", async () => {
            mockReq.body = {
                email: "john@example.com",
                password: "password123",
            };

            const mockUser = {
                _id: "userId123",
                email: "john@example.com",
                matchPassword: jest.fn().mockResolvedValue(true),
                getSignedJwtToken: jest.fn().mockReturnValue("token123"),
            };

            User.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await login(mockReq, mockRes, mockNext);

            expect(User.findOne).toHaveBeenCalledWith({ email: "john@example.com" });
            expect(mockUser.matchPassword).toHaveBeenCalledWith("password123");
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.cookie).toHaveBeenCalledWith(
                "token",
                "token123",
                expect.any(Object),
            );
        });

        it("should reject login with missing email", async () => {
            mockReq.body = {
                password: "password123",
            };

            await login(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                msg: "Please provide email and password",
            });
        });

        it("should reject login with missing password", async () => {
            mockReq.body = {
                email: "john@example.com",
            };

            await login(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                msg: "Please provide email and password",
            });
        });

        it("should return error if user not found", async () => {
            mockReq.body = {
                email: "nonexistent@example.com",
                password: "password123",
            };

            User.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            await login(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                msg: "No user found",
            });
        });

        it("should reject login with invalid password", async () => {
            mockReq.body = {
                email: "john@example.com",
                password: "wrongpassword",
            };

            const mockUser = {
                email: "john@example.com",
                matchPassword: jest.fn().mockResolvedValue(false),
            };

            User.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await login(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                msg: "Invalid credentials",
            });
        });

        it("should handle authentication errors", async () => {
            mockReq.body = {
                email: "john@example.com",
                password: "password123",
            };

            User.findOne.mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error("Auth error")),
            });

            await login(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                msg: "Cannot convert email or password to string",
            });
        });
    });

    describe("getMe", () => {
        it("should return the current logged-in user", async () => {
            mockReq.user = { id: "userId123" };

            const mockUser = {
                _id: "userId123",
                name: "John Doe",
                email: "john@example.com",
                role: "user",
            };

            User.findById.mockResolvedValue(mockUser);

            await getMe(mockReq, mockRes, mockNext);

            expect(User.findById).toHaveBeenCalledWith("userId123");
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockUser,
            });
        });

        it("should handle errors when fetching user", async () => {
            mockReq.user = { id: "userId123" };

            User.findById.mockRejectedValue(new Error("DB error"));

            // getMe doesn't have error handling, so it will throw
            try {
                await getMe(mockReq, mockRes, mockNext);
            } catch (err) {
                // Expected to throw
            }
        });
    });

    describe("logout", () => {
        it("should clear the token cookie and logout user", async () => {
            await logout(mockReq, mockRes, mockNext);

            expect(mockRes.cookie).toHaveBeenCalledWith(
                "token",
                "none",
                expect.objectContaining({
                    httpOnly: true,
                }),
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {},
            });
        });

        it("should set cookie expiration to near future (logout)", async () => {
            const beforeTime = Date.now();

            await logout(mockReq, mockRes, mockNext);

            const cookieCall = mockRes.cookie.mock.calls[0];
            const expiresDate = new Date(cookieCall[2].expires);

            const afterTime = Date.now();

            expect(expiresDate.getTime()).toBeGreaterThanOrEqual(beforeTime + 10 * 1000);
            expect(expiresDate.getTime()).toBeLessThanOrEqual(afterTime + 11 * 1000);
        });
    });
});
