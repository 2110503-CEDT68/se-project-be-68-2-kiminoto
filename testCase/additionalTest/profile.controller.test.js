jest.mock("../../models/User");

const { editProfileField } = require("../../controllers/profile");
const { createMockRes } = require("../testHelpers");

const createMockUser = (fields = []) => ({
    profile: { fields: [...fields] },
    save: jest.fn().mockResolvedValue(true),
});

const createReq = (key, value, fields = []) => ({
    body: { key, value },
    user: createMockUser(fields),
});

describe("Profile controller - editProfileField validation", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("instagram", () => {
        it("accepts valid instagram username", async () => {
            const req = createReq("instagram", "valid.username");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("rejects instagram username with spaces", async () => {
            const req = createReq("instagram", "invalid username");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false }),
            );
        });

        it("rejects instagram username with consecutive dots", async () => {
            const req = createReq("instagram", "user..name");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("rejects instagram username ending with dot", async () => {
            const req = createReq("ig", "username.");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("facebook", () => {
        it("accepts valid facebook name", async () => {
            const req = createReq("facebook", "John Doe");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("rejects facebook name shorter than 5 characters", async () => {
            const req = createReq("facebook", "Jo");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("rejects facebook name with special characters", async () => {
            const req = createReq("fb", "John@Doe!");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("line", () => {
        it("accepts valid LINE ID", async () => {
            const req = createReq("line", "myline_id");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("rejects LINE ID shorter than 4 characters", async () => {
            const req = createReq("line", "ab");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("rejects LINE ID with uppercase letters", async () => {
            const req = createReq("lineid", "MyLineID");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("rejects LINE ID longer than 20 characters", async () => {
            const req = createReq("line", "a".repeat(21));
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("displayname", () => {
        it("accepts valid display name", async () => {
            const req = createReq("displayname", "John Doe");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("rejects display name shorter than 2 characters", async () => {
            const req = createReq("displayname", "J");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("rejects display name longer than 40 characters", async () => {
            const req = createReq("nickname", "a".repeat(41));
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("custom field (no type validation)", () => {
        it("accepts any value for unknown field type", async () => {
            const req = createReq("website", "anything goes here!!");
            const res = createMockRes();
            await editProfileField(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
