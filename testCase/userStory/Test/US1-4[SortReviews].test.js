jest.mock("../../../models/CarProvider");
jest.mock("../../../models/Vote");
jest.mock("../../../models/Booking");

const CarProvider = require("../../../models/CarProvider");
const Vote = require("../../../models/Vote");
const Booking = require("../../../models/Booking");
const { getCarProviderReviews } = require("../../../controllers/carProviders");
const { getVoteSummary } = require("../../../controllers/votes");
const { createMockRes } = require("../../testHelpers");

function mockProviderQueryResult(value) {
    CarProvider.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(value),
        }),
    });
}

describe("US1-4 Sort reviews by most helpful or most recent", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns review data that can be sorted by most recent", async () => {
        const req = {
            params: { id: "provider-1" },
            user: { id: "user-1" },
        };
        const res = createMockRes();

        mockProviderQueryResult({
            _id: "provider-1",
            bookings: [
                {
                    _id: "booking-a",
                    review: {
                        rating: 5,
                        comment: "old",
                        createdAt: "2026-01-01T00:00:00.000Z",
                    },
                },
                {
                    _id: "booking-b",
                    review: {
                        rating: 4,
                        comment: "new",
                        createdAt: "2026-03-01T00:00:00.000Z",
                    },
                },
            ],
        });

        Vote.aggregate.mockResolvedValue([
            { _id: "booking-a", upvoteCount: 0, downvoteCount: 0 },
            { _id: "booking-b", upvoteCount: 0, downvoteCount: 0 },
        ]);
        Vote.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });

        await getCarProviderReviews(req, res);

        const payload = res.json.mock.calls[0][0];
        const sortedByRecent = [...payload.data].sort(
            (a, b) => new Date(b.review.createdAt) - new Date(a.review.createdAt),
        );

        expect(payload.success).toBe(true);
        expect(sortedByRecent[0]._id).toBe("booking-b");
        expect(sortedByRecent[1]._id).toBe("booking-a");
    });

    it("returns vote counts that can be sorted by helpfulness", async () => {
        const req = {
            params: { bookingId: "booking-1" },
            user: { id: "user-1" },
        };
        const res = createMockRes();

        Booking.findById.mockResolvedValue({
            _id: "booking-1",
            review: { rating: 5 },
        });
        Vote.countDocuments
            .mockResolvedValueOnce(12)
            .mockResolvedValueOnce(3);
        Vote.findOne.mockResolvedValue({ voteType: "upvote" });

        await getVoteSummary(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                bookingId: "booking-1",
                upvoteCount: 12,
                downvoteCount: 3,
                userVote: "upvote",
            },
        });
    });

    it("provides default zero counts when no votes exist", async () => {
        const req = {
            params: { id: "provider-1" },
        };
        const res = createMockRes();

        mockProviderQueryResult({
            _id: "provider-1",
            bookings: [
                {
                    _id: "booking-a",
                    review: {
                        rating: 3,
                        comment: "neutral",
                        createdAt: "2026-02-01T00:00:00.000Z",
                    },
                },
            ],
        });

        Vote.aggregate.mockResolvedValue([]);

        await getCarProviderReviews(req, res);

        const payload = res.json.mock.calls[0][0];
        expect(payload.data[0].voteSummary).toEqual({
            upvoteCount: 0,
            downvoteCount: 0,
            userVote: null,
        });
    });
});
