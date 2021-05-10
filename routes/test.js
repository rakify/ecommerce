const express = require('express');
const router = express.Router();
const multer = require('multer');
//preparing multer for image upload
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'images/')
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now())
//     }
// })
const upload = multer({
    dest: "./uploads"
});

router.post('/', upload.single ,(req, res) => {

})