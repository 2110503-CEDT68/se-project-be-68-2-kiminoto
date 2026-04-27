jest.mock("../../../models/Vote");
jest.mock("../../../models/Booking");

const Vote = require("../../../models/Vote");
const Booking = require("../../../models/Booking");
const {
    addDownvote,
    removeDownvote,
    getDownvoteCount,
} = require("../../../controllers/votes");
const { createMockRes } = require("../../testHelpers");

describe("US1-3 Downvote unhelpful reviews", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("addDownvote", () => {
        it("adds a downvote and removes opposite vote", async () => {
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
                voteType: "downvote",
            });

            await addDownvote(req, res);

            expect(Vote.deleteOne).toHaveBeenCalledWith({
                user: "user-1",
                booking: "booking-1",
                voteType: "upvote",
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("blocks duplicate downvotes", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 4 } });
            Vote.findOne.mockResolvedValue({ voteType: "downvote" });

            await addDownvote(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "You have already downvoted this review",
            });
        });

        it("returns 404 when booking does not exist", async () => {
            const req = {
                params: { bookingId: "missing" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue(null);

            await addDownvote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("returns 404 when booking has no review", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: null });

            await addDownvote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("returns 500 when add downvote fails", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 4 } });
            Vote.findOne.mockRejectedValue(new Error("db broken"));

            await addDownvote(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error adding downvote",
            });
        });
    });

    describe("removeDownvote", () => {
        it("returns 404 when booking does not exist", async () => {
            const req = {
                params: { bookingId: "missing-booking" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue(null);

            await removeDownvote(req, res);

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

            await removeDownvote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No review exists for this booking",
            });
        });

        it("removes existing downvote", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOneAndDelete.mockResolvedValue({ _id: "vote-1" });

            await removeDownvote(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
                message: "Downvote removed successfully",
            });
        });

        it("returns 404 if user has never downvoted", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOneAndDelete.mockResolvedValue(null);

            await removeDownvote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("returns 500 when remove downvote query fails", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.findOneAndDelete.mockRejectedValue(new Error("db broken"));

            await removeDownvote(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error removing downvote",
            });
        });
    });

    describe("getDownvoteCount", () => {
        it("returns 404 when booking does not exist", async () => {
            const req = { params: { bookingId: "missing-booking" } };
            const res = createMockRes();

            Booking.findById.mockResolvedValue(null);

            await getDownvoteCount(req, res);

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

            await getDownvoteCount(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No review exists for this booking",
            });
        });

        it("returns total downvote count for booking review", async () => {
            const req = { params: { bookingId: "booking-1" } };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.countDocuments.mockResolvedValue(3);

            await getDownvoteCount(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    bookingId: "booking-1",
                    downvoteCount: 3,
                },
            });
        });

        it("returns 500 when count query fails", async () => {
            const req = { params: { bookingId: "booking-1" } };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ review: { rating: 5 } });
            Vote.countDocuments.mockRejectedValue(new Error("db broken"));

            await getDownvoteCount(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error fetching downvote count",
            });
        });
    });
});
