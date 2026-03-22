const mongoose = require("mongoose");

const CarProviderSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please add a name"],
            unique: true,
            trim: true,
            maxlength: [50, "Name can not be more than 50 characters"],
        },
        address: {
            type: String,
            required: [true, "Please add an address"],
        },
        tel: {
            type: String,
            required: [true, "Please add a telephone number"],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

CarProviderSchema.virtual("bookings", {
    ref: "Booking",
    localField: "_id",
    foreignField: "carProvider",
    justOne: false,
});

module.exports = mongoose.model("CarProvider", CarProviderSchema);
