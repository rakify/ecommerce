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
    const count = await Product.countDocuments().exec();
    const max = Math.ceil(count / limit);//maximum pages available

    // In case someone asks for a page(>0) that doesnt exist redirect him to the last page
    if (page > max) {
        res.redirect(`/products/?page=${max}`)
    }

    let startLink, endLink;
    // Before the actual page, let it have at most 3 links
    if(page-3>=1) startLink = page-3;
    else if(page-2>=1) startLink = page-2;
    else if(page-1>=1) startLink = page-1;
    else startLink = page;
    // After the actual page, let it have at most 3 links
    if(page+3<=max) endLink = page+3;
    else if(page+2<=max) endLink = page+2;
    else if(page+1<=max) endLink = page+1;
    else endLink = page;

    Product.find((_err, products) => {
        if (products) {
            res.render('all_products', {
                title: 'All Products',
                products: products,
                max: max,
                page: page,
                startLink: startLink,
                endLink: endLink
            });
        }
    }).sort({
        createdAt: -1
    }).limit(limit * 1).skip((page - 1) * limit);
    /* here it finds all the products and while doing so sort them by createdAt in descending order.
    then limit the results upto 6(limit) items as well as skipping the products before current page.
    So we have total 6(limit) items that is available for current page.
*/
});


/*
 * GET all products by shop name
 */
router.get('/shop/:seller', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    let count = await Product.find({
        seller: req.params.seller
    }).count();
    const max = Math.ceil(count / limit);
 
    if (page > max) {
        res.redirect(`/products/?page=${max}`)
    }

    let startLink, endLink;

    if(page-3>=1) startLink = page-3;
    else if(page-2>=1) startLink = page-2;
    else if(page-1>=1) startLink = page-1;
    else startLink = page;

    if(page+3<=max) endLink = page+3;
    else if(page+2<=max) endLink = page+2;
    else if(page+1<=max) endLink = page+1;
    else endLink = page;

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
                page: page,
                startLink: startLink,
                endLink: endLink
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
    let count = await Product.find({
        category: req.params.category
    }).count();
    const max = Math.ceil(count / limit);

     if (page > max) {
        res.redirect(`/products/?page=${max}`)
    }

    let startLink, endLink;

    if(page-3>=1) startLink = page-3;
    else if(page-2>=1) startLink = page-2;
    else if(page-1>=1) startLink = page-1;
    else startLink = page;

    if(page+3<=max) endLink = page+3;
    else if(page+2<=max) endLink = page+2;
    else if(page+1<=max) endLink = page+1;
    else endLink = page;

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
                        page: page,
                        startLink: startLink,
                        endLink: endLink
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