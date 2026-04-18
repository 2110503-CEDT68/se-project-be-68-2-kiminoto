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

    describe("addUpvote - Error Paths", () => {
        it("should throw on booking.findById error", async () => {
            Booking.findById.mockRejectedValue(new Error("DB error"));

            await addUpvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });

        it("should delete downvote first when switching votes", async () => {
            const mockBooking = {
                _id: "b1",
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOne.mockResolvedValue(null); // No existing upvote
            Vote.deleteOne.mockResolvedValue({ deletedCount: 1 }); // Downvote deleted
            Vote.create.mockResolvedValue({ voteType: "upvote" });

            await addUpvote(mockReq, mockRes);

            expect(Vote.deleteOne).toHaveBeenCalledWith({
                user: "u1",
                booking: "b1",
                voteType: "downvote",
            });
            expect(Vote.create).toHaveBeenCalled();
        });
    });

    describe("removeUpvote - Error Paths", () => {
        it("should error when database fails on find", async () => {
            const mockBooking = { review: { rating: 5 } };
            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOneAndDelete.mockRejectedValue(new Error("DB error"));

            await removeUpvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("addDownvote - Error Paths", () => {
        it("should handle booking not found on downvote", async () => {
            Booking.findById.mockResolvedValue(null);

            await addDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should handle review not found on downvote", async () => {
            const mockBooking = { review: null };
            Booking.findById.mockResolvedValue(mockBooking);

            await addDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should replace upvote with downvote", async () => {
            const mockBooking = { review: { rating: 5 } };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOne.mockResolvedValue(null); // No existing downvote
            Vote.deleteOne.mockResolvedValue({ deletedCount: 1 }); // Upvote deleted
            Vote.create.mockResolvedValue({ voteType: "downvote" });

            await addDownvote(mockReq, mockRes);

            expect(Vote.deleteOne).toHaveBeenCalledWith({
                user: "u1",
                booking: "b1",
                voteType: "upvote",
            });
        });

        it("should error on database creation failure", async () => {
            const mockBooking = { review: { rating: 5 } };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOne.mockResolvedValue(null);
            Vote.deleteOne.mockResolvedValue({ deletedCount: 0 });
            Vote.create.mockRejectedValue(new Error("Create failed"));

            await addDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("removeDownvote - Error Paths", () => {
        it("should handle booking.findById error", async () => {
            Booking.findById.mockRejectedValue(new Error("DB error"));

            await removeDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });

        it("should handle review not found", async () => {
            const mockBooking = { review: { rating: null } };
            Booking.findById.mockResolvedValue(mockBooking);

            await removeDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should handle downvote not found to remove", async () => {
            const mockBooking = { review: { rating: 5 } };
            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOneAndDelete.mockResolvedValue(null);

            await removeDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should error on database delete failure", async () => {
            const mockBooking = { review: { rating: 5 } };
            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOneAndDelete.mockRejectedValue(new Error("Delete failed"));

            await removeDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("getUpvoteCount - All Paths", () => {
        it("should return upvote count", async () => {
            const mockBooking = { review: { rating: 5 } };
            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments.mockResolvedValue(7);

            await getUpvoteCount(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: { bookingId: "b1", upvoteCount: 7 },
            });
        });

        it("should handle null review on count", async () => {
            const mockBooking = { review: null };
            Booking.findById.mockResolvedValue(mockBooking);

            await getUpvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should handle count database error", async () => {
            const mockBooking = { review: { rating: 5 } };
            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments.mockRejectedValue(new Error("Count failed"));

            await getUpvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("getDownvoteCount - All Paths", () => {
        it("should return downvote count", async () => {
            const mockBooking = { review: { rating: 5 } };
            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments.mockResolvedValue(3);

            await getDownvoteCount(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: { bookingId: "b1", downvoteCount: 3 },
            });
        });

        it("should handle booking not found on count", async () => {
            Booking.findById.mockResolvedValue(null);

            await getDownvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should handle count database error", async () => {
            const mockBooking = { review: { rating: 5 } };
            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments.mockRejectedValue(new Error("Count failed"));

            await getDownvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("addDownvote - Specific Lines", () => {
        it("should handle database error on create (line 72)", async () => {
            const mockBooking = { review: { rating: 5 } };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOne.mockResolvedValue(null);
            Vote.deleteOne.mockResolvedValue({});
            Vote.create.mockRejectedValue(new Error("DB error"));

            await addDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error adding downvote"
            });
        });
    });

    describe("removeUpvote - Specific Lines", () => {
        it("should handle database error on remove (line 125)", async () => {
            const mockBooking = { review: { rating: 5 } };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOneAndDelete.mockRejectedValue(new Error("DB error"));

            await removeUpvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error removing upvote"
            });
        });
    });

    describe("removeDownvote - Specific Lines", () => {
        it("should handle database error on remove (line 217)", async () => {
            const mockBooking = { review: { rating: 5 } };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOneAndDelete.mockRejectedValue(new Error("DB error"));

            await removeDownvote(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error removing downvote"
            });
        });
    });

    describe("getDownvoteCount - Database Error", () => {
        it("should handle count error (line 224)", async () => {
            const mockBooking = { review: { rating: 5 } };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments.mockRejectedValue(new Error("DB error"));

            await getDownvoteCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error fetching downvote count"
            });
        });
    });

    describe("getVoteSummary - Database Error on Summary", () => {
        it("should handle error in summary aggregation (line 263)", async () => {
            Booking.findById.mockRejectedValue(new Error("DB error"));

            await getVoteSummary(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Error fetching vote summary"
            });
        });
    });
});
