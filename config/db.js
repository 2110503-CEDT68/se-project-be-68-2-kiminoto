const mongoose = require("mongoose");

let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined");
    }

    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    cachedConnection = conn;

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
};

module.exports = connectDB;
