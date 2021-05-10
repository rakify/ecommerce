const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

//preparing multer for image upload
const imageStorage = multer.diskStorage({
    // Destination to store temporary image     
    destination: 'public/images/product_images/tmp',
    filename: (_req, file, cb) => {
        cb(null, Date.now() +
            path.extname(file.originalname))
        // file.fieldname is name of the field (image)
        // path.extname get the uploaded file extension
    }
});
const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 10000000 // 1000000 Bytes = 1 MB
    },
    fileFilter(_req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            // upload only png and jpg format
            return cb(new Error('Please upload a Image'))
        }
        cb(undefined, true)
    }
})

//get productValidation
const {
    productValidation
} = require('./validation');

//get Product model
const Product = require('../models/Product');
//get Category model
const Category = require('../models/Category');

/*
 * GET products index
 */
router.get('/', async (_req, res) => {
    await Product.find((_err, products) => { //if no product available rendered file will handle the err
        res.render('admin/products', {
            products: products,
            count: products.length
        }); //res.render ends
    }); //Product.find ends
}); //router.get ends

/*
 * GET add product
 */
router.get('/add-product', async (_req, res) => {
    let title, description, price;
    await Category.find((_err, categories) => { //this _err is not important
        res.render('admin/add_product', {
            count: categories.length,
            title: title,
            description: description,
            categories: categories,
            price: price
        }); //render ends
    }); //Category.find ends
}); //router.get ends

/*
 * POST add product
 */
router.post('/add-product', imageUpload.single('product_images'), (req, res) => {
    let image = (typeof req.file !== "undefined") ? req.file.filename : '';
    let title = req.body.title;
    let slug = title.replace(/\s+/g, '-').toLowerCase();
    let description = req.body.description;
    let category = req.body.category;
    let price = req.body.price
    let newProduct = {
        title: title,
        slug: slug,
        description: description,
        category: category,
        price: price,
        image: image
    }
    const {
        error
    } = productValidation(newProduct);
    if (error) {
        return Category.find((_err, categories) => { //return await is unnecessary & err not gonna happen here for sure
            res.render('admin/add_product', {
                error: error.details[0].message,
                title: title,
                description: description,
                categories: categories,
                price: price
            }); //res.render ends
        }); //Category.find ends
    } //if ends

    Product.create(newProduct, (err, product) => {
        if (product) {
            //make new directory by product id
            fs.mkdir(`public/images/product_images/${product._id}`, (err) => {
                if (!err)
                    console.log('Folder created for new product');
            });
            //move the image to the directory
            fs.rename(`public/images/product_images/tmp/${image}`, `public/images/product_images/${product._id}/${image}`, (err) => {
                if (!err)
                    console.log('New product image moved');
            });
            
            req.flash('success', 'Product added');
            res.redirect('/admin/products');
        };
        if (err) {
            return Category.find((_err, categories) => { //err not gonna happen here for sure
                res.render('admin/add_product', {
                    error: 'Similar product exist, Try another title.',
                    title: title,
                    description: description,
                    categories: categories,
                    price: price
                }); //res.render ends
            }); //Category.find ends
        }; //if ends
    }); //Product.create ends
}); //router.post ends
/*
 * GET edit product
 */
router.get('/edit-product/:id', async (req, res) => {
    await Product.findById(req.params.id, (err, product) => {
        if (err) return res.sendStatus(404);
        res.render('admin/edit_product', {
            product: product
        }); //res.render ends
    }); //Product.findById ends
}); //router.get ends
/*
 * POST edit product
 */
router.post('/edit-product/:id', imageUpload.single('product_images'), async (req, res) => {
    let preImage = req.body.image; //storing previous image in case it gets destroyed by req.file.filename
    let image = (typeof req.file === "undefined") ? req.body.image : req.file.filename;
    let title = req.body.title;
    let slug = title.replace(/\s+/g, '-').toLowerCase(); //all spaces replace with -
    let description = req.body.description;
    let category = req.body.category; //hidden input
    let price = req.body.price;
    let id = req.params.id;
    let newProduct = {
        title: title,
        slug: slug,
        description: description,
        category: category,
        price: price,
        image: image,
        _id: id
    }
    const {
        error
    } = productValidation(newProduct);
    if (error) {
        newProduct.image = preImage;
        return res.render('admin/edit_product', {
            error: error.details[0].message,
            product: newProduct
        });
    }

    await Product.findByIdAndUpdate(id, newProduct, (err, product) => {
        if (err) {
            return res.render('admin/edit_product', {
                error: 'Similar product exist, Try another title.',
                product: newProduct
            });
        }
        if (req.file) {
            //delete previous stored file
            fs.unlink(`public/images/product_images/${product._id}/${preImage}`, (err) => {
                if (!err) console.log('Deleted previous stored image');
            })
            //image moving process starts
            fs.rename(`public/images/product_images/tmp/${image}`, `public/images/product_images/${product._id}/${image}`, (err) => {
                if (!err) console.log('Moved new image'); //folder is already available so just move the file
            });
        }
        req.flash('success', 'Product updated.');
        res.redirect(`/admin/products/edit-product/${id}`);
    });
});

/*
 * GET delete product
 */
router.get('/delete-product/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        req.flash('success', 'product deleted.');
        res.redirect('/admin/products/');
    } catch (err) {
        req.flash('danger', 'Deletion failed.');
        res.redirect('/admin/products/');
    }
});



//exports
module.exports = router;