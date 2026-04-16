const express = require("express");
const {
    addDownvote,
    removeDownvote,
    getDownvoteCount,
} = require("../controllers/votes");
const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router.post("/downvote", protect, addDownvote);
router.delete("/downvote", protect, removeDownvote);
router.get("/downvote", getDownvoteCount);

module.exports = router;
