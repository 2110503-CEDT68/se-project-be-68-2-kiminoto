const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

const {
    editProfileField,
    deleteProfileField,
} = require("../controllers/profile");

router
    .route("/fields")
    .patch(protect, authorize("admin", "user"), editProfileField)
    .delete(protect, authorize("admin", "user"), deleteProfileField);

module.exports = router;
