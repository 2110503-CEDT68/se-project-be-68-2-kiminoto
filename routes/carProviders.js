const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

const {
    getCarProviderReviews,
    getCarProviders,
    getCarProvider,
    createCarProvider,
    updateCarProvider,
    deleteCarProvider,
} = require("../controllers/carProviders");

const bookingRouter = require("./bookings");

router.use("/:carProviderId/bookings/", bookingRouter);

router
    .route("/:id/reviews")
    .get(getCarProviderReviews);

router
    .route("/:id")
    .get(getCarProvider)
    .put(protect, authorize("admin"), updateCarProvider)
    .delete(protect, authorize("admin"), deleteCarProvider);
    
router
    .route("/")
    .get(getCarProviders)
    .post(protect, authorize("admin"), createCarProvider);

module.exports = router;
