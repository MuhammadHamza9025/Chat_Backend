const http = require('http')
const { Server } = require('socket.io')
const express = require('express')
const app = express()

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
})



let users = {};


const getreceiverid = (receiverId) => {
    return users[receiverId]
}
io.on("connection", (socket) => {
    console.log("a new client connected", socket.id)
    const userId = socket.handshake.query.userId;
    users[userId] = socket.id;
    console.log(users)
    socket.on("disconnect", (socket) => {
        console.log('User disconnected', socket.id)
    })
    io.emit('getonline', Object.keys(users))
})

module.exports = { app, server, io, getreceiverid };