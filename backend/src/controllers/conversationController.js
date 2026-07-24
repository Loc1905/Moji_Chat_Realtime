import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { io } from '../socket/index.js';

export const createConversation = async (req, res) => {
    try {
        const {type, name, memberIds} = req.body;
        const userId = req.user._id;

        if(!type || 
            (type === 'group' && !name) || 
            !memberIds || 
            !Array.isArray(memberIds) || 
            memberIds.length === 0) {
            return res.status(400).json({ message: "Ten nhom va danh sach thnah vien la bat buoc" });
        }

        let conversation;
        if(type === 'direct') {
            const participanId = memberIds[0];
            conversation = await Conversation.findOne({
                type: 'direct',
                "participants.userId": {$all: [userId, participanId]}
            });

            if (!conversation) {
                conversation = new Conversation({
                    type: 'direct',
                    participants: [{userId}, {userId: participanId}],
                    lastMessageAt: new Date(),
                });

                await conversation.save();
            }
        }

        if (type === 'group') {
            conversation = new Conversation({
                type: 'group',
                participants: [
                    {userId},
                    ...memberIds.map((id) => ({userId: id}))
                ],
                group:  {
                    name,
                    createdBy: userId,
                },
                lastMessageAt: new Date(),
            });
            await conversation.save();
        }

        if (!conversation) {
            return res.status(400).json({ message: "Conversation type khong hop le" });
        }

        await conversation.populate([
            {path: 'participants.userId', select: 'displayName avatarUrl'},
            {
                path: 'seenBy',
                select: 'displayName avatarUrl'
            },
            {path: "lastMessage.senderId", select: "displayName avatarUrl"},
        ]);

        const participants = (conversation.participants || []).map((p) => ({
            _id: p.userId._id,
            displayName: p.userId.displayName,
            avatarUrl: p.userId.avatarUrl ?? null,
            joinedAt: p.joinedAt
        }));

        const formatted = {...conversation.toObject(), participants};

        if(type === 'group') {
            memberIds.forEach((memberId) => {
                io.to(memberId.toString()).emit('new-group', formatted);
            })
        }

        return res.status(201).json({ conversation: formatted });
    } catch (error) {
        console.error("Loi khi tao conversation", error);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }

}

export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({
            "participants.userId": userId
        }).sort({lastMessageAt: -1, updatedAt: -1})
        .populate({
            path: 'participants.userId',
            select: 'displayName avatarUrl'
        })
        .populate({
            path: 'lastMessage.senderId',
            select: 'displayName avatarUrl'
        })
        .populate({
            path: 'seenBy',
            select: 'displayName avatarUrl'
        });

        const formatted = conversations.map((convo) => {
            const participants = (convo.participants || []).map((p) => ({
                _id: p.userId._id,
                displayName: p.userId.displayName,
                avatarUrl: p.userId.avatarUrl ?? null,
                joinedAt: p.joinedAt
            }));

            return {
                ...convo.toObject(),
                unreadCount: convo.unreadCounts || {},
                participants,
            }
        });

        return res.status(200).json({ conversations: formatted });
    } catch (error) {
        console.error("Loi khi lay danh sach conversation", error);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
}

export const getMessages = async (req, res) => {
    try {
        const {conversationId} = req.params;
        const {limit = 50, cursor} = req.query;

        const query = {conversationId};
        if(cursor) {
            query.createdAt = {$lt: new Date(cursor)};
        }

        let messages = await Message.find(query).sort({createdAt: -1})
        .limit(Number(limit) + 1);


        let nextCursor = null;
        if(messages.length > Number(limit)) {
            const nextMessage = messages[messages.length - 1];
            nextCursor = nextMessage.createdAt.toISOString();
            messages.pop();
        }

        messages = messages.reverse();
        return res.status(200).json({ messages, nextCursor });
    } catch (error) {
        console.error("Loi khi lay danh sach tin nhan", error);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
}

export const getUserConversationForSocketio = async (userId) => {
    try {
        const conversations = await Conversation.find(
            {"participants.userId": userId},
            {_id: 1}
        );
        return conversations.map((c) => c._id.toString());
    } catch (error) {
        console.error("Loi khi lay danh sach conversation cho socket.io", error);
        return [];
    }
}

export const markAsseen = async (req, res) => {
    try {
        const {conversationId} = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();

        if(!conversation) {
            return res.status(404).json({ message: "Conversation khong ton tai" });
        }

        const last = conversation.lastMessage;
        if(!last) {
            return res.status(200).json({ message: "khong co tin nhan nao de danh dau" });
        }

        if(last.senderId.toString() === userId) {
            return res.status(200).json({ message: "sender khong can markasseen" });
        }

        const update = await Conversation.findByIdAndUpdate(
            conversationId, 
            {
                $addToSet: {seenBy: userId},
                $set: {[`unreadCounts.${userId}`]: 0},
            }, {
                new: true,
            }
        );


        const readPayload = {
            conversation: update,
            lastMessage: {
                _id: update?.lastMessage._id,
                content: update?.lastMessage.content,
                createdAt: update?.lastMessage.createdAt,
                sender: {
                    _id: update?.lastMessage.senderId,
                },
            }
        };

        (update?.participants || []).forEach((p) => {
            io.to(p.userId.toString()).emit("read-message", readPayload);
        });

        return res.status(200).json({ message: "MarkAsSeen", seenBy: update?.seenBy || [], myUnreadCount: update?.unreadCounts?.get(userId) ?? 0 });

    } catch (error) {
        console.error("Loi khi danh dau tin nhan da doc", error);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
}