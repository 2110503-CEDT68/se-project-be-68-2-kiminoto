const express = require("express");
const {
    addDownvote,
    removeDownvote,
    getDownvoteCount,
    addUpvote,
    removeUpvote,
    getUpvoteCount,
    getVoteSummary
} = require("../controllers/votes");
const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * components:
 *   schemas:
 *     Vote:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "665f1b2e3c4d5e6f7a8b9c10"
 *         user:
 *           type: string
 *           description: User ObjectId
 *           example: "665f1b2e3c4d5e6f7a8b9c0e"
 *         booking:
 *           type: string
 *           description: Booking ObjectId
 *           example: "665f1b2e3c4d5e6f7a8b9c0d"
 *         voteType:
 *           type: string
 *           enum: [upvote, downvote]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     VoteSummary:
 *       type: object
 *       properties:
 *         bookingId:
 *           type: string
 *         upvoteCount:
 *           type: integer
 *           example: 10
 *         downvoteCount:
 *           type: integer
 *           example: 2
 *         userVote:
 *           type: string
 *           nullable: true
 *           enum: [upvote, downvote, null]
 *           description: Current user's vote, or null if not voted
 */

/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: Upvote / downvote management for booking reviews
 */

/**
 * @swagger
 * /bookings/{bookingId}/votes:
 *   get:
 *     summary: Get vote summary for a booking review
 *     tags: [Votes]
 *     description: Returns upvote count, downvote count, and the current user's vote (if authenticated).
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Vote summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VoteSummary'
 *       404:
 *         description: Booking not found or no review exists
 *       500:
 *         description: Server error
 */
router.get("/", getVoteSummary);

/**
 * @swagger
 * /bookings/{bookingId}/votes/downvote:
 *   post:
 *     summary: Add a downvote to a booking review
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     description: Adds a downvote. If the user previously upvoted, the upvote is removed first.
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       201:
 *         description: Downvote added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Vote'
 *       400:
 *         description: Already downvoted
 *       404:
 *         description: Booking not found or no review exists
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Remove a downvote from a booking review
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Downvote removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: "Downvote removed successfully"
 *       404:
 *         description: No downvote found, booking not found, or no review exists
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get downvote count for a booking review
 *     tags: [Votes]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Downvote count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                     downvoteCount:
 *                       type: integer
 *                       example: 3
 *       404:
 *         description: Booking not found or no review exists
 *       500:
 *         description: Server error
 */
router.post("/downvote", protect, addDownvote);
router.delete("/downvote", protect, removeDownvote);
router.get("/downvote", getDownvoteCount);

/**
 * @swagger
 * /bookings/{bookingId}/votes/upvote:
 *   post:
 *     summary: Add an upvote to a booking review
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     description: Adds an upvote. If the user previously downvoted, the downvote is removed first.
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       201:
 *         description: Upvote added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Vote'
 *       400:
 *         description: Already upvoted
 *       404:
 *         description: Booking not found or no review exists
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Remove an upvote from a booking review
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Upvote removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: "Upvote removed successfully"
 *       404:
 *         description: No upvote found, booking not found, or no review exists
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get upvote count for a booking review
 *     tags: [Votes]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Upvote count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                     upvoteCount:
 *                       type: integer
 *                       example: 10
 *       404:
 *         description: Booking not found or no review exists
 *       500:
 *         description: Server error
 */
router.post("/upvote", protect, addUpvote);
router.delete("/upvote", protect, removeUpvote);
router.get("/upvote", getUpvoteCount);

module.exports = router;
