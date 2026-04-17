const express = require("express");
const {
    addDownvote,
    removeDownvote,
    getDownvoteCount,
    addUpvote,
    removeUpvote,
    getUpvoteCount,
    getVoteSummary
} = require("../controllers/votes");
const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router.get("/", getVoteSummary);

router.post("/downvote", protect, addDownvote);
router.delete("/downvote", protect, removeDownvote);
router.get("/downvote", getDownvoteCount);

router.post("/upvote", protect, addUpvote);
router.delete("/upvote", protect, removeUpvote);
router.get("/upvote", getUpvoteCount);

module.exports = router;
