jest.mock("../../models/Booking");

const Booking = require("../../models/Booking");
const {
    addReview,
    updateReview,
    deleteReview,
} = require("../../controllers/reviews");
const { createMockRes } = require("../testHelpers");

describe("Additional - Reviews controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    describe("addReview", () => {
        it("adds review for completed booking with approved moderation", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: { rating: 5, comment: "Very good service" },
            };
            const res = createMockRes();

            const booking = {
                user: "user-1",
                status: "completed",
                review: undefined,
                save: jest.fn().mockResolvedValue(),
            };

            Booking.findById.mockResolvedValue(booking);
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "APPROVED|" } }],
                }),
            });

            await addReview(req, res);

            expect(booking.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("returns 401 when user is not booking owner", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-2", role: "user" },
                body: { rating: 5, comment: "Very good service" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                user: "user-1",
                status: "completed",
                review: undefined,
            });

            await addReview(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("returns 400 when booking is not completed", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: { rating: 5, comment: "Very good service" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                user: "user-1",
                status: "active",
                review: undefined,
            });

            await addReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "You can only review a completed booking",
            });
        });

        it("returns 400 when review already exists", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: { rating: 5, comment: "Very good service" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                user: "user-1",
                status: "completed",
                review: { rating: 4, comment: "old" },
            });

            await addReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 400 for invalid review payload", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: { rating: 0, comment: "" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                user: "user-1",
                status: "completed",
                review: undefined,
            });

            await addReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 400 when moderation rejects review", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: { rating: 5, comment: "bad comment" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                user: "user-1",
                status: "completed",
                review: undefined,
            });
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "REJECTED|Offensive language" } }],
                }),
            });

            await addReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("rejected"),
                }),
            );
        });

        it("returns 500 when moderation API fails", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: { rating: 5, comment: "Great" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                user: "user-1",
                status: "completed",
                review: undefined,
            });
            global.fetch.mockRejectedValue(new Error("api down"));

            await addReview(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error during content moderation",
            });
        });
    });

    describe("updateReview", () => {
        it("updates rating without moderation when comment is missing", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: { rating: 2 },
            };
            const res = createMockRes();

            const booking = {
                user: "user-1",
                review: { rating: 5, comment: "old", updatedAt: new Date() },
                save: jest.fn().mockResolvedValue(),
            };
            Booking.findById.mockResolvedValue(booking);

            await updateReview(req, res);

            expect(global.fetch).not.toHaveBeenCalled();
            expect(booking.review.rating).toBe(2);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("returns 400 when updated comment is rejected", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: { comment: "new bad comment" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                user: "user-1",
                review: { rating: 4, comment: "old" },
            });
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "REJECTED|Toxic" } }],
                }),
            });

            await updateReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 404 when review does not exist for update", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: { rating: 2 },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                user: "user-1",
                review: undefined,
            });

            await updateReview(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("deleteReview", () => {
        it("deletes existing review", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
            };
            const res = createMockRes();

            const booking = {
                user: "user-1",
                review: { rating: 4, comment: "ok" },
                save: jest.fn().mockResolvedValue(),
            };
            Booking.findById.mockResolvedValue(booking);

            await deleteReview(req, res);

            expect(booking.review).toBeUndefined();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
        });

        it("returns 404 when no review exists for delete", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-1", role: "user" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                user: "user-1",
                review: undefined,
            });

            await deleteReview(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("returns 401 when non-owner deletes review", async () => {
            const req = {
                params: { bookingId: "booking-1" },
                user: { id: "user-2", role: "user" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({
                user: "user-1",
                review: { rating: 4, comment: "ok" },
            });

            await deleteReview(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });
});
