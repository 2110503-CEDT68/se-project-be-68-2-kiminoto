const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const customFieldSchema = new mongoose.Schema({
    key: {
        type: String,
        required: [true, "Please add a key"],
        minLength: [1, "Key is blank."],
        maxLength: [16, "Key is too long."],
    },
    value: {
        type: String,
        required: [true, "Please add a value"],
        minLength: [1, "Value is blank."],
        maxLength: [32, "Value is too long."],
    },
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"],
    },
    tel: {
        type: String,
        required: [true, "Please add a telephone number"],
    },
    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please add a valid email",
        ],
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    password: {
        type: String,
        required: [true, "Please add a password"],
        minlength: 6,
        select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    profile: {
        avatar: {
            data: Buffer,
            contentType: String,
        },
        fields: {
            type: [customFieldSchema],
            default: [],
        },
    },
});

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

userSchema.pre("validate", function (next) {
    const customFields = this.profile && this.profile.fields
        ? this.profile.fields
        : [];

    // TODO: Un-magic number this
    if (customFields.length > 5) {
        throw new Error("Custom fields length exceeds limit of 5.");
    }
});

userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
