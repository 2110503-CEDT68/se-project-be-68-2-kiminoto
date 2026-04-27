jest.mock("../../../models/Vote");
jest.mock("../../../models/Booking");

const Vote = require("../../../models/Vote");
const Booking = require("../../../models/Booking");
const {
    addUpvote,
    removeUpvote,
    getUpvoteCount,
} = require("../../../controllers/votes");
const { createMockRes } = require("../../testHelpers");

describe("US1-2 Upvote useful reviews", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("addUpvote", () => {
        it("adds an upvote and removes opposite vote", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                _id: "booking-1",
                review: { rating: 5 },
            });
            Vote.findOne.mockResolvedValue(null);
            Vote.deleteOne.mockResolvedValue({ deletedCount: 1 });
            Vote.create.mockResolvedValue({
                user: "user-1",
                booking: "booking-1",
                voteType: "upvote",
            });

            await addUpvote(req, res);

            expect(Vote.deleteOne).toHaveBeenCalledWith({
                user: "user-1",
                booking: "booking-1",
                voteType: "downvote",
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("blocks duplicate upvotes", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 4 } });
            Vote.findOne.mockResolvedValue({ voteType: "upvote" });

            await addUpvote(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "You have already upvoted this review",
            });
        });

        it("returns 404 when booking does not exist", async () => {
            const req = {
                params: { bookingId: "missing" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue(null);

            await addUpvote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("returns 404 when booking has no review", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: null });

            await addUpvote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("removeUpvote", () => {
        it("removes existing upvote", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOneAndDelete.mockResolvedValue({ _id: "vote-1" });

            await removeUpvote(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
                message: "Upvote removed successfully",
            });
        });

        it("returns 404 if user has never upvoted", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOneAndDelete.mockResolvedValue(null);

            await removeUpvote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("getUpvoteCount", () => {
        it("returns total upvote count for booking review", async () => {
            const req = { params: { bookingId: "booking-1" } };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.countDocuments.mockResolvedValue(7);

            await getUpvoteCount(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    bookingId: "booking-1",
                    upvoteCount: 7,
                },
            });
        });

        it("returns 500 when count query fails", async () => {
            const req = { params: { bookingId: "booking-1" } };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.countDocuments.mockRejectedValue(new Error("db broken"));

            await getUpvoteCount(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error fetching upvote count",
            });
        });
    });
});
