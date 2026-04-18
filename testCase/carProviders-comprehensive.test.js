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

describe("CarProviders - Comprehensive Edge Cases", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = { params: {}, query: {}, body: {}, user: { id: "u1", role: "admin" } };
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    });

    afterEach(() => jest.clearAllMocks());

    // Helper to create a chainable query mock
    function createFindChain(resolvedValue) {
        return {
            populate: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(resolvedValue),
        };
    }

    it("getCarProviders with all query features: select, sort, page, limit, filter", async () => {
        mockReq.query = {
            select: "name,location",
            sort: "name,-createdAt",
            page: "2",
            limit: "5",
            location: "Bangkok",
        };

        const providers = [
            {
                _id: "p1",
                name: "Provider 1",
                bookings: [
                    { review: { rating: 5 } },
                    { review: { rating: 4 } },
                    { review: { rating: 3 } },
                ],
                toObject: jest.fn(function () {
                    return { _id: this._id, bookings: this.bookings };
                }),
            },
        ];

        const chain = createFindChain(providers);
        CarProvider.find.mockReturnValue(chain);
        CarProvider.countDocuments.mockResolvedValue(15);

        await getCarProviders(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(chain.select).toHaveBeenCalledWith("name location");
        expect(chain.sort).toHaveBeenCalledWith("name -createdAt");
        const response = mockRes.json.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.pagination.next).toBeDefined();
        expect(response.pagination.prev).toBeDefined();
        expect(response.data[0].avgRating).toBe(4);
    });

    it("getCarProvider returns single provider with computed avgRating", async () => {
        mockReq.params.id = "p1";
        const mockProvider = {
            _id: "p1",
            bookings: [
                { review: { rating: 5 } },
                { review: { rating: 3 } },
                { review: null },
            ],
            toObject: jest.fn(function () {
                return { _id: this._id, bookings: this.bookings };
            }),
        };
        CarProvider.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockProvider),
        });

        await getCarProvider(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        const response = mockRes.json.mock.calls[0][0];
        expect(response.data.avgRating).toBe(4);
    });

    it("getCarProvider returns 404 for missing provider", async () => {
        mockReq.params.id = "nonexistent";
        CarProvider.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
        });

        await getCarProvider(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("createCarProvider handles validation errors", async () => {
        mockReq.body = { name: "Test" };
        CarProvider.create.mockRejectedValue(new Error("Validation failed"));

        await createCarProvider(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("updateCarProvider returns 404 for missing provider", async () => {
        mockReq.params.id = "nonexistent";
        mockReq.body = { name: "Updated" };
        CarProvider.findByIdAndUpdate.mockResolvedValue(null);

        await updateCarProvider(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("deleteCarProvider removes provider and bookings", async () => {
        mockReq.params.id = "p1";
        CarProvider.findById.mockResolvedValue({ _id: "p1" });
        Booking.deleteMany.mockResolvedValue({ deletedCount: 5 });
        CarProvider.deleteOne.mockResolvedValue({ deletedCount: 1 });

        await deleteCarProvider(mockReq, mockRes);

        expect(Booking.deleteMany).toHaveBeenCalledWith({ carProvider: "p1" });
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("getCarProviderReviews with user votes and vote summaries", async () => {
        mockReq.params.id = "p1";
        mockReq.user = { id: "u1" };

        CarProvider.findById.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    bookings: [
                        { _id: "b1", review: { rating: 5 }, user: { name: "U1" } },
                        { _id: "b2", review: { rating: 4 }, user: { name: "U2" } },
                        { _id: "b3", review: null },
                    ],
                }),
            }),
        });

        Vote.aggregate.mockResolvedValue([
            { _id: "b1", upvoteCount: 10, downvoteCount: 2 },
            { _id: "b2", upvoteCount: 5, downvoteCount: 1 },
        ]);

        Vote.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([
                    { booking: { toString: () => "b1" }, voteType: "upvote" },
                ]),
            }),
        });

        await getCarProviderReviews(mockReq, mockRes);

        const response = mockRes.json.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(2);
        expect(response.data[0].voteSummary.userVote).toBe("upvote");
    });
});
