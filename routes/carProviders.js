const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

const {
    getCarProviders,
    getCarProvider,
    createCarProvider,
    updateCarProvider,
    deleteCarProvider,
} = require("../controllers/carProviders");

const bookingRouter = require("./bookings");

router.use("/:carProviderId/bookings/", bookingRouter);

router
    .route("/")
    .get(getCarProviders)
    .post(protect, authorize("admin"), createCarProvider);
router
    .route("/:id")
    .get(getCarProvider)
    .put(protect, authorize("admin"), updateCarProvider)
    .delete(protect, authorize("admin"), deleteCarProvider);

module.exports = router;
