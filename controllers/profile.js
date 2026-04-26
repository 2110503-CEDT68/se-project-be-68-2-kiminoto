const User = require("../models/User");

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_CONTENT_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
]);

const parseAvatarPayload = (image, contentType) => {
    if (!image || typeof image !== "string") {
        throw new Error("Please provide a base64 image string.");
    }

    let parsedContentType = contentType;
    let base64Payload = image;

    if (image.startsWith("data:")) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
            throw new Error("Invalid data URL format.");
        }
        parsedContentType = match[1];
        base64Payload = match[2];
    }

    if (!parsedContentType || typeof parsedContentType !== "string") {
        throw new Error("Please provide a valid image contentType.");
    }

    if (!ALLOWED_IMAGE_CONTENT_TYPES.has(parsedContentType.toLowerCase())) {
        throw new Error("Unsupported image type.");
    }

    const sanitizedBase64 = base64Payload.replace(/\s/g, "");
    const decodedBuffer = Buffer.from(sanitizedBase64, "base64");

    if (!decodedBuffer.length) {
        throw new Error("Image payload is empty.");
    }

    if (decodedBuffer.length > MAX_AVATAR_SIZE_BYTES) {
        throw new Error("Image exceeds 2MB limit.");
    }

    return {
        imageBuffer: decodedBuffer,
        contentType: parsedContentType.toLowerCase(),
    };
};

const sendAvatarResponse = (res, avatar, cacheControl) => {
    res.set(
        "Content-Type",
        avatar.contentType || "application/octet-stream",
    );
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.set("Cache-Control", cacheControl);
    res.status(200).send(avatar.data);
};

//@desc Get another user's public profile
//@route GET /api/v1/profile/:id
//@access Public
exports.getPublicProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select(
            "name email tel createdAt profile.fields",
        );

        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

//@desc Upload or replace user avatar image
//@route PUT /api/v1/profile/avatar
//@access Private
exports.uploadAvatar = async (req, res, next) => {
    try {
        const { image, contentType } = req.body;
        const { imageBuffer, contentType: parsedType } = parseAvatarPayload(
            image,
            contentType,
        );

        const user = await User.findById(req.user.id).select("profile.avatar");
        user.profile = user.profile || {};
        user.profile.avatar = {
            data: imageBuffer,
            contentType: parsedType,
        };

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                contentType: parsedType,
                size: imageBuffer.length,
            },
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

//@desc Get current user avatar image
//@route GET /api/v1/profile/avatar
//@access Private
exports.getAvatar = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("profile.avatar");
        const avatar = user && user.profile && user.profile.avatar;

        if (!avatar || !avatar.data) {
            res.status(404).json({
                success: false,
                error: "Avatar not found.",
            });
            return;
        }

        sendAvatarResponse(res, avatar, "private, no-store");
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

//@desc Get another user's avatar image
//@route GET /api/v1/profile/avatar/:id
//@access Public
exports.getUserAvatar = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select(
            "profile.avatar",
        );

        const avatar = user && user.profile && user.profile.avatar;

        if (!user || !avatar || !avatar.data) {
            res.status(404).json({
                success: false,
                error: "Avatar not found.",
            });
            return;
        }

        sendAvatarResponse(res, avatar, "public, max-age=300");
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

//@desc Delete current user avatar image
//@route DELETE /api/v1/profile/avatar
//@access Private
exports.deleteAvatar = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("profile.avatar");
        const hasAvatar =
            user &&
            user.profile &&
            user.profile.avatar &&
            user.profile.avatar.data;

        if (!hasAvatar) {
            res.status(404).json({
                success: false,
                error: "Avatar not found.",
            });
            return;
        }

        user.profile.avatar = {};
        await user.save();

        res.status(200).json({
            success: true,
            data: { message: "Avatar deleted successfully." },
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

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

//@desc Edit a custom profile field (or create that field if doesn't exist).
//@route DELETE /api/v1/profile/fields
//@access Private
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
