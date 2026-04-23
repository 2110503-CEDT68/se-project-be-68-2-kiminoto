const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

const { editProfileField } = require("../controllers/profile");

router
    .route("/fields")
    .patch(protect, authorize("admin", "user"), editProfileField);

module.exports = router;
