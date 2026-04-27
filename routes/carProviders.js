const express = require("express");
const router = express.Router();

const { protect, authorize, optionalProtect } = require("../middleware/auth");

const {
    getCarProviderReviews,
    getCarProviders,
    getCarProvider,
    createCarProvider,
    updateCarProvider,
    deleteCarProvider,
} = require("../controllers/carProviders");

const bookingRouter = require("./bookings");

router.use("/:carProviderId/bookings/", bookingRouter);

/**
 * @swagger
 * components:
 *   schemas:
 *     CarProvider:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - tel
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ObjectId
 *           example: "665f1b2e3c4d5e6f7a8b9c0d"
 *         name:
 *           type: string
 *           maxLength: 50
 *           example: "Bangkok Car Rental"
 *         address:
 *           type: string
 *           example: "123 Sukhumvit Rd, Bangkok"
 *         tel:
 *           type: string
 *           example: "021234567"
 *         avgRating:
 *           type: number
 *           nullable: true
 *           description: Computed average rating from reviews
 *           example: 4.2
 */

/**
 * @swagger
 * tags:
 *   name: Car Providers
 *   description: Car rental provider management
 */

/**
 * @swagger
 * /car-providers/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a car provider
 *     tags: [Car Providers]
 *     description: Returns all reviews for a specific car provider with vote summaries. Optionally includes the current user's vote if authenticated.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car provider ID
 *     responses:
 *       200:
 *         description: List of reviews with vote summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       review:
 *                         $ref: '#/components/schemas/Review'
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       voteSummary:
 *                         type: object
 *                         properties:
 *                           upvoteCount:
 *                             type: integer
 *                             example: 5
 *                           downvoteCount:
 *                             type: integer
 *                             example: 1
 *                           userVote:
 *                             type: string
 *                             nullable: true
 *                             enum: [upvote, downvote, null]
 *       404:
 *         description: Car provider not found
 *       500:
 *         description: Server error
 */
router
    .route("/:id/reviews")
    .get(optionalProtect, getCarProviderReviews);

/**
 * @swagger
 * /car-providers/{id}:
 *   get:
 *     summary: Get a single car provider
 *     tags: [Car Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car provider ID
 *     responses:
 *       200:
 *         description: Car provider data with average rating
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CarProvider'
 *       404:
 *         description: Car provider not found
 *   put:
 *     summary: Update a car provider
 *     tags: [Car Providers]
 *     security:
 *       - bearerAuth: []
 *     description: Admin only
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Car Rental"
 *               address:
 *                 type: string
 *                 example: "456 New Address"
 *               tel:
 *                 type: string
 *                 example: "029876543"
 *     responses:
 *       200:
 *         description: Updated car provider
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CarProvider'
 *       404:
 *         description: Car provider not found
 *       401:
 *         description: Not authorized (admin only)
 *   delete:
 *     summary: Delete a car provider
 *     tags: [Car Providers]
 *     security:
 *       - bearerAuth: []
 *     description: Admin only. Also deletes all associated bookings.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car provider ID
 *     responses:
 *       200:
 *         description: Car provider deleted
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
 *         description: Car provider not found
 *       401:
 *         description: Not authorized (admin only)
 */
router
    .route("/:id")
    .get(getCarProvider)
    .put(protect, authorize("admin"), updateCarProvider)
    .delete(protect, authorize("admin"), deleteCarProvider);

/**
 * @swagger
 * /car-providers:
 *   get:
 *     summary: Get all car providers
 *     tags: [Car Providers]
 *     description: Supports filtering, field selection, sorting, and pagination via query parameters.
 *     parameters:
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *         description: Comma-separated fields to select (e.g. "name,address")
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Comma-separated sort fields (e.g. "name,-createdAt")
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of car providers
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
 *                   example: 5
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     next:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                     prev:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CarProvider'
 *       400:
 *         description: Bad request
 *   post:
 *     summary: Create a new car provider
 *     tags: [Car Providers]
 *     security:
 *       - bearerAuth: []
 *     description: Admin only
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - tel
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Bangkok Car Rental"
 *               address:
 *                 type: string
 *                 example: "123 Sukhumvit Rd, Bangkok"
 *               tel:
 *                 type: string
 *                 example: "021234567"
 *     responses:
 *       201:
 *         description: Car provider created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CarProvider'
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Not authorized (admin only)
 */
router
    .route("/")
    .get(getCarProviders)
    .post(protect, authorize("admin"), createCarProvider);

module.exports = router;
