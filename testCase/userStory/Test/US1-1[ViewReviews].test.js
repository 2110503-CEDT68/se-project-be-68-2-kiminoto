jest.mock("../../../models/CarProvider");
jest.mock("../../../models/Vote");

const CarProvider = require("../../../models/CarProvider");
const Vote = require("../../../models/Vote");
const { getCarProviderReviews } = require("../../../controllers/carProviders");
const { createMockRes } = require("../../testHelpers");

function mockProviderQueryResult(value, shouldReject) {
    const lean = shouldReject
        ? jest.fn().mockRejectedValue(value)
        : jest.fn().mockResolvedValue(value);
    const populate = jest.fn().mockReturnValue({ lean });
    CarProvider.findById.mockReturnValue({ populate });
}

describe("US1-1 View reviews for a provider", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns reviews with vote summary and current user vote", async () => {
        const req = {
            params: { id: "provider-1" },
            user: { id: "user-1" },
        };
        const res = createMockRes();

        mockProviderQueryResult({
            _id: "provider-1",
            bookings: [
                {
                    _id: "booking-1",
                    review: {
                        rating: 5,
                        comment: "great",
                        createdAt: new Date("2026-04-01"),
                    },
                    user: { name: "A" },
                },
                {
                    _id: "booking-2",
                    review: {
                        rating: 4,
                        comment: "good",
                        createdAt: new Date("2026-04-02"),
                    },
                    user: { name: "B" },
                },
                {
                    _id: "booking-3",
                    review: null,
                    user: { name: "C" },
                },
            ],
        });

        Vote.aggregate.mockResolvedValue([
            { _id: "booking-1", upvoteCount: 3, downvoteCount: 1 },
            { _id: "booking-2", upvoteCount: 1, downvoteCount: 0 },
        ]);
        Vote.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([
                    { booking: "booking-1", voteType: "upvote" },
                ]),
            }),
        });

        await getCarProviderReviews(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const payload = res.json.mock.calls[0][0];
        expect(payload.success).toBe(true);
        expect(payload.data).toHaveLength(2);

        const first = payload.data.find((b) => b._id === "booking-1");
        const second = payload.data.find((b) => b._id === "booking-2");

        expect(first.voteSummary).toEqual({
            upvoteCount: 3,
            downvoteCount: 1,
            userVote: "upvote",
        });
        expect(second.voteSummary).toEqual({
            upvoteCount: 1,
            downvoteCount: 0,
            userVote: null,
        });
    });

    it("returns an empty list when provider has no valid reviews", async () => {
        const req = {
            params: { id: "provider-1" },
        };
        const res = createMockRes();

        mockProviderQueryResult({
            _id: "provider-1",
            bookings: [
                { _id: "booking-1", review: null },
                { _id: "booking-2", review: { rating: null } },
            ],
        });

        await getCarProviderReviews(req, res);

        expect(Vote.aggregate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [],
        });
    });

    it("returns 404 when car provider does not exist", async () => {
        const req = { params: { id: "missing-provider" } };
        const res = createMockRes();

        mockProviderQueryResult(null);

        await getCarProviderReviews(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "No car provider with the id of missing-provider",
        });
    });

    it("returns 500 when query fails", async () => {
        const req = { params: { id: "provider-1" } };
        const res = createMockRes();

        mockProviderQueryResult(new Error("db broken"), true);

        await getCarProviderReviews(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Cannot get reviews",
        });
    });
});
