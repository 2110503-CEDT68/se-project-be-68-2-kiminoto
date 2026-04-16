const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    review: {
      type: mongoose.Schema.ObjectId,
      ref: 'Review',
      required: true
    },
    voteType: {
      type: String,
      enum: ['upvote', 'downvote'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

VoteSchema.index({ user: 1, review: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);