//@desc Edit a custom profile field (or create that field if doesn't exist).
//@route PATCH /api/v1/profile
//@access Private
exports.editProfileField = async (req, res, next) => {
    try {
        const { key, value } = req.body;

        const existingKeys = req.user.profile.fields.map((data) => data.key);

        if (existingKeys.includes(key)) {
            // field does exist, so update it.
            const index = existingKeys.indexOf(key);
            req.user.profile.fields[index] = value;
        } else {
            // field doesn't exist, so create it.
            req.user.profile.fields.push({ key: key, value: value });
        }

        await req.user.save();
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
