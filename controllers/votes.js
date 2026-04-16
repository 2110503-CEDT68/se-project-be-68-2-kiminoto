const Vote = require("../models/Vote");
const Booking = require("../models/Booking");

// @desc   Add a downvote to a review
// @route  POST /api/v1/bookings/:bookingId/votes/downvote
// @access Private
exports.addDownvote = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        // Check if booking exists and has a review
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

        // Check if user already downvoted this review
        const existingVote = await Vote.findOne({
            user: userId,
            review: bookingId,
            voteType: "downvote",
        });

        if (existingVote) {
            return res.status(400).json({
                success: false,
                message: "You have already downvoted this review",
            });
        }

        // Remove upvote if exists (user can't both upvote and downvote)
        await Vote.deleteOne({
            user: userId,
            review: bookingId,
            voteType: "upvote",
        });

        // Create downvote
        const downvote = await Vote.create({
            user: userId,
            review: bookingId,
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

// @desc   Remove a downvote from a review
// @route  DELETE /api/v1/bookings/:bookingId/votes/downvote
// @access Private
exports.removeDownvote = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        // Check if booking exists and has a review
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

        // Find and delete downvote
        const vote = await Vote.findOneAndDelete({
            user: userId,
            review: bookingId,
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

// @desc   Get total downvote count for a review
// @route  GET /api/v1/bookings/:bookingId/votes/downvote
// @access Public
exports.getDownvoteCount = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        // Check if booking exists and has a review
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

        // Count downvotes
        const downvoteCount = await Vote.countDocuments({
            review: bookingId,
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

// @desc   Add an upvote to a review
// @route  POST /api/v1/bookings/:bookingId/votes/upvote
// @access Private
exports.addUpvote = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        // Check if booking exists and has a review
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

        // Check if user already upvoted this review
        const existingVote = await Vote.findOne({
            user: userId,
            review: bookingId,
            voteType: "upvote",
        });

        if (existingVote) {
            return res.status(400).json({
                success: false,
                message: "You have already upvoted this review",
            });
        }

        // Remove downvote if exists (user can't both upvote and downvote)
        await Vote.deleteOne({
            user: userId,
            review: bookingId,
            voteType: "downvote",
        });

        // Create upvote
        const upvote = await Vote.create({
            user: userId,
            review: bookingId,
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

// @desc   Remove an upvote from a review
// @route  DELETE /api/v1/bookings/:bookingId/votes/upvote
// @access Private
exports.removeUpvote = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        // Check if booking exists and has a review
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

        // Find and delete upvote
        const vote = await Vote.findOneAndDelete({
            user: userId,
            review: bookingId,
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

// @desc   Get total upvote count for a review
// @route  GET /api/v1/bookings/:bookingId/votes/upvote
// @access Public
exports.getUpvoteCount = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        // Check if booking exists and has a review
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

        // Count upvotes
        const upvoteCount = await Vote.countDocuments({
            review: bookingId,
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
