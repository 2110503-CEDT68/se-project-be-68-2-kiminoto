jest.mock("../models/Vote");
jest.mock("../models/Booking");

const Vote = require("../models/Vote");
const Booking = require("../models/Booking");

const {
    addUpvote,
    removeUpvote,
    addDownvote,
    removeDownvote,
    getUpvoteCount,
    getDownvoteCount,
    getVoteSummary,
} = require("../controllers/votes");

describe("Votes Full Coverage", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            params: { bookingId: "b1" },
            user: { id: "u1" },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // =========================================
    // addDownvote
    // =========================================
    describe("addDownvote", () => {
        it("should return 404 when booking not found (line 14)", async () => {
            Booking.findById.mockResolvedValue(null);

            await addDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No booking with the id of b1",
            });
        });

        it("should return 404 when no review exists (line 21)", async () => {
            Booking.findById.mockResolvedValue({ review: null });

            await addDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No review exists for this booking",
            });
        });

        it("should return 404 when review rating is null (line 21)", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: null } });

            await addDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should return 500 on database error", async () => {
            Booking.findById.mockRejectedValue(new Error("DB error"));

            await addDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error adding downvote",
            });
        });

        it("should replace upvote with downvote", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOne.mockResolvedValue(null);
            Vote.deleteOne.mockResolvedValue({ deletedCount: 1 });
            Vote.create.mockResolvedValue({ voteType: "downvote" });

            await addDownvote(mockReq, mockRes);

            expect(Vote.deleteOne).toHaveBeenCalledWith({
                user: "u1",
                booking: "b1",
                voteType: "upvote",
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it("should return 500 on Vote.create failure", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOne.mockResolvedValue(null);
            Vote.deleteOne.mockResolvedValue({});
            Vote.create.mockRejectedValue(new Error("Create failed"));

            await addDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error adding downvote",
            });
        });
    });

    // =========================================
    // removeDownvote — covers LINE 72
    // =========================================
    describe("removeDownvote", () => {
        it("should return 404 when booking not found (line 72)", async () => {
            Booking.findById.mockResolvedValue(null);

            await removeDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No booking with the id of b1",
            });
        });

        it("should return 404 when review has null rating", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: null } });

            await removeDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should return 404 when no review exists", async () => {
            Booking.findById.mockResolvedValue({ review: null });

            await removeDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should return 404 when downvote not found to remove", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOneAndDelete.mockResolvedValue(null);

            await removeDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should return 500 on database error", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOneAndDelete.mockRejectedValue(new Error("DB error"));

            await removeDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error removing downvote",
            });
        });
    });

    // =========================================
    // removeUpvote — covers LINES 217, 224
    // =========================================
    describe("removeUpvote", () => {
        it("should return 404 when booking not found (line 217)", async () => {
            Booking.findById.mockResolvedValue(null);

            await removeUpvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No booking with the id of b1",
            });
        });

        it("should return 404 when no review exists (line 224)", async () => {
            Booking.findById.mockResolvedValue({ review: null });

            await removeUpvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No review exists for this booking",
            });
        });

        it("should return 404 when review rating is null (line 224)", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: null } });

            await removeUpvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should return 500 on database error", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOneAndDelete.mockRejectedValue(new Error("DB error"));

            await removeUpvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error removing upvote",
            });
        });
    });

    // =========================================
    // getUpvoteCount — covers LINE 263
    // =========================================
    describe("getUpvoteCount", () => {
        it("should return 404 when booking not found (line 263)", async () => {
            Booking.findById.mockResolvedValue(null);

            await getUpvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No booking with the id of b1",
            });
        });

        it("should return 404 when no review exists", async () => {
            Booking.findById.mockResolvedValue({ review: null });

            await getUpvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should return upvote count successfully", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.countDocuments.mockResolvedValue(7);

            await getUpvoteCount(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: { bookingId: "b1", upvoteCount: 7 },
            });
        });

        it("should return 500 on database error", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.countDocuments.mockRejectedValue(new Error("DB error"));

            await getUpvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error fetching upvote count",
            });
        });
    });

    // =========================================
    // getDownvoteCount — covers LINE 125
    // =========================================
    describe("getDownvoteCount", () => {
        it("should return 404 when booking not found", async () => {
            Booking.findById.mockResolvedValue(null);

            await getDownvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should return 404 when no review exists (line 125)", async () => {
            Booking.findById.mockResolvedValue({ review: null });

            await getDownvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No review exists for this booking",
            });
        });

        it("should return 404 when review rating is null (line 125)", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: null } });

            await getDownvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should return downvote count successfully", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.countDocuments.mockResolvedValue(3);

            await getDownvoteCount(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: { bookingId: "b1", downvoteCount: 3 },
            });
        });

        it("should return 500 on database error", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.countDocuments.mockRejectedValue(new Error("DB error"));

            await getDownvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error fetching downvote count",
            });
        });
    });

    // =========================================
    // getVoteSummary
    // =========================================
    describe("getVoteSummary", () => {
        it("should return 500 on database error", async () => {
            Booking.findById.mockRejectedValue(new Error("DB error"));

            await getVoteSummary(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error fetching vote summary",
            });
        });
    });

    // =========================================
    // addUpvote
    // =========================================
    describe("addUpvote", () => {
        it("should return 500 on database error", async () => {
            Booking.findById.mockRejectedValue(new Error("DB error"));

            await addUpvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });

        it("should delete downvote when switching to upvote", async () => {
            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOne.mockResolvedValue(null);
            Vote.deleteOne.mockResolvedValue({ deletedCount: 1 });
            Vote.create.mockResolvedValue({ voteType: "upvote" });

            await addUpvote(mockReq, mockRes);

            expect(Vote.deleteOne).toHaveBeenCalledWith({
                user: "u1",
                booking: "b1",
                voteType: "downvote",
            });
            expect(Vote.create).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });
});
