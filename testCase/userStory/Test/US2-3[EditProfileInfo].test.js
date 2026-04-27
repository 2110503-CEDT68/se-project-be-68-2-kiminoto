jest.mock("../../../models/User");

const User = require("../../../models/User");
const {
    editProfileField,
    uploadAvatar,
} = require("../../../controllers/profile");
const { createMockRes } = require("../../testHelpers");

describe("US2-3 Edit profile information", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("edits an existing custom field instead of creating new one", async () => {
        const req = {
            body: { key: "line", value: "new-line-id" },
            user: {
                profile: {
                    fields: [
                        { key: "line", value: "old-line-id" },
                        { key: "instagram", value: "alice.ig" },
                    ],
                },
                save: jest.fn().mockResolvedValue(),
            },
        };
        const res = createMockRes();

        await editProfileField(req, res);

        expect(req.user.profile.fields).toEqual([
            { key: "line", value: "new-line-id" },
            { key: "instagram", value: "alice.ig" },
        ]);
        expect(req.user.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("replaces avatar using data URL payload", async () => {
        const pngData = Buffer.from("new-avatar-data").toString("base64");
        const req = {
            user: { id: "user-1" },
            body: {
                image: `data:image/webp;base64,${pngData}`,
            },
        };
        const res = createMockRes();

        const userDoc = {
            profile: {
                avatar: {
                    data: Buffer.from("old-avatar"),
                    contentType: "image/png",
                },
            },
            save: jest.fn().mockResolvedValue(),
        };

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(userDoc),
        });

        await uploadAvatar(req, res);

        expect(userDoc.save).toHaveBeenCalled();
        expect(userDoc.profile.avatar.contentType).toBe("image/webp");
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("rejects invalid data URL format during avatar edit", async () => {
        const req = {
            user: { id: "user-1" },
            body: {
                image: "data:image/png;notbase64,abc",
                contentType: "image/png",
            },
        };
        const res = createMockRes();

        await uploadAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Invalid data URL format.",
        });
    });

    it("returns 400 when saving edited profile field fails", async () => {
        const req = {
            body: { key: "line", value: "new-line-id" },
            user: {
                profile: {
                    fields: [{ key: "line", value: "old-line-id" }],
                },
                save: jest.fn().mockRejectedValue(new Error("db broken")),
            },
        };
        const res = createMockRes();

        await editProfileField(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "db broken",
        });
    });
});
