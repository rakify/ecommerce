const express = require('express');
const router = express.Router();
const auth = require('../config/auth')
const isUser = auth.isUser;

// Get Product Model
let Product = require('../models/Product');
// Get Category Model
let Category = require('../models/Category');

/*
 * GET all products
 */
router.get('/', (req, res) => {

    Product.find((err, products) => {
        if (err) {
            console.log(err);
        }
        if (products) {
            res.render('all_products', {
                title: 'All Products',
                products: products
            });
        }
    });

});

/*
 * GET products by category
 */
router.get('/:category', (req, res) => {
    Category.findOne({
        slug: req.params.category
    }, (_err, category) => {
        if (category) {
            Product.find({
                category: req.params.category
            }, (err, products) => {
                if (err) {
                    console.log(err);
                }
                if (products) {
                    res.render('cat_products', {
                        title: category.title,
                        products: products
                    });
                }
            });
        };
    });
});

/*
 * GET product details
 */
router.get('/:category/:product', (req, res) => {
    let loggedIn = (req.isAuthenticated()) ? true : false;
    Product.findOne({
        slug: req.params.product
    }, (err, product) => {
        if (err) {
            console.log(err);
        }
        if (product) {
            res.render('product', {
                title: product.title,
                product: product,
                loggedIn: loggedIn
            });
        }
    });
});


//exports
module.exports = router;