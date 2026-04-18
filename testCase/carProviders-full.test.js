jest.mock("../models/CarProvider");
jest.mock("../models/Booking");
jest.mock("../models/Vote");

const CarProvider = require("../models/CarProvider");
const Booking = require("../models/Booking");
const Vote = require("../models/Vote");

const {
    getCarProviders,
    getCarProvider,
    createCarProvider,
    updateCarProvider,
    deleteCarProvider,
    getCarProviderReviews,
} = require("../controllers/carProviders");

describe("CarProviders Full Coverage", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            params: {},
            query: {},
            body: {},
            user: { id: "u1", role: "admin" },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getCarProviders - All Paths", () => {
        it("should exclude fields like select, sort, page, limit from query", async () => {
            mockReq.query = {
                select: "name",
                sort: "createdAt",
                page: "2",
                limit: "20",
                location: "Bangkok",
            };

            CarProvider.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([]),
            });
            CarProvider.countDocuments.mockResolvedValue(0);

            await getCarProviders(mockReq, mockRes);

            // Check that the query only includes location, not the excluded fields
            const queryArg = CarProvider.find.mock.calls[0][0];
            expect(queryArg.location).toBe("Bangkok");
            expect(queryArg.select).toBeUndefined();
            expect(queryArg.sort).toBeUndefined();
        });

        it("should apply default sort when no sort provided", async () => {
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([]),
            };

            CarProvider.find.mockReturnValue(mockQuery);
            CarProvider.countDocuments.mockResolvedValue(0);

            await getCarProviders(mockReq, mockRes);

            expect(mockQuery.sort).toHaveBeenCalledWith("-createdAt");
        });

        it("should handle pagination skip and limit", async () => {
            mockReq.query = { page: "3", limit: "15" };

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([]),
            };

            CarProvider.find.mockReturnValue(mockQuery);
            CarProvider.countDocuments.mockResolvedValue(100);

            await getCarProviders(mockReq, mockRes);

            // Page 3, limit 15 = skip 30
            expect(mockQuery.skip).toHaveBeenCalledWith(30);
            expect(mockQuery.limit).toHaveBeenCalledWith(15);
        });

        it("should return prev pagination when not first page", async () => {
            mockReq.query = { page: "2", limit: "10" };

            CarProvider.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([
                    { _id: "p1", bookings: [], toObject: jest.fn(() => ({ _id: "p1" })) },
                ]),
            });
            CarProvider.countDocuments.mockResolvedValue(50);

            await getCarProviders(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.pagination.prev).toEqual({ page: 1, limit: 10 });
        });

        it("should calculate avg rating as null when no bookings", async () => {
            CarProvider.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([
                    {
                        _id: "p1",
                        bookings: [],
                        toObject: jest.fn(function() {
                            return { _id: this._id, bookings: this.bookings };
                        }),
                    },
                ]),
            });
            CarProvider.countDocuments.mockResolvedValue(1);

            await getCarProviders(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.data[0].avgRating).toBeNull();
        });

        it("should handle $in, $gt, $lt operators", async () => {
            mockReq.query = { status: { $in: "active,inactive" }, price: { $gt: "100", $lt: "500" } };

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([]),
            };

            CarProvider.find.mockReturnValue(mockQuery);
            CarProvider.countDocuments.mockResolvedValue(0);

            await getCarProviders(mockReq, mockRes);

            const queryArg = CarProvider.find.mock.calls[0][0];
            expect(queryArg.status.$in).toBe("active,inactive");
            expect(queryArg.price.$gt).toBe("100");
        });
    });

    describe("getCarProvider - All Paths", () => {
        it("should handle null booking ratings in avg calculation", async () => {
            mockReq.params.id = "p1";

            const mockProvider = {
                _id: "p1",
                bookings: [
                    { review: { rating: 5 } },
                    { review: { rating: null } },
                    { review: null },
                ],
                toObject: jest.fn(function() {
                    return {
                        _id: this._id,
                        bookings: this.bookings,
                    };
                }),
            };

            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockProvider),
            });

            await getCarProvider(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.data.avgRating).toBe(5);
        });
    });

    describe("createCarProvider - All Paths", () => {
        it("should pass body to create", async () => {
            mockReq.body = { name: "Provider", tel: "123", address: "Bangkok" };

            CarProvider.create.mockResolvedValue({ _id: "p1", ...mockReq.body });

            await createCarProvider(mockReq, mockRes);

            expect(CarProvider.create).toHaveBeenCalledWith(mockReq.body);
        });
    });

    describe("updateCarProvider - All Paths", () => {
        it("should call findByIdAndUpdate with correct options", async () => {
            mockReq.params.id = "p1";
            mockReq.body = { name: "Updated" };

            CarProvider.findByIdAndUpdate.mockResolvedValue({ _id: "p1" });

            await updateCarProvider(mockReq, mockRes);

            expect(CarProvider.findByIdAndUpdate).toHaveBeenCalledWith(
                "p1",
                mockReq.body,
                { returnDocument: "after", runValidators: true }
            );
        });
    });

    describe("deleteCarProvider - All Paths", () => {
        it("should delete both provider and its bookings", async () => {
            mockReq.params.id = "p1";

            CarProvider.findById.mockResolvedValue({ _id: "p1" });
            Booking.deleteMany.mockResolvedValue({ deletedCount: 10 });
            CarProvider.deleteOne.mockResolvedValue({ deletedCount: 1 });

            await deleteCarProvider(mockReq, mockRes);

            expect(Booking.deleteMany).toHaveBeenCalledWith({ carProvider: "p1" });
            expect(CarProvider.deleteOne).toHaveBeenCalledWith({ _id: "p1" });
        });
    });

    describe("getCarProviderReviews - All Paths", () => {
        it("should filter out booking without review", async () => {
            mockReq.params.id = "p1";

            const mockProvider = {
                _id: "p1",
                bookings: [
                    { _id: "b1", review: { rating: 5 }, user: { name: "U1" } },
                    { _id: "b2", review: null, user: { name: "U2" } },
                    { _id: "b3", review: { rating: null }, user: { name: "U3" } },
                ],
            };

            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockProvider),
                }),
            });

            Vote.aggregate.mockResolvedValue([
                { _id: "b1", upvoteCount: 3, downvoteCount: 0 },
            ]);
            Vote.find.mockResolvedValue([]);

            await getCarProviderReviews(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            // Only b1 should be included
            expect(response.data).toHaveLength(1);
            expect(response.data[0]._id).toBe("b1");
        });

        it("should map default vote summary when no votes exist", async () => {
            mockReq.params.id = "p1";

            const mockProvider = {
                bookings: [
                    { _id: "b1", review: { rating: 5 }, user: { name: "U1" } },
                ],
            };

            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockProvider),
                }),
            });

            Vote.aggregate.mockResolvedValue([]); // No votes
            Vote.find.mockResolvedValue([]);

            await getCarProviderReviews(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.data[0].voteSummary).toEqual({
                upvoteCount: 0,
                downvoteCount: 0,
                userVote: null,
            });
        });

        it("should set userVote when authenticated user has voted", async () => {
            mockReq.params.id = "p1";
            mockReq.user = { id: "u1" };

            const mockProvider = {
                bookings: [
                    { _id: "b1", review: { rating: 5 }, user: { name: "U1" } },
                ],
            };

            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockProvider),
                }),
            });

            Vote.aggregate.mockResolvedValue([
                { _id: "b1", upvoteCount: 5, downvoteCount: 2 },
            ]);
            Vote.find.mockResolvedValue([
                { booking: "b1", voteType: "downvote" },
            ]);

            await getCarProviderReviews(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.data[0].voteSummary.userVote).toBe("downvote");
        });

        it("should expand votes even when no bookings with reviews", async () => {
            mockReq.params.id = "p1";

            const mockProvider = {
                bookings: [
                    { _id: "b1", review: null },
                    { _id: "b2", review: { rating: null } },
                ],
            };

            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockProvider),
                }),
            });

            // Should still call aggregate even with empty bookingIds
            Vote.aggregate.mockResolvedValue([]);

            await getCarProviderReviews(mockReq, mockRes);

            expect(Vote.aggregate).toHaveBeenCalled();
        });
    });
});
