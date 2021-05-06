const mongoose                                                             = require('mongoose');

//category schema
const CategorySchema = mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true,
        required: true
    }
}, {timestamps: true}
)


module.exports = mongoose.model('Category',CategorySchema);