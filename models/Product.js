const mongoose = require('mongoose');

//product schema
const ProductSchema = mongoose.Schema({

    title: {
        type: String,
        unique: true,
        trim: true,
        required: true
    },
    slug: {
        type: String
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        require: true
    },
    image: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})


module.exports = mongoose.model('Product', ProductSchema);