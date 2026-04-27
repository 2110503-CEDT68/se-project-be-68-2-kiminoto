jest.mock("../../models/CarProvider");
jest.mock("../../models/Booking");
jest.mock("../../models/Vote");

const CarProvider = require("../../models/CarProvider");
const Booking = require("../../models/Booking");

const {
    getCarProviders,
    getCarProvider,
    createCarProvider,
    updateCarProvider,
    deleteCarProvider,
} = require("../../controllers/carProviders");
const { createMockRes } = require("../testHelpers");

function createFindChain(result, shouldReject) {
    return {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: shouldReject
            ? jest.fn().mockRejectedValue(result)
            : jest.fn().mockResolvedValue(result),
    };
}

describe("Additional - Car providers controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns provider list with computed avg rating", async () => {
        const req = { query: {} };
        const res = createMockRes();

        const providers = [
            {
                _id: "provider-1",
                bookings: [
                    { review: { rating: 5 } },
                    { review: { rating: 3 } },
                ],
                toObject: jest.fn(function toObject() {
                    return { _id: this._id, bookings: this.bookings };
                }),
            },
        ];

        const chain = createFindChain(providers);
        CarProvider.find.mockReturnValue(chain);
        CarProvider.countDocuments.mockResolvedValue(1);

        await getCarProviders(req, res);

        expect(chain.sort).toHaveBeenCalledWith("-createdAt");
        expect(res.status).toHaveBeenCalledWith(200);
        const payload = res.json.mock.calls[0][0];
        expect(payload.data[0].avgRating).toBe(4);
    });

    it("applies select, sort and pagination query options", async () => {
        const req = {
            query: {
                select: "name,address",
                sort: "name,-createdAt",
                page: "2",
                limit: "5",
            },
        };
        const res = createMockRes();

        const chain = createFindChain([]);
        CarProvider.find.mockReturnValue(chain);
        CarProvider.countDocuments.mockResolvedValue(20);

        await getCarProviders(req, res);

        expect(chain.select).toHaveBeenCalledWith("name address");
        expect(chain.sort).toHaveBeenCalledWith("name -createdAt");
        expect(chain.skip).toHaveBeenCalledWith(5);
        expect(chain.limit).toHaveBeenCalledWith(5);
    });

    it("returns 400 when listing providers fails", async () => {
        const req = { query: {} };
        const res = createMockRes();

        CarProvider.find.mockReturnValue(createFindChain(new Error("db broken"), true));
        CarProvider.countDocuments.mockResolvedValue(0);

        await getCarProviders(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "db broken",
        });
    });

    it("returns one provider by id", async () => {
        const req = { params: { id: "provider-1" } };
        const res = createMockRes();

        CarProvider.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue({
                _id: "provider-1",
                bookings: [{ review: { rating: 5 } }],
                toObject: jest.fn(function toObject() {
                    return { _id: this._id, bookings: this.bookings };
                }),
            }),
        });

        await getCarProvider(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 for unknown provider id", async () => {
        const req = { params: { id: "missing" } };
        const res = createMockRes();

        CarProvider.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
        });

        await getCarProvider(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("creates provider", async () => {
        const req = { body: { name: "New Provider" } };
        const res = createMockRes();

        CarProvider.create.mockResolvedValue({ _id: "provider-1" });

        await createCarProvider(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("updates provider or returns 404", async () => {
        const req = {
            params: { id: "provider-1" },
            body: { name: "Updated" },
        };
        const res = createMockRes();

        CarProvider.findByIdAndUpdate.mockResolvedValue({ _id: "provider-1" });
        await updateCarProvider(req, res);
        expect(res.status).toHaveBeenCalledWith(200);

        const missingRes = createMockRes();
        CarProvider.findByIdAndUpdate.mockResolvedValue(null);
        await updateCarProvider(req, missingRes);
        expect(missingRes.status).toHaveBeenCalledWith(404);
    });

    it("deletes provider and related bookings", async () => {
        const req = { params: { id: "provider-1" } };
        const res = createMockRes();

        CarProvider.findById.mockResolvedValue({ _id: "provider-1" });
        Booking.deleteMany.mockResolvedValue({ deletedCount: 3 });
        CarProvider.deleteOne.mockResolvedValue({ deletedCount: 1 });

        await deleteCarProvider(req, res);

        expect(Booking.deleteMany).toHaveBeenCalledWith({
            carProvider: "provider-1",
        });
        expect(CarProvider.deleteOne).toHaveBeenCalledWith({
            _id: "provider-1",
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when deleting unknown provider", async () => {
        const req = { params: { id: "missing" } };
        const res = createMockRes();

        CarProvider.findById.mockResolvedValue(null);

        await deleteCarProvider(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
