import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import {emitNewMessage, updateConversationAfterCreateMessage} from '../utils/messageHelper.js';
import { io } from "../socket/index.js";
import { uploadImageFrombuffer } from '../middlewares/uploadMiddleware.js';

export const sendDirectMessage = async (req, res) => {
    try {
        const {recipientId, content, conversationId, imgUrl} = req.body;
        const senderId = req.user._id;

        let conversation;

        if(!content && !imgUrl) {
            return res.status(400).json({ message: "Thieu noi dung" });
        }

        if(conversationId) {
            conversation = await Conversation.findById(conversationId);
        }
        if(!conversation) {
            conversation = await Conversation.create({
                type: "direct",
                participants: [
                    {userId: senderId, joinedAt: new Date()},
                    {userId: recipientId, joinedAt: new Date()}
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map()
            });
        }
        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content,
            imgUrl,
        })
        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();
        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message: "Gui tin nhan thanh cong", data: message });
    } catch (error) {
        console.error("Loi xay ra khi gui tin nhan: ", error);
        return res.status(500).json({ message: "Loi he thong" });
    }
}
export const sendGroupMessage = async (req, res) => {
    try {
        const {conversationId, content, imgUrl}  = req.body;
        const senderId = req.user._id;

        const conversation = req.conversation;

        if(!content && !imgUrl) {
            return res.status(400).json({ message: "Thieu noi dung" });
        }

        const message = await Message.create({
            conversationId,
            senderId,
            content,
            imgUrl,
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();

        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message: "Gui tin nhan thanh cong", data: message });
    } catch (error) {
        console.error("Loi xay ra khi gui tin nhan nhom ", error);
        return res.status(500).json({ message: "Loi he thong" });
    }


};

export const uploadMessageImage = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "Thieu file anh" });
        }

        const result = await uploadImageFrombuffer(file.buffer, {
            folder: "moji_chat/messages",
            transformation: [{ width: 1024, crop: "limit" }],
        });

        return res.status(200).json({ imgUrl: result.secure_url });
    } catch (error) {
        console.error("Loi khi upload anh tin nhan", error);
        return res.status(500).json({ message: "Loi he thong" });
    }
};