import Conversation from '../models/Conversation.js';
import Friend from '../models/Friend.js';

const pair = (a, b) => (a < b ? [a,b] : [b,a]);
export const checkFriendship = async (req, res, next) => {
    try {
        const me = req.user._id.toString();
        const recipientId = req.body?.recipientId ?? null;
        const memberIds = req.body?.memberIds ?? [];

        if(!recipientId && memberIds.length === 0) {
            return res.status(400).json({ message: "Thieu recipientId hoac memberIds" });
        }

        if(recipientId) {
            const [userA, userB] = pair(me, recipientId);
            
            const isfriend = await Friend.findOne({ userA, userB });
            if (!isfriend) {
                return res.status(400).json({ message: "Chua la ban be" });
            }
            return next();
        }
        //todo: chat nhom
        const friendChecks = memberIds.map(async (memberId) => {
            const [userA, userB] = pair(me, memberId);
            const friend = await Friend.findOne({ userA, userB });
            return friend ? null : memberId;
        });

        const results = await Promise.all(friendChecks);
        const notFriends = results.filter(Boolean);

        if (notFriends.length > 0) {
            return res.status(403).json({message: " Ban chi co the them ban be vao nhom", notFriends});
        }

        return next();
    } catch (error) {
        console.log("Loi xay ra khi check friendship",error);
        return res.status(500).json({ message: "Loi server" });
    }
};

export const checkGroupMembership = async (req, res, next) => {
    try {
        const {conversationId} = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Khong tim thay cuoc chat" });
        }

        const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
        if (!isMember) {
            return res.status(403).json({ message: "Ban khong phai la thanh vien cua nhom" });
        }
        req.conversation = conversation;
        return next();
    } catch (error) {
        console.error("Loi xay ra khi check group membership", error);
        return res.status(500).json({ message: "Loi server" });
    }
};