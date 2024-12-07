const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const schema = new mongoose.Schema({
    name: String,
    email: String,
    password: {}
})
schema.pre('save', async function (next) {
    this.password = await bcrypt.hash(this.password, 12)
    next()

})
const User = new mongoose.model('User', schema)
module.exports = User;