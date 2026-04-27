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

        it("returns 500 when add upvote fails", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 4 } });
            Vote.findOne.mockRejectedValue(new Error("db broken"));

            await addUpvote(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error adding upvote",
            });
        });
    });

    describe("removeUpvote", () => {
        it("returns 404 when booking does not exist", async () => {
            const req = {
                params: { bookingId: "missing-booking" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue(null);

            await removeUpvote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No booking with the id of missing-booking",
            });
        });

        it("returns 404 when booking has no review", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: null });

            await removeUpvote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No review exists for this booking",
            });
        });

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

        it("returns 500 when remove upvote query fails", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOneAndDelete.mockRejectedValue(new Error("db broken"));

            await removeUpvote(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error removing upvote",
            });
        });
    });

    describe("getUpvoteCount", () => {
        it("returns 404 when booking does not exist", async () => {
            const req = { params: { bookingId: "missing-booking" } };
            const res = createMockRes();

            Booking.findById.mockResolvedValue(null);

            await getUpvoteCount(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No booking with the id of missing-booking",
            });
        });

        it("returns 404 when booking has no review", async () => {
            const req = { params: { bookingId: "booking-1" } };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: null });

            await getUpvoteCount(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No review exists for this booking",
            });
        });

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

    describe("getVoteSummary", () => {
        const { getVoteSummary } = require("../../../controllers/votes");

        it("returns 404 when booking does not exist", async () => {
            const req = {
                params: { bookingId: "missing-booking" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue(null);

            await getVoteSummary(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No booking with the id of missing-booking",
            });
        });

        it("returns 404 when booking has no review", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: null });

            await getVoteSummary(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No review exists for this booking",
            });
        });

        it("returns 500 when summary query fails", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.countDocuments.mockRejectedValue(new Error("db broken"));

            await getVoteSummary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error fetching vote summary",
            });
        });
    });
});
