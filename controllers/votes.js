const Vote = require("../models/Vote");
const Booking = require("../models/Booking");

// @desc   Add a downvote to a review
// @route  POST /api/v1/bookings/:bookingId/votes/downvote
// @access Private
exports.addDownvote = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${bookingId}`,
            });
        }

        if (!booking.review || booking.review.rating == null) {
            return res.status(404).json({
                success: false,
                message: "No review exists for this booking",
            });
        }

        const existingVote = await Vote.findOne({
            user: userId,
            booking: bookingId,
            voteType: "downvote",
        });

        if (existingVote) {
            return res.status(400).json({
                success: false,
                message: "You have already downvoted this review",
            });
        }

        await Vote.deleteOne({
            user: userId,
            booking: bookingId,
            voteType: "upvote",
        });

        const downvote = await Vote.create({
            user: userId,
            booking: bookingId,
            voteType: "downvote",
        });

        res.status(201).json({
            success: true,
            data: downvote,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error adding downvote",
        });
    }
};

exports.removeDownvote = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${bookingId}`,
            });
        }

        if (!booking.review || booking.review.rating == null) {
            return res.status(404).json({
                success: false,
                message: "No review exists for this booking",
            });
        }

        const vote = await Vote.findOneAndDelete({
            user: userId,
            booking: bookingId,
            voteType: "downvote",
        });

        if (!vote) {
            return res.status(404).json({
                success: false,
                message: "You have not downvoted this review",
            });
        }

        res.status(200).json({
            success: true,
            data: {},
            message: "Downvote removed successfully",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error removing downvote",
        });
    }
};

exports.getDownvoteCount = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${bookingId}`,
            });
        }

        if (!booking.review || booking.review.rating == null) {
            return res.status(404).json({
                success: false,
                message: "No review exists for this booking",
            });
        }

        const downvoteCount = await Vote.countDocuments({
            booking: bookingId,
            voteType: "downvote",
        });

        res.status(200).json({
            success: true,
            data: {
                bookingId,
                downvoteCount,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error fetching downvote count",
        });
    }
};

exports.addUpvote = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${bookingId}`,
            });
        }

        if (!booking.review || booking.review.rating == null) {
            return res.status(404).json({
                success: false,
                message: "No review exists for this booking",
            });
        }

        const existingVote = await Vote.findOne({
            user: userId,
            booking: bookingId,
            voteType: "upvote",
        });

        if (existingVote) {
            return res.status(400).json({
                success: false,
                message: "You have already upvoted this review",
            });
        }

        await Vote.deleteOne({
            user: userId,
            booking: bookingId,
            voteType: "downvote",
        });

        const upvote = await Vote.create({
            user: userId,
            booking: bookingId,
            voteType: "upvote",
        });

        res.status(201).json({
            success: true,
            data: upvote,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error adding upvote",
        });
    }
};

exports.removeUpvote = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${bookingId}`,
            });
        }

        if (!booking.review || booking.review.rating == null) {
            return res.status(404).json({
                success: false,
                message: "No review exists for this booking",
            });
        }

        const vote = await Vote.findOneAndDelete({
            user: userId,
            booking: bookingId,
            voteType: "upvote",
        });

        if (!vote) {
            return res.status(404).json({
                success: false,
                message: "You have not upvoted this review",
            });
        }

        res.status(200).json({
            success: true,
            data: {},
            message: "Upvote removed successfully",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error removing upvote",
        });
    }
};

exports.getUpvoteCount = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${bookingId}`,
            });
        }

        if (!booking.review || booking.review.rating == null) {
            return res.status(404).json({
                success: false,
                message: "No review exists for this booking",
            });
        }

        const upvoteCount = await Vote.countDocuments({
            booking: bookingId,
            voteType: "upvote",
        });

        res.status(200).json({
            success: true,
            data: {
                bookingId,
                upvoteCount,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error fetching upvote count",
        });
    }
};

// @desc   Get vote summary of a booking review
// @route  GET /api/v1/bookings/:bookingId/votes
// @access Public หรือ Private ก็ได้
exports.getVoteSummary = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user ? req.user.id : null;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${bookingId}`,
            });
        }

        if (!booking.review || booking.review.rating == null) {
            return res.status(404).json({
                success: false,
                message: "No review exists for this booking",
            });
        }

        const upvoteCount = await Vote.countDocuments({
            booking: bookingId,
            voteType: "upvote",
        });

        const downvoteCount = await Vote.countDocuments({
            booking: bookingId,
            voteType: "downvote",
        });

        let userVote = null;

        if (userId) {
            const vote = await Vote.findOne({
                user: userId,
                booking: bookingId,
            });

            if (vote) {
                userVote = vote.voteType;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                bookingId,
                upvoteCount,
                downvoteCount,
                userVote, // "upvote", "downvote", หรือ null
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error fetching vote summary",
        });
    }
};