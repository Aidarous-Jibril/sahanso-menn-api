const Conversation = require("../models/conversationModel");
const expressAsyncHandler = require("express-async-handler");


// Create a new conversation
const createNewConversation = expressAsyncHandler(async (req, res, next) => {
    try {
      const { groupTitle, userId, sellerId } = req.body;
  
      const isConversationExist = await Conversation.findOne({ groupTitle });
  
      let conversation;
      if (isConversationExist) {
        res.status(400).json({ msg: "conversation exists" });
        conversation = isConversationExist;
      } else {
        conversation = await Conversation.create({
          members: [userId, sellerId],
          groupTitle,
        });
      }
  
      res.status(201).json({
        success: true,
        conversation,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
// Get all conversations for a store/seller
const getAllStoreAllConversations = expressAsyncHandler(async (req, res, next) => {
    try {
      const conversations = await Conversation.find({
        members: { $in: [req.params.id] },
      }).sort({ updatedAt: -1, createdAt: -1 });
  
      res.status(200).json({
        success: true,
        conversations,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
// Get all conversations for a user
const getAllUserConversations = expressAsyncHandler(async (req, res, next) => {
    try {
      const conversations = await Conversation.find({
        members: { $in: [req.params.id] },
      }).sort({ updatedAt: -1, createdAt: -1 });
  
      res.status(200).json({
        success: true,
        conversations,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Update the last message in a conversation
const updateLastMessage = expressAsyncHandler(async (req, res, next) => {
  try {
    const { lastMessage, lastMessageId } = req.body;

    const conversation = await Conversation.findByIdAndUpdate(req.params.id, { lastMessage, lastMessageId });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
    createNewConversation,
    getAllStoreAllConversations,
    getAllUserConversations,
    updateLastMessage
};
