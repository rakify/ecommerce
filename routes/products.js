const express = require('express');
const router = express.Router();
const pagination = require('../config/pagination.js')

// Get Product Model
let Product = require('../models/Product');
// Get Category Model
let Category = require('../models/Category');

/*
 * GET all products
 */
router.get('/', async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const count = await Product.countDocuments().exec()
    const max = Math.ceil(count / limit);

    Product.find((err, products) => {
        if (err) {
            console.log(err);
        }
        if (products) {
            // products.all = p;
            res.render('all_products', {
                title: 'All Products',
                products: products,
                max: max,
                first: page
            });
        }
    }).sort({
        createdAt: -1
    }).limit(limit * 1).skip((page - 1) * limit);

});


/*
 * GET all products by shop name
 */
router.get('/shop/:seller', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    let p = await Product.find({
        seller: req.params.seller
    });
    let count = p.length
    const max = Math.ceil(count / limit);

    Product.find({
        seller: req.params.seller
    }, (err, products) => {
        if (err) return res.sendStatus(404);
        if (products) {
            res.render('products_by_shop', {
                title: `Products By ${req.params.seller}`,
                products: products,
                shopname: req.params.seller,
                max: max,
                first: page
            });
        }
    }).sort({
        createdAt: -1
    }).limit(limit * 1).skip((page - 1) * limit);
});

/*
 * GET products by category
 */
router.get('/:category', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    
    let p = await Product.find({
                category: req.params.category
            });
    let count = p.length;
    const max = Math.ceil(count / limit);

    Category.findOne({
        slug: req.params.category
    }, (err, category) => {
        if (err) return res.sendStatus(404);
        if (category) {
            Product.find({
                category: req.params.category
            }, (err, products) => {
                if (err) return res.sendStatus(404);
                if (products) {
                    res.render('products_by_category', {
                        title: `Products in ${req.params.category.toUpperCase()} Category`,
                        products: products,
                        category: req.params.category,
                        max: max,
                        first: page
                    });
                }
            }).sort({
                createdAt: -1
            }).limit(limit * 1).skip((page - 1) * limit);
        }
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