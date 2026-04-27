jest.mock("../../../models/User");

const User = require("../../../models/User");
const {
    editProfileField,
    uploadAvatar,
} = require("../../../controllers/profile");
const { createMockRes } = require("../../testHelpers");

describe("US2-2 Add profile information", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("adds a new custom profile field", async () => {
        const req = {
            body: { key: "facebook", value: "alice.fb" },
            user: {
                profile: { fields: [] },
                save: jest.fn().mockResolvedValue(),
            },
        };
        const res = createMockRes();

        await editProfileField(req, res);

        expect(req.user.profile.fields).toEqual([
            { key: "facebook", value: "alice.fb" },
        ]);
        expect(req.user.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("uploads avatar from base64 payload", async () => {
        const imageBase64 = Buffer.from("binary-image").toString("base64");
        const req = {
            user: { id: "user-1" },
            body: {
                image: imageBase64,
                contentType: "image/png",
            },
        };
        const res = createMockRes();

        const userDoc = {
            profile: {},
            save: jest.fn().mockResolvedValue(),
        };

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(userDoc),
        });

        await uploadAvatar(req, res);

        expect(userDoc.save).toHaveBeenCalled();
        expect(userDoc.profile.avatar.contentType).toBe("image/png");
        expect(Buffer.isBuffer(userDoc.profile.avatar.data)).toBe(true);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                contentType: "image/png",
                size: Buffer.from("binary-image").length,
            },
        });
    });

    it("rejects avatar upload with unsupported image type", async () => {
        const imageBase64 = Buffer.from("binary-image").toString("base64");
        const req = {
            user: { id: "user-1" },
            body: {
                image: imageBase64,
                contentType: "text/plain",
            },
        };
        const res = createMockRes();

        await uploadAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Unsupported image type.",
        });
    });
});
