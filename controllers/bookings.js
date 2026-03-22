const Booking = require("../models/Booking");
const CarProvider = require("../models/CarProvider");

//@desc Get all bookings
//@route GET /api/v1/bookings
//@access Private
exports.getBookings = async (req, res, next) => {
    let query;

    //General users can see only their bookings
    if (req.user.role !== "admin") {
        query = Booking.find({ user: req.user.id }).populate({
            path: "carProvider",
            select: "name address tel",
        });
    } else {
        //Admin can see all bookings
        if (req.params.carProviderId) {
            query = Booking.find({
                carProvider: req.params.carProviderId,
            }).populate({
                path: "carProvider",
                select: "name address tel",
            });
        } else {
            query = Booking.find().populate({
                path: "carProvider",
                select: "name address tel",
            });
        }
    }

    try {
        const bookings = await query;
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: "Cannot find Bookings",
        });
    }
};

//@desc Get single booking
//@route GET /api/v1/bookings/:id
//@access Private
exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: "carProvider",
            select: "name address tel",
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.id}`,
            });
        }

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ success: false, message: "Cannot find Booking" });
    }
};

//@desc Add booking
//@route POST /api/v1/car-providers/:carProviderId/bookings
//@access Private
exports.addBooking = async (req, res, next) => {
    try {
        req.body.carProvider = req.params.carProviderId;

        const carProvider = await CarProvider.findById(
            req.params.carProviderId,
        );

        if (!carProvider) {
            return res.status(404).json({
                success: false,
                message: `No car provider with the id of ${req.params.carProviderId}`,
            });
        }

        req.body.user = req.user.id;

        //Check for existing bookings (limit 3 for non-admin users)
        const existedBookings = await Booking.find({
            user: req.user.id,
        });

        const activeBookings = existedBookings.filter(
            (b) => b.status === "active",
        );

        if (activeBookings.length >= 3 && req.user.role !== "admin") {
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 bookings`,
            });
        }

        //Remove reviewing fields if exist in the request body
        req.body.review = undefined;

        const booking = await Booking.create(req.body);

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ success: false, message: "Cannot create Booking" });
    }
};

//@desc Update booking
//@route PUT /api/v1/bookings/:id
//@access Private
exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.id}`,
            });
        }

        //Make sure user is the booking owner
        if (
            booking.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this booking`,
            });
        }

        //Remove reviewing fields if exist in the request body
        req.body.review = undefined;

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ success: false, message: "Cannot update Booking" });
    }
};

//@desc Delete booking
//@route DELETE /api/v1/bookings/:id
//@access Private
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.id}`,
            });
        }

        //Make sure user is the booking owner
        if (
            booking.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this booking`,
            });
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ success: false, message: "Cannot delete Booking" });
    }
};
