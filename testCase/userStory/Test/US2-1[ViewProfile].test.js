jest.mock("../../../models/User");

const User = require("../../../models/User");
const {
    getPublicProfile,
    getAvatar,
    getUserAvatar,
} = require("../../../controllers/profile");
const { getMe } = require("../../../controllers/auth");
const { createMockRes } = require("../../testHelpers");

describe("US2-1 View profile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns a public profile when user exists", async () => {
        const req = { params: { id: "user-1" } };
        const res = createMockRes();

        const user = {
            _id: "user-1",
            name: "Alice",
            email: "alice@example.com",
            tel: "0000000000",
            profile: { fields: [{ key: "line", value: "alice_line" }] },
        };

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(user),
        });

        await getPublicProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: user,
        });
    });

    it("returns 404 for missing public profile", async () => {
        const req = { params: { id: "missing-user" } };
        const res = createMockRes();

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        await getPublicProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "User not found.",
        });
    });

    it("returns 400 when public profile query fails", async () => {
        const req = { params: { id: "user-1" } };
        const res = createMockRes();

        User.findById.mockReturnValue({
            select: jest.fn().mockRejectedValue(new Error("db broken")),
        });

        await getPublicProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "db broken",
        });
    });

    it("returns current user profile data from auth/me", async () => {
        const req = { user: { id: "user-1" } };
        const res = createMockRes();

        const me = {
            _id: "user-1",
            name: "Alice",
            email: "alice@example.com",
            tel: "0000000000",
            profile: { fields: [] },
        };

        const select = jest.fn().mockResolvedValue(me);
        User.findById.mockReturnValue({ select });

        await getMe(req, res);

        expect(User.findById).toHaveBeenCalledWith("user-1");
        expect(select).toHaveBeenCalledWith({ "profile.avatar": 0 });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when my avatar does not exist", async () => {
        const req = { user: { id: "user-1" } };
        const res = createMockRes();

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: "user-1",
                profile: { avatar: {} },
            }),
        });

        await getAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Avatar not found.",
        });
    });

    it("returns avatar binary with proper headers", async () => {
        const req = { user: { id: "user-1" } };
        const res = createMockRes();
        const avatarData = Buffer.from("avatar-binary");

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: "user-1",
                profile: {
                    avatar: {
                        data: avatarData,
                        contentType: "image/png",
                    },
                },
            }),
        });

        await getAvatar(req, res);

        expect(res.set).toHaveBeenCalledWith("Content-Type", "image/png");
        expect(res.set).toHaveBeenCalledWith(
            "Cross-Origin-Resource-Policy",
            "cross-origin",
        );
        expect(res.set).toHaveBeenCalledWith("Cache-Control", "private, no-store");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(avatarData);
    });

    it("returns 400 when own avatar query fails", async () => {
        const req = { user: { id: "user-1" } };
        const res = createMockRes();

        User.findById.mockReturnValue({
            select: jest.fn().mockRejectedValue(new Error("db broken")),
        });

        await getAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "db broken",
        });
    });

    it("returns 404 for missing public avatar", async () => {
        const req = { params: { id: "user-2" } };
        const res = createMockRes();

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        await getUserAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns public avatar binary with public cache headers", async () => {
        const req = { params: { id: "user-2" } };
        const res = createMockRes();
        const avatarData = Buffer.from("public-avatar");

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: "user-2",
                profile: {
                    avatar: {
                        data: avatarData,
                        contentType: "image/jpeg",
                    },
                },
            }),
        });

        await getUserAvatar(req, res);

        expect(res.set).toHaveBeenCalledWith("Content-Type", "image/jpeg");
        expect(res.set).toHaveBeenCalledWith(
            "Cross-Origin-Resource-Policy",
            "cross-origin",
        );
        expect(res.set).toHaveBeenCalledWith("Cache-Control", "public, max-age=300");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(avatarData);
    });

    it("returns 400 when public avatar query fails", async () => {
        const req = { params: { id: "user-2" } };
        const res = createMockRes();

        User.findById.mockReturnValue({
            select: jest.fn().mockRejectedValue(new Error("db broken")),
        });

        await getUserAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "db broken",
        });
    });
});
