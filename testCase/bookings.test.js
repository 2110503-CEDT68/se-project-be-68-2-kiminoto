/**
 * Bookings Controller Tests
 * Tests for booking CRUD operations
 */

jest.mock("../models/Booking");
jest.mock("../models/CarProvider");

const Booking = require("../models/Booking");
const CarProvider = require("../models/CarProvider");

const {
    getBookings,
    getBooking,
    addBooking,
    updateBooking,
    deleteBooking,
} = require("../controllers/bookings");

describe("Bookings Controller", () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            params: {},
            body: {},
            user: { id: "userId123", role: "user" },
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

    describe("getBookings", () => {
        it("should return user's bookings for non-admin", async () => {
            const mockBookings = [
                {
                    _id: "bookingId1",
                    user: "userId123",
                    carProvider: { name: "Provider 1" },
                },
            ];

            Booking.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBookings),
            });

            await getBookings(mockReq, mockRes, mockNext);

            expect(Booking.find).toHaveBeenCalledWith({ user: "userId123" });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                count: 1,
                data: mockBookings,
            });
        });

        it("should return all bookings for admin", async () => {
            mockReq.user.role = "admin";

            const mockBookings = [
                { _id: "bookingId1", user: "userId1" },
                { _id: "bookingId2", user: "userId2" },
            ];

            Booking.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBookings),
            });

            await getBookings(mockReq, mockRes, mockNext);

            expect(Booking.find).toHaveBeenCalledWith();
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                data: mockBookings,
            });
        });

        it("should return provider's bookings if admin specifies carProviderId", async () => {
            mockReq.user.role = "admin";
            mockReq.params.carProviderId = "providerId123";

            const mockBookings = [{ _id: "bookingId1", carProvider: "providerId123" }];

            Booking.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBookings),
            });

            await getBookings(mockReq, mockRes, mockNext);

            expect(Booking.find).toHaveBeenCalledWith({
                carProvider: "providerId123",
            });
        });

        it("should handle database errors", async () => {
            const mockQuery = {
                populate: jest.fn().mockRejectedValue(new Error("DB error")),
            };

            Booking.find.mockReturnValue(mockQuery);

            await getBookings(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Cannot find Bookings",
            });
        });
    });

    describe("getBooking", () => {
        it("should return a single booking by ID", async () => {
            mockReq.params.id = "bookingId123";

            const mockBooking = {
                _id: "bookingId123",
                user: "userId123",
                carProvider: { name: "Premium Rentals" },
            };

            Booking.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBooking),
            });

            await getBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockBooking,
            });
        });

        it("should return 404 if booking not found", async () => {
            mockReq.params.id = "nonexistent";

            Booking.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            await getBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No booking with the id of nonexistent",
            });
        });

        it("should handle database errors", async () => {
            mockReq.params.id = "bookingId123";

            Booking.findById.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error("DB error")),
            });

            await getBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("addBooking", () => {
        it("should create a new booking", async () => {
            mockReq.params.carProviderId = "providerId123";
            mockReq.body = {
                startDate: "2024-05-01",
                endDate: "2024-05-05",
                status: "active",
            };

            const mockProvider = { _id: "providerId123" };
            const mockBooking = {
                _id: "bookingId123",
                ...mockReq.body,
                user: "userId123",
                carProvider: "providerId123",
            };

            CarProvider.findById.mockResolvedValue(mockProvider);
            Booking.find.mockResolvedValue([]);
            Booking.create.mockResolvedValue(mockBooking);

            await addBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockBooking,
            });
        });

        it("should reject if car provider not found", async () => {
            mockReq.params.carProviderId = "nonexistent";

            CarProvider.findById.mockResolvedValue(null);

            await addBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should reject if user already has 3 active bookings (non-admin)", async () => {
            mockReq.params.carProviderId = "providerId123";
            mockReq.user.role = "user";

            const mockProvider = { _id: "providerId123" };
            const existingBookings = [
                { status: "active" },
                { status: "active" },
                { status: "active" },
            ];

            CarProvider.findById.mockResolvedValue(mockProvider);
            Booking.find.mockResolvedValue(existingBookings);

            await addBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining("3 bookings"),
                }),
            );
        });

        it("should allow admin to create booking even with 3 active bookings", async () => {
            mockReq.params.carProviderId = "providerId123";
            mockReq.user.role = "admin";

            const mockProvider = { _id: "providerId123" };
            const existingBookings = [
                { status: "active" },
                { status: "active" },
                { status: "active" },
            ];
            const mockBooking = {
                _id: "bookingId123",
                user: "userId123",
            };

            CarProvider.findById.mockResolvedValue(mockProvider);
            Booking.find.mockResolvedValue(existingBookings);
            Booking.create.mockResolvedValue(mockBooking);

            await addBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should remove review fields from request body", async () => {
            mockReq.params.carProviderId = "providerId123";
            mockReq.body = {
                startDate: "2024-05-01",
                review: { rating: 5 }, // Should be removed
            };

            CarProvider.findById.mockResolvedValue({ _id: "providerId123" });
            Booking.find.mockResolvedValue([]);
            Booking.create.mockResolvedValue({});

            await addBooking(mockReq, mockRes, mockNext);

            expect(mockReq.body.review).toBeUndefined();
        });

        it("should handle database errors", async () => {
            mockReq.params.carProviderId = "providerId123";

            CarProvider.findById.mockRejectedValue(new Error("DB error"));

            await addBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("updateBooking", () => {
        it("should update a booking by owner", async () => {
            mockReq.params.id = "bookingId123";
            mockReq.body = { status: "completed" };

            const mockBooking = {
                _id: "bookingId123",
                user: "userId123",
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Booking.findByIdAndUpdate.mockResolvedValue({
                ...mockBooking,
                status: "completed",
            });

            await updateBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                }),
            );
        });

        it("should allow admin to update any booking", async () => {
            mockReq.params.id = "bookingId123";
            mockReq.user.role = "admin";
            mockReq.body = { status: "completed" };

            const mockBooking = {
                _id: "bookingId123",
                user: "differentUserId",
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Booking.findByIdAndUpdate.mockResolvedValue(mockBooking);

            await updateBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should reject unauthorized updates", async () => {
            mockReq.params.id = "bookingId123";
            mockReq.user.id = "differentUserId";

            const mockBooking = {
                user: "userId123",
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await updateBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it("should return 404 if booking not found", async () => {
            mockReq.params.id = "nonexistent";

            Booking.findById.mockResolvedValue(null);

            await updateBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should remove review fields from request body", async () => {
            mockReq.params.id = "bookingId123";
            mockReq.body = {
                status: "active",
                review: { rating: 5 }, // Should be removed
            };

            const mockBooking = {
                user: "userId123",
            };

            Booking.findById.mockResolvedValue(mockBooking);
            Booking.findByIdAndUpdate.mockResolvedValue({});

            await updateBooking(mockReq, mockRes, mockNext);

            expect(mockReq.body.review).toBeUndefined();
        });

        it("should handle database errors", async () => {
            mockReq.params.id = "bookingId123";

            Booking.findById.mockRejectedValue(new Error("DB error"));

            await updateBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("deleteBooking", () => {
        it("should delete a booking by owner", async () => {
            mockReq.params.id = "bookingId123";

            const mockBooking = {
                _id: "bookingId123",
                user: "userId123",
                deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await deleteBooking(mockReq, mockRes, mockNext);

            expect(mockBooking.deleteOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {},
            });
        });

        it("should allow admin to delete any booking", async () => {
            mockReq.params.id = "bookingId123";
            mockReq.user.role = "admin";

            const mockBooking = {
                user: "differentUserId",
                deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await deleteBooking(mockReq, mockRes, mockNext);

            expect(mockBooking.deleteOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should reject unauthorized deletes", async () => {
            mockReq.params.id = "bookingId123";
            mockReq.user.id = "differentUserId";

            const mockBooking = {
                user: "userId123",
            };

            Booking.findById.mockResolvedValue(mockBooking);

            await deleteBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it("should return 404 if booking not found", async () => {
            mockReq.params.id = "nonexistent";

            Booking.findById.mockResolvedValue(null);

            await deleteBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it("should handle database errors", async () => {
            mockReq.params.id = "bookingId123";

            Booking.findById.mockRejectedValue(new Error("DB error"));

            await deleteBooking(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
