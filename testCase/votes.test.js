/**
 * Votes Controller Tests
 * Tests for voting functionality: upvote, downvote, and vote summary
 */

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

describe("Votes Controller", () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            params: { bookingId: "bookingId123" },
            user: { id: "userId123" },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("addUpvote", () => {
        it("should add an upvote to a review", async () => {
            const mockBooking = {
                _id: "bookingId123",
                review: { rating: 5 },
            };

            const mockUpvote = {
                _id: "voteId123",
                user: "userId123",
                booking: "bookingId123",
                voteType: "upvote",
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOne.mockResolvedValue(null); // No existing upvote
            Vote.deleteOne.mockResolvedValue({ deletedCount: 0 }); // No downvote to remove
            Vote.create.mockResolvedValue(mockUpvote);

            await addUpvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockUpvote,
            });
        });

        it("should replace downvote with upvote", async () => {
            const mockBooking = {
                _id: "bookingId123",
                review: { rating: 4 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOne.mockResolvedValue(null); // No existing upvote
            Vote.deleteOne.mockResolvedValue({ deletedCount: 1 }); // Downvote removed
            Vote.create.mockResolvedValue({
                voteType: "upvote",
            });

            await addUpvote(mockReq, mockRes, mockNext);

            expect(Vote.deleteOne).toHaveBeenCalledWith({
                user: "userId123",
                booking: "bookingId123",
                voteType: "downvote",
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it("should return 400 if already upvoted", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOne.mockResolvedValue({ voteType: "upvote" }); // Already upvoted

            await addUpvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it("should return 404 if booking not found", async () => {
            Booking.findById.mockResolvedValue(null);

            await addUpvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should return 404 if no review exists", async () => {
            const mockBooking = {
                review: null,
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await addUpvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should handle database errors", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOne.mockRejectedValue(new Error("DB error"));

            await addUpvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("removeUpvote", () => {
        it("should remove an upvote", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOneAndDelete.mockResolvedValue({ _id: "voteId123" });

            await removeUpvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: "Upvote removed successfully",
                }),
            );
        });

        it("should return 404 if upvote not found", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOneAndDelete.mockResolvedValue(null);

            await removeUpvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should handle database errors", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOneAndDelete.mockRejectedValue(new Error("DB error"));

            await removeUpvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("addDownvote", () => {
        it("should add a downvote to a review", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            const mockDownvote = {
                _id: "voteId456",
                voteType: "downvote",
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOne.mockResolvedValue(null); // No existing downvote
            Vote.deleteOne.mockResolvedValue({ deletedCount: 0 });
            Vote.create.mockResolvedValue(mockDownvote);

            await addDownvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockDownvote,
            });
        });

        it("should return 400 if already downvoted", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOne.mockResolvedValue({ voteType: "downvote" });

            await addDownvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it("should handle database errors", async () => {
            Booking.findById.mockRejectedValue(new Error("DB error"));

            await addDownvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("removeDownvote", () => {
        it("should remove a downvote", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOneAndDelete.mockResolvedValue({ _id: "voteId456" });

            await removeDownvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: "Downvote removed successfully",
                }),
            );
        });

        it("should return 404 if downvote not found", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.findOneAndDelete.mockResolvedValue(null);

            await removeDownvote(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe("getUpvoteCount", () => {
        it("should return upvote count for a review", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments.mockResolvedValue(7);

            await getUpvoteCount(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    bookingId: "bookingId123",
                    upvoteCount: 7,
                },
            });
        });

        it("should return 0 upvotes if none exist", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments.mockResolvedValue(0);

            await getUpvoteCount(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    bookingId: "bookingId123",
                    upvoteCount: 0,
                },
            });
        });

        it("should handle database errors", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments.mockRejectedValue(new Error("DB error"));

            await getUpvoteCount(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("getDownvoteCount", () => {
        it("should return downvote count for a review", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments.mockResolvedValue(3);

            await getDownvoteCount(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    bookingId: "bookingId123",
                    downvoteCount: 3,
                },
            });
        });

        it("should handle database errors", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments.mockRejectedValue(new Error("DB error"));

            await getDownvoteCount(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("getVoteSummary", () => {
        it("should return vote summary for authenticated user", async () => {
            mockReq.user = { id: "userId123" };

            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments
                .mockResolvedValueOnce(10) // upvoteCount
                .mockResolvedValueOnce(2); // downvoteCount

            Vote.findOne.mockResolvedValue({
                voteType: "upvote",
            });

            await getVoteSummary(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    bookingId: "bookingId123",
                    upvoteCount: 10,
                    downvoteCount: 2,
                    userVote: "upvote",
                },
            });
        });

        it("should return null userVote for unauthenticated user", async () => {
            mockReq.user = null;

            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments
                .mockResolvedValueOnce(8) // upvoteCount
                .mockResolvedValueOnce(1); // downvoteCount

            await getVoteSummary(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    bookingId: "bookingId123",
                    upvoteCount: 8,
                    downvoteCount: 1,
                    userVote: null,
                },
            });
        });

        it("should return null userVote if user hasn't voted", async () => {
            const mockBooking = {
                review: { rating: 5 },
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Vote.countDocuments
                .mockResolvedValueOnce(5) // upvoteCount
                .mockResolvedValueOnce(3); // downvoteCount

            Vote.findOne.mockResolvedValue(null); // User hasn't voted

            await getVoteSummary(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    bookingId: "bookingId123",
                    upvoteCount: 5,
                    downvoteCount: 3,
                    userVote: null,
                },
            });
        });

        it("should return 404 if booking not found", async () => {
            Booking.findById.mockResolvedValue(null);

            await getVoteSummary(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should return 404 if no review exists", async () => {
            const mockBooking = {
                review: null,
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await getVoteSummary(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should handle database errors", async () => {
            Booking.findById.mockRejectedValue(new Error("DB error"));

            await getVoteSummary(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
