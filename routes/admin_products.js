const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');

//get productValidation
const {
    productValidation
} = require('./validation');

//get Product model
const Product = require('../models/Product');
//get Category model
const Category = require('../models/Category');

//preparing multer for image upload
const imageStorage = multer.diskStorage({
    // Destination to store temporary image     
    destination: 'public/images/product_images/tmp',
    filename: (_req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
        // path.extname get the uploaded file extension
    }
});

const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 5 * 1000 * 1000 // 1000*1000 Bytes = 1 MB
    },
    fileFilter(_req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            // upload only png, jpeg and jpg format
            return cb(new Error('Only .jpg .jpeg .png format allowed'))
        }
        cb(undefined, true)
    }
})


/*
 * GET products index
 */
router.get('/', (_req, res) => {
    Product.find((_err, products) => { //if no product available rendered file will handle the err
        res.render('admin/products', {
            products: products,
            count: products.length,
        }); //res.render ends
    }); //Product.find ends
}); //router.get ends

/*
 * GET add product
 */
router.get('/add-product', async (_req, res) => {
    let title, description, price;
    let newProduct = {
        title: title,
        description: description,
        price: price,
    }
    await Category.find((err, categories) => { //return await is unnecessary & err not gonna happen here for sure
        if (err) {
            return res.render('admin/add_product', {
                error: error.details[0].message,
                product: newProduct,
                categories: []
            });
        }
        res.render('admin/add_product', {
            product: newProduct,
            categories: categories
        }); //res.render ends
    }); //Category.find ends
}); //router.get ends

/*
 * POST add product
 */
router.post('/add-product', imageUpload.array('images', 5), (req, res) => {
    let images = [];
    if (req.files !== undefined) {
        for (let i = 0; i < req.files.length; i++) {
            images.push(req.files[i].filename)
        };
    };
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
        images: images
    }
    const {
        error
    } = productValidation(newProduct);
    if (error) {
        return Category.find((_err, categories) => { //return await is unnecessary & err not gonna happen here for sure
            res.render('admin/add_product', {
                error: error.details[0].message,
                product: newProduct,
                categories: categories
            }); //res.render ends
        }); //Category.find ends
    } //if ends
    Product.create(newProduct, (err, product) => {
        if (product) {
            images.forEach((image) => {
                fs.move(`public/images/product_images/tmp/${image}`, `public/images/product_images/${product._id}/${image}`, (err) => {
                    if (err) console.log('error req.files on post add-product');
                });
            });
            req.flash('success', 'Product added');
            res.redirect('/admin/products');
        }; //if ends
        if (err) {
            return Category.find((_err, categories) => { //err not gonna happen here for sure
                res.render('admin/add_product', {
                    error: 'Similar product exist, Try another title.',
                    product: newProduct,
                    categories: categories
                }); //res.render ends
            }); //Category.find ends
        }; //if ends
    }); //Product.create ends
}); //router.post ends

/*
 * GET edit product
 */
router.get('/edit-product/:id', (req, res) => {
    Product.findById(req.params.id, (err, product) => {
        if (err) return res.sendStatus(404);
        res.render('admin/edit_product', {
            product: product
        }); //res.render ends
    }); //Product.findById ends
}); //router.get ends
/*
 * POST edit product
 */
router.post('/edit-product/:id', imageUpload.array('newImages', 5), async (req, res) => {
    let title = req.body.title;
    let slug = title.replace(/\s+/g, '-').toLowerCase(); //all spaces replace with -
    let description = req.body.description;
    let category = req.body.category; //hidden input
    let price = req.body.price;
    let id = req.params.id;
    let images = req.body.images.split(',');
    let oldImages = images;
    let overSizedImageArray = [1, 2, 3, 4, 5, 6];
    if (req.files !== undefined && images.length + req.files.length < 6) {
        req.files.forEach(image => {
            fs.move(`public/images/product_images/tmp/${image.filename}`, `public/images/product_images/${req.params.id}/${image.filename}`, (err) => {
                if (err) console.log('err at moving at post edit product');
            });
        })
        let filenames = req.files.map((file) => file.filename);
        images.push(...filenames);
    } else {
        images = overSizedImageArray; //pass this oversized array in newProduct
        fs.emptyDir('public/images/product_images/tmp', (err) => {
            if (err) console.log('couldnt empty tmp dir at edit product')
        })
    }
    let newProduct = {
        title: title,
        slug: slug,
        description: description,
        category: category,
        price: price,
        images: images,
        _id: id
    };
    const {
        error
    } = productValidation(newProduct);
    if (error) {
        newProduct.images = oldImages; //if error return oldImages
        return res.render('admin/edit_product', {
            error: error.details[0].message,
            product: newProduct
        });
    };

    await Product.findByIdAndUpdate(id, newProduct, (err, product) => {
        if (err) {
            return res.render('admin/edit_product', {
                error: 'Similar product exist, Try another title.',
                product: newProduct
            });
        };
        req.flash('success', 'Product updated.');
        res.redirect(`/admin/products/edit-product/${id}`);
    });
});

/*
 * GET delete product
 */
router.get('/delete-product/:id', async (req, res) => {
    await Product.findByIdAndDelete(req.params.id, (err, product) => {
        if (err) {
            req.flash('danger', 'Deletion failed.');
            res.redirect('/admin/products/');
        }
        if (product) {
            //also delete the folder containing pic
            fs.remove(`public/images/product_images/${product._id}`, (err) => {
                if (err) console.log(err)
            });
            req.flash('success', 'Product deleted.');
            res.redirect('/admin/products/');
        };
    });
});
/*
 * GET delete image
 */
router.get('/delete-image/:image', async (req, res) => {
    let id = req.query.id,
        image = req.params.image;
    fs.remove(`public/images/product_images/${id}/${image}`, err => {
        if (err) {
            console.log(`err while deleting pic`);
        }
        if (!err) {
            Product.findByIdAndUpdate(id, {
                $pull: {
                    images: image
                }
            }, (err, product) => {
                if (product) {
                    req.flash('success', 'Image deleted.');
                    res.redirect(`/admin/products/edit-product/${req.query.id}`)
                }
                if (err) console.log('couldnt update mongoose in get delete image')
            });//Product.findByIdAndUpdate ends
        };//if(!err) ends
    });//fs.remove ends
});//get router delete image ends





//exports
module.exports = router;