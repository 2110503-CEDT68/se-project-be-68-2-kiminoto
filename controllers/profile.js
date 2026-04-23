//@desc Edit a custom profile field (or create that field if doesn't exist).
//@route PATCH /api/v1/profile/fields
//@access Private
exports.editProfileField = async (req, res, next) => {
    try {
        const { key, value } = req.body;

        const existingKeys = req.user.profile.fields.map((data) => data.key);

        if (existingKeys.includes(key)) {
            // field does exist, so update it.
            const index = existingKeys.indexOf(key);
            req.user.profile.fields[index].key = key;
            req.user.profile.fields[index].value = value;
        } else {
            // field doesn't exist, so create it.
            req.user.profile.fields.push({ key: key, value: value });
        }

        await req.user.save();

        // TODO: Figure out what to return instead.
        res.status(200).json({ success: true, data: req.user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.deleteProfileField = async (req, res, next) => {
    try {
        const { key } = req.body;

        const existingKeys = req.user.profile.fields.map((data) => data.key);

        if (existingKeys.includes(key)) {
            // field does exist, so update it.
            const index = existingKeys.indexOf(key);
            req.user.profile.fields.splice(index, 1);
        } else {
            // field doesn't exist, so create it.
            res.status(404).json({ success: false, error: "Field not found." });
            return;
        }

        await req.user.save();

        // TODO: Figure out what to return instead.
        res.status(200).json({ success: true, data: req.user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
