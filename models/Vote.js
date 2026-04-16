const mongoose = require("mongoose");

const VoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: mongoose.Schema.ObjectId,
      ref: "Booking",
      required: true,
    },
    voteType: {
      type: String,
      enum: ["upvote", "downvote"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

VoteSchema.index({ user: 1, booking: 1 }, { unique: true });

module.exports = mongoose.model("Vote", VoteSchema);