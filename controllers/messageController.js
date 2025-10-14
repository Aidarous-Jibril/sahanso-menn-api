const conversationModel = require("../models/conversationModel");
const Message = require("../models/messageModel");
const expressAsyncHandler = require("express-async-handler");
const cloudinary = require("cloudinary");

// Create a new message
const createNewMessage = expressAsyncHandler(async (req, res, next) => {
    try {
      // Extract message data from the request body
      const messageData = req.body;

      // Upload images to cloudinary if available
      if (req.body.images) {
        const myCloud = await cloudinary.uploader.upload(req.body.images, {
          folder: "messages",
        });
        // Update message data with image details
        messageData.images = {
          public_id: myCloud.public_id,
          url: myCloud.url,
        };
      }

      // Create a new message instance
      const message = new Message({
        conversationId: messageData.conversationId,
        text: messageData.text,
        sender: messageData.sender,
        images: messageData.images ? messageData.images : undefined,
      });

      // Save the message to the database
      await message.save();

      // Respond with success and the created message
      res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      // Handle any errors
      res.status(500).json(error);
    }
});

// Get all messages with a specific conversation id
const getAllMessagesWithConversation = expressAsyncHandler(async (req, res, next) => {
    try {
        // Find all messages with the provided conversation id
        const messages = await Message.find({
          conversationId: req.params.id,
        });
  
        // Respond with success and the messages
        res.status(201).json({
          success: true,
          messages,
        });
      } catch (error) {
        // Handle any errors
        res.status(500).json(error);
      }
});

module.exports = {
    createNewMessage,
    getAllMessagesWithConversation,
}
