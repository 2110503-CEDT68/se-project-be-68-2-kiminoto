const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

const {
    uploadAvatar,
    getAvatar,
    getUserAvatar,
    deleteAvatar,
    editProfileField,
    deleteProfileField,
} = require("../controllers/profile");

router
    .route("/avatar")
    .put(protect, authorize("admin", "user"), uploadAvatar)
    .get(protect, authorize("admin", "user"), getAvatar)
    .delete(protect, authorize("admin", "user"), deleteAvatar);

router
    .route("/avatar/:id")
    .get(protect, authorize("admin", "user"), getUserAvatar);

router
    .route("/fields")
    .patch(protect, authorize("admin", "user"), editProfileField)
    .delete(protect, authorize("admin", "user"), deleteProfileField);

module.exports = router;
