const express = require("express");

const {
    addReview,
    updateReview,
    deleteReview,
} = require("../controllers/reviews");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         comment:
 *           type: string
 *           example: "Great service and clean car!"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review management for bookings (LLM-moderated)
 */

/**
 * @swagger
 * /bookings/{bookingId}/reviews:
 *   post:
 *     summary: Submit a review for a completed booking
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Only the booking owner or admin can review. The booking must be completed
 *       and must not already have a review. Comments are moderated by an LLM and
 *       may be rejected if inappropriate.
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Excellent service!"
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error, booking not completed, review already exists, or content rejected by moderation
 *       401:
 *         description: Not authorized to review this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error or moderation service error
 *   put:
 *     summary: Update a review on a booking
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Only the booking owner or admin can edit. Updated comments are
 *       re-moderated by the LLM.
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 3
 *               comment:
 *                 type: string
 *                 example: "Updated: decent service."
 *     responses:
 *       200:
 *         description: Review updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Content rejected by moderation
 *       401:
 *         description: Not authorized to update this review
 *       404:
 *         description: Booking or review not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a review on a booking
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     description: Only the booking owner or admin can delete.
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Review deleted
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
 *       401:
 *         description: Not authorized to delete this review
 *       404:
 *         description: Booking or review not found
 *       500:
 *         description: Server error
 */
router
    .route("/")
    .post(protect, authorize("admin", "user"), addReview)
    .put(protect, authorize("admin", "user"), updateReview)
    .delete(protect, authorize("admin", "user"), deleteReview);

module.exports = router;
