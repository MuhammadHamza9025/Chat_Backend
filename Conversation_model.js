const mongoose = require('mongoose')
const User = require('./Model')
const Message = require('./Message_Model')

const message_schema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: User
    }],
    message: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Message
    }]
})

const Conversation = new mongoose.model("conversation", message_schema)

module.exports = Conversation;