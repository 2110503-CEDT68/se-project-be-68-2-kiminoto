const express = require("express");

const {
    addReview,
    updateReview,
    deleteReview,
} = require("../controllers/reviews");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router
    .route("/")
    .post(protect, authorize("admin", "user"), addReview)
    .put(protect, authorize("admin", "user"), updateReview)
    .delete(protect, authorize("admin", "user"), deleteReview);

module.exports = router;
