jest.mock("../models/CarProvider");
jest.mock("../models/Booking");
jest.mock("../models/Vote");

const CarProvider = require("../models/CarProvider");
const Booking = require("../models/Booking");
const Vote = require("../models/Vote");

const { getCarProviderReviews } = require("../controllers/carProviders");
const { addReview } = require("../controllers/reviews");

describe("CarProvider Reviews", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            params: { id: "providerId1" },
            user: { id: "userId1" },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    it("should handle missing provider", async () => {
        CarProvider.findById.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            }),
        });

        await getCarProviderReviews(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle database errors", async () => {
        CarProvider.findById.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockRejectedValue(new Error("DB error")),
            }),
        });

        await getCarProviderReviews(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
    });
});

describe("Reviews", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            params: { bookingId: "bookingId1" },
            body: { rating: 5, comment: "Great!" },
            user: { id: "userId1", role: "user" },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        global.fetch = jest.fn();
    });

    it("should add review to completed booking", async () => {
        const mockBooking = {
            _id: "bookingId1",
            user: "userId1",
            status: "completed",
            review: undefined,
            save: jest.fn().mockResolvedValue({
                _id: "bookingId1",
                review: { rating: 5 },
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
    });

    it("should reject non-completed bookings", async () => {
        const mockBooking = {
            user: "userId1",
            status: "pending",
        };

        Booking.findById.mockResolvedValue(mockBooking);

        await addReview(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should reject unauthorized users", async () => {
        mockReq.user.id = "different";
        const mockBooking = { user: "userId1", status: "completed" };

        Booking.findById.mockResolvedValue(mockBooking);

        await addReview(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(401);
    });
});
