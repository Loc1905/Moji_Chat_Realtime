import { uploadImageFrombuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";

export const authMe = async (req, res) => {
    try {
        const user =req.user;
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Loi khi goi authMe", error);
        return res.status(500).json({ message: "Loi he thong" });
    }
};

export const searchUserByUsername = async (req, res) => {
    try {
        const { username } = req.query;

        if(!username || username.trim() === "") {
            return res.status(400).json({ message: "Username is required" });
        }

        const user = await User.findOne({
            username: username.trim(),
            _id: { $ne: req.user._id },
        }).select("_id displayName username avatarUrl");

        return res.status(200).json({ user });
    } catch (error) {
        console.error("Loi khi searchUserByUsername", error);
        return res.status(500).json({ message: "Loi he thong" });
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const result = await uploadImageFrombuffer(file.buffer);
        const updateUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: result.secure_url,
                avatarId: result.public_id,
            },
            {
                new: true,
            }
        ).select("avatarUrl");

        if(!updateUser.avatarUrl) {
            return res.status(400).json({message: "Avatar tra ve null"});
        }

        return res.status(200).json({ avatarUrl: updateUser.avatarUrl });
    } catch (error) {
        console.error("Loi khi uploadAvatar", error);
        return res.status(500).json({ message: "Loi he thong" });
    }
}

