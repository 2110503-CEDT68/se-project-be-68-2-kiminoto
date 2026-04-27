jest.mock("mongoose", () => ({
    set: jest.fn(),
    connect: jest.fn(),
}));

const mongoose = require("mongoose");

function loadConnectDbModule() {
    let connectDB;
    jest.isolateModules(() => {
        connectDB = require("../../config/db");
    });
    return connectDB;
}

describe("Additional - DB connection helper", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("throws when MONGO_URI is not defined", async () => {
        delete process.env.MONGO_URI;
        const connectDB = loadConnectDbModule();

        await expect(connectDB()).rejects.toThrow("MONGO_URI is not defined");
        expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it("connects once and returns cached connection", async () => {
        process.env.MONGO_URI = "mongodb://localhost:27017/test";
        const mockConn = { connection: { host: "localhost" } };
        mongoose.connect.mockResolvedValue(mockConn);

        const connectDB = loadConnectDbModule();

        const first = await connectDB();
        const second = await connectDB();

        expect(mongoose.set).toHaveBeenCalledWith("strictQuery", true);
        expect(mongoose.connect).toHaveBeenCalledTimes(1);
        expect(mongoose.connect).toHaveBeenCalledWith(
            "mongodb://localhost:27017/test",
        );
        expect(first).toBe(mockConn);
        expect(second).toBe(mockConn);
    });

    it("propagates mongoose connection errors", async () => {
        process.env.MONGO_URI = "mongodb://localhost:27017/test";
        mongoose.connect.mockRejectedValue(new Error("connection failed"));
        const connectDB = loadConnectDbModule();

        await expect(connectDB()).rejects.toThrow("connection failed");
    });
});
