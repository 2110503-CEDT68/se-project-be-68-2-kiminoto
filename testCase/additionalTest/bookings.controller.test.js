jest.mock("../../models/Booking");
jest.mock("../../models/CarProvider");

const Booking = require("../../models/Booking");
const CarProvider = require("../../models/CarProvider");
const {
    getBookings,
    getBooking,
    addBooking,
    updateBooking,
    deleteBooking,
} = require("../../controllers/bookings");
const { createMockRes } = require("../testHelpers");

describe("Additional - Bookings controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getBookings", () => {
        it("returns only current user's bookings for non-admin", async () => {
            const req = { user: { id: "user-1", role: "user" }, params: {} };
            const res = createMockRes();

            Booking.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue([{ _id: "booking-1" }]),
            });

            await getBookings(req, res);

            expect(Booking.find).toHaveBeenCalledWith({ user: "user-1" });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("returns provider-specific bookings for admin + provider id", async () => {
            const req = {
                user: { id: "admin-1", role: "admin" },
                params: { carProviderId: "provider-1" },
            };
            const res = createMockRes();

            Booking.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue([{ _id: "booking-1" }]),
            });

            await getBookings(req, res);

            expect(Booking.find).toHaveBeenCalledWith({
                carProvider: "provider-1",
            });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("returns all bookings for admin without provider filter", async () => {
            const req = {
                user: { id: "admin-1", role: "admin" },
                params: {},
            };
            const res = createMockRes();

            Booking.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue([{ _id: "booking-1" }]),
            });

            await getBookings(req, res);

            expect(Booking.find).toHaveBeenCalledWith();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("returns 400 when booking query fails", async () => {
            const req = { user: { id: "user-1", role: "user" }, params: {} };
            const res = createMockRes();

            Booking.find.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error("db broken")),
            });

            await getBookings(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Cannot find Bookings",
            });
        });
    });

    describe("getBooking", () => {
        it("returns one booking by id", async () => {
            const req = { params: { id: "booking-1" } };
            const res = createMockRes();

            Booking.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue({ _id: "booking-1" }),
            });

            await getBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("returns 404 when booking is missing", async () => {
            const req = { params: { id: "missing" } };
            const res = createMockRes();

            Booking.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            await getBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("returns 500 when get booking query fails", async () => {
            const req = { params: { id: "booking-1" } };
            const res = createMockRes();

            Booking.findById.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error("db broken")),
            });

            await getBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Cannot find Booking",
            });
        });
    });

    describe("addBooking", () => {
        it("returns 404 when provider does not exist", async () => {
            const req = {
                params: { carProviderId: "provider-missing" },
                user: { id: "user-1", role: "user" },
                body: { bookDate: "2026-04-27" },
            };
            const res = createMockRes();

            CarProvider.findById.mockResolvedValue(null);

            await addBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("returns 400 when user already has 3 active bookings", async () => {
            const req = {
                params: { carProviderId: "provider-1" },
                user: { id: "user-1", role: "user" },
                body: { bookDate: "2026-04-27" },
            };
            const res = createMockRes();

            CarProvider.findById.mockResolvedValue({ _id: "provider-1" });
            Booking.find.mockResolvedValue([
                { status: "active" },
                { status: "active" },
                { status: "active" },
            ]);

            await addBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("creates booking and strips review from request body", async () => {
            const req = {
                params: { carProviderId: "provider-1" },
                user: { id: "admin-1", role: "admin" },
                body: {
                    bookDate: "2026-04-27",
                    review: { rating: 5, comment: "should be ignored" },
                },
            };
            const res = createMockRes();

            CarProvider.findById.mockResolvedValue({ _id: "provider-1" });
            Booking.find.mockResolvedValue([]);
            Booking.create.mockResolvedValue({ _id: "booking-1" });

            await addBooking(req, res);

            expect(req.body.review).toBeUndefined();
            expect(Booking.create).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("returns 500 when provider lookup fails", async () => {
            const req = {
                params: { carProviderId: "provider-1" },
                user: { id: "user-1", role: "user" },
                body: { bookDate: "2026-04-27" },
            };
            const res = createMockRes();

            CarProvider.findById.mockRejectedValue(new Error("db broken"));

            await addBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Cannot create Booking",
            });
        });
    });

    describe("updateBooking", () => {
        it("returns 404 when booking is missing", async () => {
            const req = {
                params: { id: "missing" },
                user: { id: "user-1", role: "user" },
                body: { status: "completed" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue(null);

            await updateBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("returns 401 when non-owner non-admin edits booking", async () => {
            const req = {
                params: { id: "booking-1" },
                user: { id: "user-2", role: "user" },
                body: { status: "completed" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ user: "user-1" });

            await updateBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("updates booking for owner", async () => {
            const req = {
                params: { id: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: {
                    status: "completed",
                    review: { rating: 5 },
                },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ user: "user-1" });
            Booking.findByIdAndUpdate.mockResolvedValue({
                _id: "booking-1",
                status: "completed",
            });

            await updateBooking(req, res);

            expect(req.body.review).toBeUndefined();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("returns 500 when booking lookup fails on update", async () => {
            const req = {
                params: { id: "booking-1" },
                user: { id: "user-1", role: "user" },
                body: { status: "completed" },
            };
            const res = createMockRes();

            Booking.findById.mockRejectedValue(new Error("db broken"));

            await updateBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Cannot update Booking",
            });
        });
    });

    describe("deleteBooking", () => {
        it("returns 404 when booking is missing", async () => {
            const req = {
                params: { id: "missing" },
                user: { id: "user-1", role: "user" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue(null);

            await deleteBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("returns 401 when non-owner non-admin deletes booking", async () => {
            const req = {
                params: { id: "booking-1" },
                user: { id: "user-2", role: "user" },
            };
            const res = createMockRes();

            Booking.findById.mockResolvedValue({ user: "user-1" });

            await deleteBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("deletes booking for owner", async () => {
            const req = {
                params: { id: "booking-1" },
                user: { id: "user-1", role: "user" },
            };
            const res = createMockRes();

            const booking = {
                user: "user-1",
                deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            };
            Booking.findById.mockResolvedValue(booking);

            await deleteBooking(req, res);

            expect(booking.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("returns 500 when booking lookup fails on delete", async () => {
            const req = {
                params: { id: "booking-1" },
                user: { id: "user-1", role: "user" },
            };
            const res = createMockRes();

            Booking.findById.mockRejectedValue(new Error("db broken"));

            await deleteBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Cannot delete Booking",
            });
        });
    });
});
