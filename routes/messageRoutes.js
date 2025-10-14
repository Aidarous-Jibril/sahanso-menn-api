const express = require('express')
const router = express.Router()
const { createNewMessage, getAllMessagesWithConversation } = require('../controllers/messageController')

router.post('/create-new-message', createNewMessage )
router.get('/get-all-messages/:id', getAllMessagesWithConversation)

module.exports = router
