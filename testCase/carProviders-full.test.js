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

    // Helper to create a chainable query mock for getCarProviders
    // The code does: CarProvider.find(...).populate("bookings") then .select/.sort/.skip/.limit
    function createFindChain(resolvedValue) {
        const chain = {
            populate: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(resolvedValue),
        };
        return chain;
    }

    describe("getCarProviders", () => {
        it("should return providers with default sort, no select, page 1", async () => {
            const chain = createFindChain([]);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(0);

            await getCarProviders(mockReq, mockRes);

            expect(CarProvider.find).toHaveBeenCalledWith({});
            expect(chain.populate).toHaveBeenCalledWith("bookings");
            expect(chain.sort).toHaveBeenCalledWith("-createdAt");
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                count: 0,
                pagination: {},
                data: [],
            });
        });

        it("should apply select fields when provided", async () => {
            mockReq.query = { select: "name,location" };
            const chain = createFindChain([]);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(0);

            await getCarProviders(mockReq, mockRes);

            expect(chain.select).toHaveBeenCalledWith("name location");
        });

        it("should apply custom sort when provided", async () => {
            mockReq.query = { sort: "name,-createdAt" };
            const chain = createFindChain([]);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(0);

            await getCarProviders(mockReq, mockRes);

            expect(chain.sort).toHaveBeenCalledWith("name -createdAt");
        });

        it("should exclude select/sort/page/limit from filter query", async () => {
            mockReq.query = {
                select: "name",
                sort: "name",
                page: "2",
                limit: "10",
                location: "Bangkok",
            };
            const chain = createFindChain([]);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(0);

            await getCarProviders(mockReq, mockRes);

            const queryArg = CarProvider.find.mock.calls[0][0];
            expect(queryArg).toEqual({ location: "Bangkok" });
        });

        it("should replace gt/gte/lt/lte/in with $ operators (line 24)", async () => {
            // Pass nested query objects that stringify to JSON with gt/gte/lt/lte/in keys
            // The code does: JSON.stringify(reqQuery) then replaces \b(gt|gte|lt|lte|in)\b with $-prefixed
            mockReq.query = { price: { gte: "100", lte: "500" } };
            const chain = createFindChain([]);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(0);

            await getCarProviders(mockReq, mockRes);

            // The regex should convert {price: {gte: "100", lte: "500"}}
            // to {price: {$gte: "100", $lte: "500"}} after stringify+replace+parse
            const queryArg = CarProvider.find.mock.calls[0][0];
            expect(queryArg.price.$gte).toBe("100");
            expect(queryArg.price.$lte).toBe("500");
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should handle pagination: next when endIndex < total", async () => {
            mockReq.query = { page: "1", limit: "5" };
            const chain = createFindChain([]);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(20);

            await getCarProviders(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.pagination.next).toEqual({ page: 2, limit: 5 });
            expect(response.pagination.prev).toBeUndefined();
        });

        it("should handle pagination: prev when startIndex > 0", async () => {
            mockReq.query = { page: "3", limit: "5" };
            const chain = createFindChain([]);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(20);

            await getCarProviders(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.pagination.prev).toEqual({ page: 2, limit: 5 });
            expect(response.pagination.next).toEqual({ page: 4, limit: 5 });
        });

        it("should handle pagination: no next when at last page", async () => {
            mockReq.query = { page: "2", limit: "10" };
            const chain = createFindChain([]);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(15);

            await getCarProviders(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.pagination.next).toBeUndefined();
            expect(response.pagination.prev).toEqual({ page: 1, limit: 10 });
        });

        it("should compute avgRating from bookings with reviews", async () => {
            const providers = [
                {
                    _id: "p1",
                    bookings: [
                        { review: { rating: 5 } },
                        { review: { rating: 3 } },
                    ],
                    toObject: jest.fn(function () {
                        return { _id: this._id, bookings: this.bookings };
                    }),
                },
            ];
            const chain = createFindChain(providers);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(1);

            await getCarProviders(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.data[0].avgRating).toBe(4);
        });

        it("should handle avgRating with no bookings (NaN -> null via ??)", async () => {
            const providers = [
                {
                    _id: "p1",
                    bookings: [],
                    toObject: jest.fn(function () {
                        return { _id: this._id, bookings: this.bookings };
                    }),
                },
            ];
            const chain = createFindChain(providers);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(1);

            await getCarProviders(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            // NaN / 0 => NaN, NaN ?? null => NaN (because NaN is not null/undefined)
            // Actually 0/0 = NaN, but the code does: reduce(sum,r)=>sum+r, 0) / ratings.length ?? null
            // With no ratings, ratings = [], reduce returns 0, length is 0, 0/0 = NaN
            // NaN ?? null => NaN (because ?? only checks null/undefined)
            expect(response.data[0].avgRating).toBeNaN();
        });

        it("should handle avgRating with mixed null and valid ratings", async () => {
            const providers = [
                {
                    _id: "p1",
                    bookings: [
                        { review: { rating: 5 } },
                        { review: { rating: null } },
                        { review: null },
                        {},
                    ],
                    toObject: jest.fn(function () {
                        return { _id: this._id, bookings: this.bookings };
                    }),
                },
            ];
            const chain = createFindChain(providers);
            CarProvider.find.mockReturnValue(chain);
            CarProvider.countDocuments.mockResolvedValue(1);

            await getCarProviders(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.data[0].avgRating).toBe(5);
        });

        it("should return 400 on error", async () => {
            CarProvider.find.mockImplementation(() => {
                throw new Error("DB error");
            });

            await getCarProviders(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "DB error",
            });
        });
    });

    describe("getCarProvider", () => {
        it("should return a single car provider with avgRating", async () => {
            mockReq.params.id = "p1";
            const mockProvider = {
                _id: "p1",
                bookings: [
                    { review: { rating: 5 } },
                    { review: { rating: 3 } },
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

        it("should return 404 if provider not found", async () => {
            mockReq.params.id = "nonexistent";
            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            await getCarProvider(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No car provider with the id of nonexistent",
            });
        });

        it("should handle avgRating with no valid ratings", async () => {
            mockReq.params.id = "p1";
            const mockProvider = {
                _id: "p1",
                bookings: [{ review: null }, { review: { rating: null } }],
                toObject: jest.fn(function () {
                    return { _id: this._id, bookings: this.bookings };
                }),
            };
            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockProvider),
            });

            await getCarProvider(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should return 400 on error", async () => {
            mockReq.params.id = "p1";
            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error("DB error")),
            });

            await getCarProvider(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "DB error",
            });
        });
    });

    describe("createCarProvider", () => {
        it("should create a car provider successfully", async () => {
            mockReq.body = { name: "Provider", tel: "123", address: "Bangkok" };
            const created = { _id: "p1", ...mockReq.body };
            CarProvider.create.mockResolvedValue(created);

            await createCarProvider(mockReq, mockRes);

            expect(CarProvider.create).toHaveBeenCalledWith(mockReq.body);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: created,
            });
        });

        it("should return 400 on validation error", async () => {
            mockReq.body = {};
            CarProvider.create.mockRejectedValue(new Error("Validation failed"));

            await createCarProvider(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Validation failed",
            });
        });
    });

    describe("updateCarProvider", () => {
        it("should update a car provider successfully", async () => {
            mockReq.params.id = "p1";
            mockReq.body = { name: "Updated" };
            const updated = { _id: "p1", name: "Updated" };
            CarProvider.findByIdAndUpdate.mockResolvedValue(updated);

            await updateCarProvider(mockReq, mockRes);

            expect(CarProvider.findByIdAndUpdate).toHaveBeenCalledWith(
                "p1",
                mockReq.body,
                { returnDocument: "after", runValidators: true }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: updated,
            });
        });

        it("should return 404 if provider not found", async () => {
            mockReq.params.id = "nonexistent";
            mockReq.body = { name: "Updated" };
            CarProvider.findByIdAndUpdate.mockResolvedValue(null);

            await updateCarProvider(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No car provider with the id of nonexistent",
            });
        });

        it("should return 400 on error", async () => {
            mockReq.params.id = "p1";
            mockReq.body = { name: "Updated" };
            CarProvider.findByIdAndUpdate.mockRejectedValue(new Error("DB error"));

            await updateCarProvider(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "DB error",
            });
        });
    });

    describe("deleteCarProvider", () => {
        it("should delete a car provider and its bookings", async () => {
            mockReq.params.id = "p1";
            CarProvider.findById.mockResolvedValue({ _id: "p1" });
            Booking.deleteMany.mockResolvedValue({ deletedCount: 5 });
            CarProvider.deleteOne.mockResolvedValue({ deletedCount: 1 });

            await deleteCarProvider(mockReq, mockRes);

            expect(Booking.deleteMany).toHaveBeenCalledWith({ carProvider: "p1" });
            expect(CarProvider.deleteOne).toHaveBeenCalledWith({ _id: "p1" });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {},
            });
        });

        it("should return 404 if provider not found", async () => {
            mockReq.params.id = "nonexistent";
            CarProvider.findById.mockResolvedValue(null);

            await deleteCarProvider(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No car provider with the id of nonexistent",
            });
        });

        it("should return 400 on error", async () => {
            mockReq.params.id = "p1";
            CarProvider.findById.mockRejectedValue(new Error("DB error"));

            await deleteCarProvider(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "DB error",
            });
        });
    });

    describe("getCarProviderReviews", () => {
        it("should return reviews with vote summaries for authenticated user", async () => {
            mockReq.params.id = "p1";
            mockReq.user = { id: "u1" };

            const mockProvider = {
                _id: "p1",
                bookings: [
                    { _id: "b1", review: { rating: 5, comment: "Great" }, user: { name: "U1" } },
                    { _id: "b2", review: { rating: 4, comment: "Good" }, user: { name: "U2" } },
                ],
            };

            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockProvider),
                }),
            });

            Vote.aggregate.mockResolvedValue([
                { _id: "b1", upvoteCount: 10, downvoteCount: 2 },
                { _id: "b2", upvoteCount: 3, downvoteCount: 1 },
            ]);

            Vote.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([
                        { booking: { toString: () => "b1" }, voteType: "upvote" },
                    ]),
                }),
            });

            await getCarProviderReviews(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.data).toHaveLength(2);
            expect(response.data[0].voteSummary.userVote).toBe("upvote");
            expect(response.data[1].voteSummary.userVote).toBeNull();
        });

        it("should return reviews without user votes when unauthenticated", async () => {
            mockReq.params.id = "p1";
            mockReq.user = null;

            const mockProvider = {
                _id: "p1",
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
                { _id: "b1", upvoteCount: 5, downvoteCount: 0 },
            ]);

            await getCarProviderReviews(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.data[0].voteSummary.userVote).toBeNull();
        });

        it("should filter out bookings without valid reviews", async () => {
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

            Vote.aggregate.mockResolvedValue([]);
            Vote.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([]),
                }),
            });

            await getCarProviderReviews(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.data).toHaveLength(1);
            expect(response.data[0]._id).toBe("b1");
        });

        it("should skip Vote.aggregate when no bookings have reviews (empty bookingIds)", async () => {
            mockReq.params.id = "p1";

            const mockProvider = {
                _id: "p1",
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

            await getCarProviderReviews(mockReq, mockRes);

            // Vote.aggregate should NOT be called when bookingIds is empty
            expect(Vote.aggregate).not.toHaveBeenCalled();
            const response = mockRes.json.mock.calls[0][0];
            expect(response.data).toHaveLength(0);
        });

        it("should return 404 if car provider not found", async () => {
            mockReq.params.id = "nonexistent";

            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null),
                }),
            });

            await getCarProviderReviews(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "No car provider with the id of nonexistent",
            });
        });

        it("should return 500 on error", async () => {
            mockReq.params.id = "p1";
            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockRejectedValue(new Error("DB error")),
                }),
            });

            await getCarProviderReviews(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Cannot get reviews",
            });
        });

        it("should use default vote summary when no votes exist for a booking", async () => {
            mockReq.params.id = "p1";
            mockReq.user = null;

            const mockProvider = {
                _id: "p1",
                bookings: [
                    { _id: "b1", review: { rating: 5 }, user: { name: "U1" } },
                ],
            };

            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockProvider),
                }),
            });

            Vote.aggregate.mockResolvedValue([]); // No vote summaries

            await getCarProviderReviews(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.data[0].voteSummary).toEqual({
                upvoteCount: 0,
                downvoteCount: 0,
                userVote: null,
            });
        });

        it("should handle user with req.user but no votes on any booking", async () => {
            mockReq.params.id = "p1";
            mockReq.user = { id: "u1" };

            const mockProvider = {
                _id: "p1",
                bookings: [
                    { _id: "b1", review: { rating: 4 }, user: { name: "U1" } },
                ],
            };

            CarProvider.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockProvider),
                }),
            });

            Vote.aggregate.mockResolvedValue([
                { _id: "b1", upvoteCount: 2, downvoteCount: 1 },
            ]);

            Vote.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([]),
                }),
            });

            await getCarProviderReviews(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.data[0].voteSummary).toEqual({
                upvoteCount: 2,
                downvoteCount: 1,
                userVote: null,
            });
        });
    });
});
