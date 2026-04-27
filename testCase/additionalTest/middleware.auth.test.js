jest.mock("jsonwebtoken");
jest.mock("../../models/User");

const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const {
    protect,
    optionalProtect,
    authorize,
} = require("../../middleware/auth");
const { createMockRes, createMockNext } = require("../testHelpers");

describe("Additional - Auth middleware", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-secret";
    });

    describe("protect", () => {
        it("returns 401 when token is missing", async () => {
            const req = { headers: {} };
            const res = createMockRes();
            const next = createMockNext();

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 401 when token is literal null", async () => {
            const req = {
                headers: { authorization: "Bearer null" },
            };
            const res = createMockRes();
            const next = createMockNext();

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it("sets req.user and calls next on valid token", async () => {
            const req = {
                headers: { authorization: "Bearer token-1" },
            };
            const res = createMockRes();
            const next = createMockNext();

            jwt.verify.mockReturnValue({ id: "user-1" });
            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    _id: "user-1",
                    role: "user",
                }),
            });

            await protect(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith("token-1", "test-secret");
            expect(req.user).toEqual({ _id: "user-1", role: "user" });
            expect(next).toHaveBeenCalledTimes(1);
        });

        it("returns 401 when jwt verification fails", async () => {
            const req = {
                headers: { authorization: "Bearer bad-token" },
            };
            const res = createMockRes();
            const next = createMockNext();

            jwt.verify.mockImplementation(() => {
                throw new Error("invalid token");
            });

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("optionalProtect", () => {
        it("continues without user when token is missing", async () => {
            const req = { headers: {} };
            const res = createMockRes();
            const next = createMockNext();

            await optionalProtect(req, res, next);

            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalledTimes(1);
        });

        it("sets req.user when token is valid", async () => {
            const req = {
                headers: { authorization: "Bearer token-1" },
            };
            const res = createMockRes();
            const next = createMockNext();

            jwt.verify.mockReturnValue({ id: "user-1" });
            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue({ _id: "user-1", role: "user" }),
            });

            await optionalProtect(req, res, next);

            expect(req.user).toEqual({ _id: "user-1", role: "user" });
            expect(next).toHaveBeenCalledTimes(1);
        });

        it("still continues when token is invalid", async () => {
            const req = {
                headers: { authorization: "Bearer bad-token" },
            };
            const res = createMockRes();
            const next = createMockNext();

            jwt.verify.mockImplementation(() => {
                throw new Error("invalid token");
            });

            await optionalProtect(req, res, next);

            expect(next).toHaveBeenCalledTimes(2);
        });
    });

    describe("authorize", () => {
        it("returns 403 for forbidden role", () => {
            const req = { user: { role: "user" } };
            const res = createMockRes();
            const next = createMockNext();

            const middleware = authorize("admin");
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it("calls next for allowed role", () => {
            const req = { user: { role: "admin" } };
            const res = createMockRes();
            const next = createMockNext();

            const middleware = authorize("admin", "user");
            middleware(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
        });
    });
});
