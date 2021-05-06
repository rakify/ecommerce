const mongoose                                                             = require('mongoose');

//page schema
const PageSchema = mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sorting: {
        type: Number
    }
}, {timestamps: true}
)


module.exports = mongoose.model('Page',PageSchema);