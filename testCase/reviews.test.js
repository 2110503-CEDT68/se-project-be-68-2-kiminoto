jest.mock("../models/Booking");
jest.mock("../models/Vote");

const Booking = require("../models/Booking");
const Vote = require("../models/Vote");

const { addReview, updateReview, deleteReview } = require("../controllers/reviews");

describe("Reviews Controller - Full Coverage", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            params: { bookingId: "b1" },
            body: { rating: 5, comment: "Great!" },
            user: { id: "u1", role: "user" },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("addReview", () => {
        it("should add review to completed booking", async () => {
            const mockBooking = {
                _id: "b1",
                user: "u1",
                status: "completed",
                review: undefined,
                save: jest.fn().mockResolvedValue({
                    _id: "b1",
                    review: { rating: 5, comment: "Great!" },
                }),
            };

            Booking.findById.mockResolvedValue(mockBooking);
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "APPROVED|" } }],
                }),
            });

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockBooking.save).toHaveBeenCalled();
        });

        it("should allow admin to review any booking", async () => {
            mockReq.user = { id: "admin1", role: "admin" };

            const mockBooking = {
                _id: "b1",
                user: "u1",
                status: "completed",
                review: undefined,
                save: jest.fn().mockResolvedValue({}),
            };

            Booking.findById.mockResolvedValue(mockBooking);
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "APPROVED|" } }],
                }),
            });

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it("should reject if booking not found", async () => {
            Booking.findById.mockResolvedValue(null);

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should reject if not booking owner and not admin", async () => {
            mockReq.user.id = "u2";

            const mockBooking = { user: "u1", status: "completed" };
            Booking.findById.mockResolvedValue(mockBooking);

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it("should reject if booking not completed", async () => {
            const mockBooking = { user: "u1", status: "pending" };
            Booking.findById.mockResolvedValue(mockBooking);

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("completed"),
                }),
            );
        });

        it("should reject if review already exists", async () => {
            const mockBooking = {
                user: "u1",
                status: "completed",
                review: { rating: 3 },
            };
            Booking.findById.mockResolvedValue(mockBooking);

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it("should validate rating (0 or negative)", async () => {
            mockReq.body.rating = -1;

            const mockBooking = { user: "u1", status: "completed", review: undefined };
            Booking.findById.mockResolvedValue(mockBooking);

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it("should validate rating (> 5)", async () => {
            mockReq.body.rating = 6;

            const mockBooking = { user: "u1", status: "completed", review: undefined };
            Booking.findById.mockResolvedValue(mockBooking);

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it("should require both rating and comment", async () => {
            mockReq.body = { rating: 5 };

            const mockBooking = { user: "u1", status: "completed", review: undefined };
            Booking.findById.mockResolvedValue(mockBooking);

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it("should handle content moderation rejection", async () => {
            const mockBooking = {
                user: "u1",
                status: "completed",
                review: undefined,
            };

            Booking.findById.mockResolvedValue(mockBooking);
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "REJECTED|Offensive language" } }],
                }),
            });

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("rejected"),
                }),
            );
        });

        it("should handle moderation API error", async () => {
            const mockBooking = { user: "u1", status: "completed", review: undefined };
            Booking.findById.mockResolvedValue(mockBooking);
            global.fetch.mockRejectedValue(new Error("API failed"));

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });

        it("should handle database save error", async () => {
            const mockBooking = { user: "u1", status: "completed", review: undefined };
            Booking.findById.mockResolvedValue(mockBooking);
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "APPROVED|" } }],
                }),
            });
            mockBooking.save = jest.fn().mockRejectedValue(new Error("Save failed"));

            await addReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("updateReview", () => {
        it("should update existing review", async () => {
            const mockBooking = {
                user: "u1",
                review: { rating: 3, comment: "Old" },
                save: jest.fn().mockResolvedValue({}),
            };

            Booking.findById.mockResolvedValue(mockBooking);
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "APPROVED|" } }],
                }),
            });

            await updateReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockBooking.save).toHaveBeenCalled();
        });

        it("should allow admin to update any review", async () => {
            mockReq.user = { id: "admin1", role: "admin" };

            const mockBooking = {
                user: "u2",
                review: { rating: 3 },
                save: jest.fn().mockResolvedValue({}),
            };

            Booking.findById.mockResolvedValue(mockBooking);
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "APPROVED|" } }],
                }),
            });

            await updateReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should reject if booking not found", async () => {
            Booking.findById.mockResolvedValue(null);

            await updateReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should reject if not authorized", async () => {
            mockReq.user.id = "u2";

            const mockBooking = { user: "u1", review: { rating: 3 } };
            Booking.findById.mockResolvedValue(mockBooking);

            await updateReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it("should reject if no review exists", async () => {
            const mockBooking = { user: "u1", review: undefined };
            Booking.findById.mockResolvedValue(mockBooking);

            await updateReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should update only rating if no comment provided", async () => {
            mockReq.body = { rating: 4 };

            const mockBooking = {
                user: "u1",
                review: { rating: 3, comment: "Original" },
                save: jest.fn().mockResolvedValue({}),
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await updateReview(mockReq, mockRes);

            expect(mockBooking.review.rating).toBe(4);
            expect(mockBooking.review.comment).toBe("Original");
        });

        it("should validate and moderate new comment", async () => {
            mockReq.body = { comment: "Updated comment" };

            const mockBooking = {
                user: "u1",
                review: { rating: 3, comment: "Old" },
                save: jest.fn().mockResolvedValue({}),
            };

            Booking.findById.mockResolvedValue(mockBooking);
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "APPROVED|" } }],
                }),
            });

            await updateReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should handle moderation rejection on update", async () => {
            mockReq.body = { comment: "Bad comment" };

            const mockBooking = { user: "u1", review: { rating: 3 } };
            Booking.findById.mockResolvedValue(mockBooking);
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "REJECTED|Bad" } }],
                }),
            });

            await updateReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it("should handle save error", async () => {
            const mockBooking = {
                user: "u1",
                review: { rating: 3 },
                save: jest.fn().mockRejectedValue(new Error("Save failed")),
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await updateReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("deleteReview", () => {
        it("should delete existing review", async () => {
            const mockBooking = {
                user: "u1",
                review: { rating: 5 },
                save: jest.fn().mockResolvedValue({}),
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await deleteReview(mockReq, mockRes);

            expect(mockBooking.review).toBeUndefined();
            expect(mockBooking.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should allow admin to delete any review", async () => {
            mockReq.user = { id: "admin1", role: "admin" };

            const mockBooking = {
                user: "u2",
                review: { rating: 5 },
                save: jest.fn().mockResolvedValue({}),
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await deleteReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should reject if booking not found", async () => {
            Booking.findById.mockResolvedValue(null);

            await deleteReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should reject if not authorized", async () => {
            mockReq.user.id = "u2";

            const mockBooking = { user: "u1", review: { rating: 5 } };
            Booking.findById.mockResolvedValue(mockBooking);

            await deleteReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it("should reject if no review exists", async () => {
            const mockBooking = { user: "u1", review: undefined };
            Booking.findById.mockResolvedValue(mockBooking);

            await deleteReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should reject if review rating is null", async () => {
            const mockBooking = { user: "u1", review: { rating: null } };
            Booking.findById.mockResolvedValue(mockBooking);

            await deleteReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should handle save error", async () => {
            const mockBooking = {
                user: "u1",
                review: { rating: 5 },
                save: jest.fn().mockRejectedValue(new Error("Save failed")),
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await deleteReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });

        it("should handle database error", async () => {
            Booking.findById.mockRejectedValue(new Error("DB error"));

            await deleteReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
