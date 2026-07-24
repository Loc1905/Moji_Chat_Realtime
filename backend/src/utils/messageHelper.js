export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message.id,
            content: message.content,
            senderId,
            createdAt: message.createdAt
        }
    });
    conversation.participants.forEach((p) => {
        const memberId = p.userId.toString();
        const isSender = memberId === senderId.toString();
        const prevCount = conversation.unreadCounts.get(memberId) || 0;
        conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
    })
}


export const emitNewMessage = (io, conversation, message) => {
    const payload = {
        message,
        conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
        },
        unreadCounts: conversation.unreadCounts,
    };

    conversation.participants.forEach((p) => {
        io.to(p.userId.toString()).emit("new-message", payload);
    })
}