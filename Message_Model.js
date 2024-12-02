const mongoose = require('mongoose')

const message_schema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    message: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

const Message = new mongoose.model("message", message_schema)

module.exports = Message;