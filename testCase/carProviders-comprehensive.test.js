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

describe("CarProviders - Comprehensive Coverage", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = { params: {}, query: {}, body: {}, user: { id: "u1", role: "admin" } };
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    });

    afterEach(() => jest.clearAllMocks());

    it("getCarProviders with all features", async () => {
        mockReq.query = {
            select: "name,location",
            sort: "name,-createdAt",
            page: "2",
            limit: "5",
            location: "Bangkok",
            rating: { $gte: "4" }
        };

        const mockQuery = {
            select: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([
                {
                    _id: "p1",
                    name: "Provider 1",
                    bookings: [
                        { review: { rating: 5 } },
                        { review: { rating: 4 } },
                        { review: { rating: 3 } }
                    ],
                    toObject: jest.fn(function() {
                        return {...this};
                    })
                }
            ])
        };

        CarProvider.find.mockReturnValue(mockQuery);
        CarProvider.countDocuments.mockResolvedValue(15);

        await getCarProviders(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        const response = mockRes.json.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.pagination.next).toBeDefined();
        expect(response.data[0].avgRating).toBe(4);
    });

    it("getCarProviders handles empty results", async () => {
        const mockQuery = {
            select: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([])
        };

        CarProvider.find.mockReturnValue(mockQuery);
        CarProvider.countDocuments.mockResolvedValue(0);

        await getCarProviders(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                count: 0,
                data: []
            })
        );
    });

    it("getCarProvider returns null for missing provider", async () => {
        mockReq.params.id = "nonexistent";
        CarProvider.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
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

    it("updateCarProvider calls correct method", async () => {
        mockReq.params.id = "p1";
        mockReq.body = { name: "Updated" };
        CarProvider.findByIdAndUpdate.mockResolvedValue({ _id: "p1", name: "Updated" });

        await updateCarProvider(mockReq, mockRes);

        expect(CarProvider.findByIdAndUpdate).toHaveBeenCalledWith(
            "p1",
            mockReq.body,
            { returnDocument: "after", runValidators: true }
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
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

    it("getCarProviderReviews with complex voting", async () => {
        mockReq.params.id = "p1";
        mockReq.user = { id: "u1" };

        CarProvider.findById.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    bookings: [
                        { _id: "b1", review: { rating: 5 }, user: { name: "U1" } },
                        { _id: "b2", review: { rating: 4 }, user: { name: "U2" } },
                        { _id: "b3", review: null }
                    ]
                })
            })
        });

        Vote.aggregate.mockResolvedValue([
            { _id: "b1", upvoteCount: 10, downvoteCount: 2 },
            { _id: "b2", upvoteCount: 5, downvoteCount: 1 }
        ]);

        Vote.find.mockResolvedValue([
            { booking: "b1", voteType: "upvote" },
            { booking: "b2", voteType: null }
        ]);

        await getCarProviderReviews(mockReq, mockRes);

        const response = mockRes.json.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(2);
        expect(response.data[0].voteSummary.userVote).toBe("upvote");
    });
});
