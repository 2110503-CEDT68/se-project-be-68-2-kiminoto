jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

function stubDbSave(userDoc) {
    userDoc.$__save = async function mockSave(options) {
        await this._execDocumentPreHooks("save", options, [options]);
        await this._execDocumentPostHooks("save", options);
    };
}

describe("Additional - User model methods", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-secret";
        process.env.JWT_EXPIRE = "7d";
    });

    it("signs jwt token with user id", () => {
        jwt.sign.mockReturnValue("token-1");
        const user = new User({
            name: "Alice",
            tel: "0000000000",
            email: "alice@example.com",
            password: "secret123",
        });

        const token = user.getSignedJwtToken();

        expect(jwt.sign).toHaveBeenCalledWith(
            { id: user._id },
            "test-secret",
            { expiresIn: "7d" },
        );
        expect(token).toBe("token-1");
    });

    it("checks password match using bcrypt.compare", async () => {
        bcrypt.compare.mockResolvedValue(true);
        const user = new User({
            name: "Alice",
            tel: "0000000000",
            email: "alice@example.com",
            password: "hashed-password",
        });

        const result = await user.matchPassword("plain-password");

        expect(bcrypt.compare).toHaveBeenCalledWith(
            "plain-password",
            "hashed-password",
        );
        expect(result).toBe(true);
    });

    it("hashes password in pre-save hook when password is modified", async () => {
        bcrypt.genSalt.mockResolvedValue("salt-1");
        bcrypt.hash.mockResolvedValue("hashed-password");

        const user = new User({
            name: "Alice",
            tel: "0000000000",
            email: "alice@example.com",
            password: "plain-password",
        });

        stubDbSave(user);
        await user.save();

        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(bcrypt.hash).toHaveBeenCalledWith("plain-password", "salt-1");
        expect(user.password).toBe("hashed-password");
    });

    it("skips hashing when password is not modified", async () => {
        const user = new User({
            name: "Alice",
            tel: "0000000000",
            email: "alice@example.com",
            password: "plain-password",
        });

        user.isModified = jest.fn().mockReturnValue(false);
        stubDbSave(user);
        await user.save();

        expect(bcrypt.genSalt).not.toHaveBeenCalled();
        expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("rejects validation when custom fields exceed limit", async () => {
        const user = new User({
            name: "Alice",
            tel: "0000000000",
            email: "alice@example.com",
            password: "plain-password",
            profile: {
                fields: [
                    { key: "k1", value: "v1" },
                    { key: "k2", value: "v2" },
                    { key: "k3", value: "v3" },
                    { key: "k4", value: "v4" },
                    { key: "k5", value: "v5" },
                    { key: "k6", value: "v6" },
                ],
            },
        });

        await expect(user.validate()).rejects.toThrow(
            "Custom fields length exceeds limit of 5.",
        );
    });

    it("passes validation when profile object is missing", async () => {
        const user = new User({
            name: "Alice",
            tel: "0000000000",
            email: "alice@example.com",
            password: "plain-password",
        });

        user.profile = undefined;

        await expect(user.validate()).resolves.toBeUndefined();
    });
});
