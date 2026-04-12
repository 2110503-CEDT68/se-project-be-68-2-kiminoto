const CarProvider = require("../models/CarProvider");
const Booking = require("../models/Booking");

//@desc Get all car providers
//@route GET /api/v1/car-providers
//@access Public
exports.getCarProviders = async (req, res, next) => {
    try {
        let query;

        //Copy req.query
        const reqQuery = { ...req.query };

        //Fields to exclude
        const removeFields = ["select", "sort", "page", "limit"];

        //Loop over remove fields and delete them from reqQuery
        removeFields.forEach((param) => delete reqQuery[param]);

        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(
            /\b(gt|gte|lt|lte|in)\b/g,
            (match) => `$${match}`,
        );

        //Find resource
        query = CarProvider.find(JSON.parse(queryStr)).populate("bookings");

        //Select fields
        if (req.query.select) {
            const fields = req.query.select.split(",").join(" ");
            query = query.select(fields);
        }

        //Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("-createdAt");
        }

        //Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await CarProvider.countDocuments();

        query = query.skip(startIndex).limit(limit);

        //Executing query
        const carProviders = await query;

        //Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit,
            };
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit,
            };
        }

        //Compute average rating from bookings for each provider
        const data = carProviders.map((provider) => {
            const providerObj = provider.toObject();
            const ratings = (providerObj.bookings || [])
                .map((b) => b.review?.rating)
                .filter((r) => r != null);

            providerObj.avgRating =
                ratings.reduce((sum, r) => sum + r, 0) / ratings.length ?? null;
            return providerObj;
        });

        res.status(200).json({
            success: true,
            count: data.length,
            pagination,
            data,
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

//@desc Get single car provider
//@route GET /api/v1/car-providers/:id
//@access Public
exports.getCarProvider = async (req, res, next) => {
    try {
        const carProvider = await CarProvider.findById(req.params.id).populate(
            "bookings",
        );

        if (!carProvider) {
            return res.status(404).json({
                success: false,
                message: `No car provider with the id of ${req.params.id}`,
            });
        }

        //Compute average rating from bookings
        const providerObj = carProvider.toObject();
        const ratings = (providerObj.bookings || [])
            .map((b) => b.review?.rating)
            .filter((r) => r != null);

        providerObj.avgRating =
            ratings.reduce((sum, r) => sum + r, 0) / ratings.length ?? null;

        res.status(200).json({
            success: true,
            data: providerObj,
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

//@desc Create new car provider
//@route POST /api/v1/car-providers
//@access Private
exports.createCarProvider = async (req, res, next) => {
    try {
        const carProvider = await CarProvider.create(req.body);
        res.status(201).json({ success: true, data: carProvider });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

//@desc Update car provider
//@route PUT /api/v1/car-providers/:id
//@access Private
exports.updateCarProvider = async (req, res, next) => {
    try {
        const carProvider = await CarProvider.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            },
        );

        if (!carProvider) {
            return res.status(404).json({
                success: false,
                message: `No car provider with the id of ${req.params.id}`,
            });
        }

        res.status(200).json({
            success: true,
            data: carProvider,
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

//@desc Delete car provider
//@route DELETE /api/v1/car-providers/:id
//@access Private (admin only)
exports.deleteCarProvider = async (req, res, next) => {
    try {
        const carProvider = await CarProvider.findById(req.params.id);

        if (!carProvider) {
            return res.status(404).json({
                success: false,
                message: `No car provider with the id of ${req.params.id}`,
            });
        }

        await Booking.deleteMany({ carProvider: req.params.id });
        await CarProvider.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

//@desc Get car provider's reviews
//@route GET /api/v1/car-providers/:id/reviews
//@access Public
exports.getCarProviderReviews = async (req,res,next) => {
    try {
        const carProvider = await CarProvider.findById(req.params.id).populate({
            path: "bookings",populate: {
              path: "user",
              model: "User",
              select: "name"
            },
            select: "status review"
        }).lean();

        if (!carProvider) {
            return res.status(404).json({
                success: false,
                message: `No car provider with the id of ${req.params.id}`,
            });
        }

        const fullReviews = carProvider.bookings.map((booking)=> ({
          ...booking,
          review: booking.review || {}
        }));

        res.status(200).json({ success:true, data:fullReviews});

    } catch (err){
        console.error(err);
        return res
            .status(500)
            .json({ success: false, message: "Cannot get reviews" });
    }
}
