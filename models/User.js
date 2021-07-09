const mongoose                                                             = require('mongoose');

//user schema
const UserSchema = mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    fname: {
        type: String
    },
    lname: {
        type: String,
    },
    pn: {
        type: String,
    },
    admin: {
        type: Number
    }
}, {timestamps: true}
)


module.exports = mongoose.model('User',UserSchema);