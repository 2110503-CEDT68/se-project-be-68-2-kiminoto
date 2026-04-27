jest.mock("../../models/User");

const User = require("../../models/User");
const {
    register,
    login,
    logout,
} = require("../../controllers/auth");
const { createMockRes } = require("../testHelpers");

describe("Additional - Auth controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_COOKIE_EXPIRE = "1";
        process.env.NODE_ENV = "test";
    });

    it("registers user and sends token cookie", async () => {
        const req = {
            body: {
                name: "Alice",
                tel: "0000000000",
                email: "alice@example.com",
                password: "secret123",
                role: "user",
            },
        };
        const res = createMockRes();

        User.create.mockResolvedValue({
            _id: "user-1",
            getSignedJwtToken: jest.fn().mockReturnValue("token-1"),
        });

        await register(req, res);

        expect(User.create).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.cookie).toHaveBeenCalledWith(
            "token",
            "token-1",
            expect.objectContaining({ httpOnly: true }),
        );
    });

    it("sets secure cookie flag in production", async () => {
        process.env.NODE_ENV = "production";

        const req = {
            body: {
                name: "Alice",
                tel: "0000000000",
                email: "alice@example.com",
                password: "secret123",
                role: "user",
            },
        };
        const res = createMockRes();

        User.create.mockResolvedValue({
            _id: "user-1",
            getSignedJwtToken: jest.fn().mockReturnValue("token-1"),
        });

        await register(req, res);

        expect(res.cookie).toHaveBeenCalledWith(
            "token",
            "token-1",
            expect.objectContaining({
                httpOnly: true,
                secure: true,
            }),
        );
    });

    it("returns 400 when register throws", async () => {
        const req = { body: { email: "dup@example.com" } };
        const res = createMockRes();

        User.create.mockRejectedValue(new Error("duplicate"));

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false });
    });

    it("returns 400 when login misses credentials", async () => {
        const req = { body: { email: "alice@example.com" } };
        const res = createMockRes();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            msg: "Please provide email and password",
        });
    });

    it("returns 400 when login user is missing", async () => {
        const req = {
            body: {
                email: "alice@example.com",
                password: "secret123",
            },
        };
        const res = createMockRes();

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            msg: "No user found",
        });
    });

    it("returns 401 when password does not match", async () => {
        const req = {
            body: {
                email: "alice@example.com",
                password: "wrong",
            },
        };
        const res = createMockRes();

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                matchPassword: jest.fn().mockResolvedValue(false),
            }),
        });

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            msg: "Invalid credentials",
        });
    });

    it("logs in and sends token cookie", async () => {
        const req = {
            body: {
                email: "alice@example.com",
                password: "secret123",
            },
        };
        const res = createMockRes();

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                matchPassword: jest.fn().mockResolvedValue(true),
                getSignedJwtToken: jest.fn().mockReturnValue("token-2"),
            }),
        });

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.cookie).toHaveBeenCalledWith(
            "token",
            "token-2",
            expect.any(Object),
        );
    });

    it("returns 401 when login throws", async () => {
        const req = {
            body: {
                email: "alice@example.com",
                password: "secret123",
            },
        };
        const res = createMockRes();

        User.findOne.mockReturnValue({
            select: jest.fn().mockRejectedValue(new Error("bad cast")),
        });

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            msg: "Cannot convert email or password to string",
        });
    });

    it("clears auth cookie on logout", async () => {
        const req = {};
        const res = createMockRes();

        await logout(req, res);

        expect(res.cookie).toHaveBeenCalledWith(
            "token",
            "none",
            expect.objectContaining({ httpOnly: true }),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
