const express = require("express");

const {
    getBookings,
    getBooking,
    addBooking,
    updateBooking,
    deleteBooking,
} = require("../controllers/bookings");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

const reviews = require("./reviews");
const votes = require("./votes");

router.use("/:bookingId/reviews", reviews);
router.use("/:bookingId/votes", votes);

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ObjectId
 *           example: "665f1b2e3c4d5e6f7a8b9c0d"
 *         bookDate:
 *           type: string
 *           format: date-time
 *           example: "2026-05-15T10:00:00.000Z"
 *         user:
 *           type: string
 *           description: User ObjectId
 *           example: "665f1b2e3c4d5e6f7a8b9c0e"
 *         carProvider:
 *           type: string
 *           description: Car Provider ObjectId
 *           example: "665f1b2e3c4d5e6f7a8b9c0f"
 *         status:
 *           type: string
 *           enum: [active, completed]
 *           default: active
 *         review:
 *           $ref: '#/components/schemas/Review'
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: Regular users see only their own bookings. Admins see all bookings.
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /car-providers/{carProviderId}/bookings:
 *   get:
 *     summary: Get all bookings for a specific car provider
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: Admin only. Returns bookings for a specific car provider.
 *     parameters:
 *       - in: path
 *         name: carProviderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Car provider ID
 *     responses:
 *       200:
 *         description: List of bookings for the car provider
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authorized
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: Users can have at most 3 active bookings. Admins have no limit.
 *     parameters:
 *       - in: path
 *         name: carProviderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Car provider ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookDate
 *             properties:
 *               bookDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-15T10:00:00.000Z"
 *     responses:
 *       200:
 *         description: Booking created
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
 *         description: User has reached booking limit (3 active bookings)
 *       404:
 *         description: Car provider not found
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router
    .route("/")
    .get(protect, getBookings)
    .post(protect, authorize("admin", "user"), addBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a single booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking data
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
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: Only the booking owner or admin can update.
 *     parameters:
 *       - in: path
 *         name: id
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
 *               bookDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-01T10:00:00.000Z"
 *               status:
 *                 type: string
 *                 enum: [active, completed]
 *     responses:
 *       200:
 *         description: Booking updated
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
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Not authorized to update this booking
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: Only the booking owner or admin can delete.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking deleted
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
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Not authorized to delete this booking
 *       500:
 *         description: Server error
 */
router
    .route("/:id")
    .get(protect, getBooking)
    .put(protect, authorize("admin", "user"), updateBooking)
    .delete(protect, authorize("admin", "user"), deleteBooking);

module.exports = router;
