const Booking = require("../models/Booking");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

async function moderateContent(text) {
    const result = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content:
                            "You are a content moderator. Evaluate the following review text " +
                            "for inappropriate, offensive, or harmful content. " +
                            "Start your reply with exactly one word: APPROVED or REJECTED." +
                            "If the review is REJECTED, follow up by the exact reason after the word REJECTED," +
                            "separated by '|' without space between them. Do not add any other text." +
                            "\n\n\n\n Also, you are very picky. Even a little bit of offensiveness, such as " +
                            "not using polite language, writing unrelated comments, using wrong grammar, or expressing controversial opinion will result in a REJECTION." +
                            "\n\n\n\n Here is the text: " +
                            text,
                    },
                ],
            }),
        },
    );

    const data = await result.json();

    return {
        text: data.choices[0].message.content.split("|")[0],
        reason: data.choices[0].message.content.split("|")[1] || "",
    };
}

// @desc   Submit a review for a completed booking
// @route  POST /api/v1/bookings/:bookingId/review
// @access Private
exports.addReview = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.bookingId}`,
            });
        }

        // Only the booking owner or the admin can review
        if (
            booking.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to review this booking`,
            });
        }

        // Booking must be completed
        if (booking.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "You can only review a completed booking",
            });
        }

        // One review per booking
        if (booking.review.rating != null) {
            return res.status(400).json({
                success: false,
                message: "A review already exists for this booking",
            });
        }

        const { rating, comment } = req.body;

        if (!rating || !comment || rating < 0 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Please provide both a rating (1–5) and a comment",
            });
        }

        // LLM moderation
        const moderationResult = await moderateContent(comment);
        if (moderationResult.text === "REJECTED") {
            return res.status(400).json({
                success: false,
                message:
                    "Your review was rejected because of the following reason: " +
                    moderationResult.reason,
            });
        }

        booking.review = {
            rating,
            comment,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await booking.save();

        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ success: false, message: "Cannot submit review" });
    }
};

// @desc   Update a review on a booking
// @route  PUT /api/v1/bookings/:bookingId/review
// @access Private
exports.updateReview = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.bookingId}`,
            });
        }

        // Only the booking owner or the admin can edit
        if (
            booking.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this review`,
            });
        }

        // Review must exist first
        if (booking.review.rating == null) {
            return res.status(404).json({
                success: false,
                message: "No review found for this booking",
            });
        }

        const { rating, comment } = req.body;

        // LLM moderation on the new comment
        if (comment != null) {
            const moderationResult = await moderateContent(comment);
            if (moderationResult.text === "REJECTED") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Your review was rejected because of the following reason: " +
                        moderationResult.reason,
                });
            }
        }

        if (rating != null) booking.review.rating = rating;
        if (comment != null) booking.review.comment = comment;
        booking.review.updatedAt = new Date();

        await booking.save();

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ success: false, message: "Cannot update review" });
    }
};

// @desc   Delete a review on a booking
// @route  DELETE /api/v1/bookings/:bookingId/review
// @access Private
exports.deleteReview = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.bookingId}`,
            });
        }

        // Only the booking owner or the admin can delete
        if (
            booking.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this review`,
            });
        }

        // Review must exist first
        if (!booking.review || booking.review.rating == null) {
            return res.status(404).json({
                success: false,
                message: "No review found for this booking",
            });
        }

        booking.review = undefined;
        await booking.save();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ success: false, message: "Cannot delete review" });
    }
};
