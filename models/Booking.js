const mongoose = require("mongoose");
const ReviewSchema = require("./Review");

const BookingSchema = new mongoose.Schema({
    bookDate: {
        type: Date,
        required: true,
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    carProvider: {
        type: mongoose.Schema.ObjectId,
        ref: "CarProvider",
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "completed"],
        default: "active",
    },
    review: ReviewSchema,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Booking", BookingSchema);
