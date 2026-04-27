jest.mock("../../../models/User");

const User = require("../../../models/User");
const {
    deleteProfileField,
    deleteAvatar,
} = require("../../../controllers/profile");
const { createMockRes } = require("../../testHelpers");

describe("US2-4 Delete profile information", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("deletes an existing custom profile field", async () => {
        const req = {
            body: { key: "facebook" },
            user: {
                profile: {
                    fields: [
                        { key: "facebook", value: "alice.fb" },
                        { key: "line", value: "alice.line" },
                    ],
                },
                save: jest.fn().mockResolvedValue(),
            },
        };
        const res = createMockRes();

        await deleteProfileField(req, res);

        expect(req.user.profile.fields).toEqual([
            { key: "line", value: "alice.line" },
        ]);
        expect(req.user.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when deleting a non-existing field", async () => {
        const req = {
            body: { key: "facebook" },
            user: {
                profile: {
                    fields: [{ key: "line", value: "alice.line" }],
                },
                save: jest.fn().mockResolvedValue(),
            },
        };
        const res = createMockRes();

        await deleteProfileField(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Field not found.",
        });
        expect(req.user.save).not.toHaveBeenCalled();
    });

    it("deletes current user avatar", async () => {
        const req = { user: { id: "user-1" } };
        const res = createMockRes();

        const userDoc = {
            profile: {
                avatar: {
                    data: Buffer.from("avatar"),
                    contentType: "image/png",
                },
            },
            save: jest.fn().mockResolvedValue(),
        };

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(userDoc),
        });

        await deleteAvatar(req, res);

        expect(userDoc.profile.avatar).toEqual({});
        expect(userDoc.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when avatar does not exist", async () => {
        const req = { user: { id: "user-1" } };
        const res = createMockRes();

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                profile: { avatar: {} },
            }),
        });

        await deleteAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Avatar not found.",
        });
    });

    it("returns 400 when deleting avatar query fails", async () => {
        const req = { user: { id: "user-1" } };
        const res = createMockRes();

        User.findById.mockReturnValue({
            select: jest.fn().mockRejectedValue(new Error("db broken")),
        });

        await deleteAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "db broken",
        });
    });

    it("returns 400 when deleting existing field save fails", async () => {
        const req = {
            body: { key: "facebook" },
            user: {
                profile: {
                    fields: [{ key: "facebook", value: "alice.fb" }],
                },
                save: jest.fn().mockRejectedValue(new Error("db broken")),
            },
        };
        const res = createMockRes();

        await deleteProfileField(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "db broken",
        });
    });
});
