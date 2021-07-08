const express = require('express');
const router = express.Router();

// Get Product Model
let Product = require('../models/Product');

/*
 * GET add product to cart
 */
router.get('/add/:product', (req, res) => {
    let slug = req.params.product;
    Product.findOne({
        slug: slug
    }, (err, product) => {
        if (err) {
            console.log(err);
        }
        if (product) {
            if (typeof req.session.cart == 'undefined') {
                req.session.cart = [];
                req.session.cart.push({
                    title: product.title,
                    slug: slug,
                    quantity: 1,
                    price: product.price,
                    image: `/images/product_images/${product._id}/${product.images[0]}`
                });
            } else {
                let cart = req.session.cart;
                let newItem = true;

                for (let i = 0; i < cart.length; i++) {
                    if (cart[i].slug == slug) {
                        cart[i].quantity++;
                        newItem = false;
                        break;
                    }
                }
                if (newItem) {
                    cart.push({
                        title: product.title,
                        slug: slug,
                        quantity: 1,
                        price: product.price,
                        image: `/images/product_images/${product._id}/${product.images[0]}`
                    });
                }
            }
        }
        req.flash('success', 'Product added!');
        res.redirect('back');
    });
});

/*
 * GET checkout page
 */
router.get('/checkout', (req, res) => {
    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        res.render('checkout', {
            title: 'Checkout',
            cart: req.session.cart
        })
    }

})

/*
 * GET update product
 */
router.get('/update/:product', (req, res) => {
    let slug = req.params.product;
    let cart = req.session.cart;
    let action = req.query.action;

    for (let i = 0; i < cart.length; i++) {
        if (cart[i].slug == slug) {
            switch (action) {
                case 'add':
                    cart[i].quantity++;
                    break;
                case 'remove':
                    cart[i].quantity--;
                    if (cart[i].quantity < 1) cart.splice(i, 1);
                    break;
                case 'clear':
                    cart.splice(i, 1);
                    if (cart.length == 0) delete req.session.cart;
                    break;
                default:
                    consolee.log('update');
                    break;
            }
            break;
        }
    }
    req.flash('success', 'Cart updated!');
    res.redirect('/cart/checkout');

});

/*
 * GET clear cart
 */
router.get('/clear', (req, res) => {
    delete req.session.cart;
    req.flash('success', 'Cart cleared!');
    res.redirect('/cart/checkout');
})

/*
 * GET buy now
 */
router.get('/buynow', (req, res) => {
    delete req.session.cart;
    res.sendStatus(200);
})

//exports
module.exports = router;