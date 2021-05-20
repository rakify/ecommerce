const express = require('express');
const router = express.Router();

// Get Page Model
let Page = require('../models/Page');

/*
 * GET /
 */
router.get('/', (req, res) => {
    Page.findOne({
        slug: 'home'
    }, (err, page) => {
        if (err) {
            console.log(err);
        }
        if (page) {
            res.render('index', {
                title: page.title,
                content: page.content
            });
        }
    });

});

/*
 * GET a page
 */
router.get('/:slug', (req, res) => {
    Page.findOne({
        slug: req.params.slug
    }, (err, page) => {
        if (err) {
            console.log(err);
            res.redirect('/');
        }
        if (page) {
            res.render('index', {
                title: page.title,
                content: page.content
            });
        }
    });
});

//exports
module.exports = router;