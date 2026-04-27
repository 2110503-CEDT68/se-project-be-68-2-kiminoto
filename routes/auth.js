const express = require("express");
const router = express.Router();

const { register, login, getMe, logout } = require("../controllers/auth");
const { protect } = require("../middleware/auth");

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ObjectId
 *           example: "665f1b2e3c4d5e6f7a8b9c0d"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         tel:
 *           type: string
 *           example: "0812345678"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *         createdAt:
 *           type: string
 *           format: date-time
 *         profile:
 *           type: object
 *           properties:
 *             fields:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CustomField'
 *     CustomField:
 *       type: object
 *       required:
 *         - key
 *         - value
 *       properties:
 *         key:
 *           type: string
 *           minLength: 1
 *           maxLength: 16
 *           example: "nickname"
 *         value:
 *           type: string
 *           minLength: 1
 *           maxLength: 32
 *           example: "Johnny"
 *     TokenResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & authorization
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - tel
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               tel:
 *                 type: string
 *                 example: "0812345678"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Validation error or duplicate email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 */
router.route("/register").post(register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Missing email/password or user not found
 *       401:
 *         description: Invalid credentials
 */
router.route("/login").post(login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
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
 *       401:
 *         description: Not authorized
 */
router.route("/me").get(protect, getMe);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout user / clear cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
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
 */
router.route("/logout").get(logout);

module.exports = router;
