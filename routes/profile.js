const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router
    .route("/fields")
    .patch(protect, authorize("admin", "user"), editProfileField);
