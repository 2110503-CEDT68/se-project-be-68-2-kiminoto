const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

const {
    getPublicProfile,
    uploadAvatar,
    getAvatar,
    getUserAvatar,
    deleteAvatar,
    editProfileField,
    deleteProfileField,
} = require("../controllers/profile");

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management (avatar & custom fields)
 */

/**
 * @swagger
 * /profile/avatar:
 *   put:
 *     summary: Upload or replace user avatar
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64-encoded image string or data URL (e.g. "data:image/png;base64,...")
 *                 example: "data:image/png;base64,iVBORw0KGgo..."
 *               contentType:
 *                 type: string
 *                 description: Image MIME type (optional if using data URL)
 *                 enum: [image/png, image/jpeg, image/jpg, image/webp, image/gif]
 *                 example: "image/png"
 *     responses:
 *       200:
 *         description: Avatar uploaded
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
 *                     contentType:
 *                       type: string
 *                       example: "image/png"
 *                     size:
 *                       type: integer
 *                       description: Image size in bytes
 *                       example: 102400
 *       400:
 *         description: Invalid image, unsupported type, or exceeds 2MB
 *       401:
 *         description: Not authorized
 *   get:
 *     summary: Get current user's avatar image
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar image binary
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *           image/gif:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Avatar not found
 *       401:
 *         description: Not authorized
 *   delete:
 *     summary: Delete current user's avatar
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted
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
 *                     message:
 *                       type: string
 *                       example: "Avatar deleted successfully."
 *       404:
 *         description: Avatar not found
 *       401:
 *         description: Not authorized
 */
router
    .route("/avatar")
    .put(protect, authorize("admin", "user"), uploadAvatar)
    .get(protect, authorize("admin", "user"), getAvatar)
    .delete(protect, authorize("admin", "user"), deleteAvatar);

/**
 * @swagger
 * /profile/avatar/{id}:
 *   get:
 *     summary: Get another user's avatar image
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Avatar image binary (cached for 5 minutes)
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: User or avatar not found
 */
router
    .route("/avatar/:id")
    .get(getUserAvatar);

/**
 * @swagger
 * /profile/fields:
 *   patch:
 *     summary: Create or update a custom profile field
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     description: Maximum 5 custom fields per user. If the key already exists, its value is updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 16
 *                 example: "nickname"
 *               value:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 32
 *                 example: "Johnny"
 *     responses:
 *       200:
 *         description: Profile field updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or exceeds field limit
 *       401:
 *         description: Not authorized
 *   delete:
 *     summary: Delete a custom profile field
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *                 example: "nickname"
 *     responses:
 *       200:
 *         description: Profile field deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Field not found
 *       401:
 *         description: Not authorized
 */
router
    .route("/fields")
    .patch(protect, authorize("admin", "user"), editProfileField)
    .delete(protect, authorize("admin", "user"), deleteProfileField);

/**
 * @swagger
 * /profile/{id}:
 *   get:
 *     summary: Get a user's public profile
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Public profile data (name, email, tel, custom fields)
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
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     tel:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     profile:
 *                       type: object
 *                       properties:
 *                         fields:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/CustomField'
 *       404:
 *         description: User not found
 */
router
    .route("/:id")
    .get(getPublicProfile);

module.exports = router;
