require('dotenv').config();
const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const auth = require('../config/auth')
const isSellerAdmin = auth.isSellerAdmin;
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});



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
    //destination: 'public/images/product_images/tmp',
    filename: (_req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
        // path.extname gets the uploaded file extension
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
router.get('/', isSellerAdmin, (req, res) => {
    let user = req.user;
    Product.find((_err, products) => { //if no product available rendered file will handle the err
        res.render('admin/products', {
            products: products,
            count: products.length,
            user: user,
            title: "Products Control Panel"
        });
    });
});

/*
 * GET add product
 */
router.get('/add-product', isSellerAdmin, async (req, res) => {
    let title, description, price, user = req.user;
    let newProduct = {
        title: title,
        description: description,
        price: price,
    }

    await Category.find((err, categories) => {
        if (err) { // When no category added by admin yet
            return res.render('admin/add_product', {
                error: error.details[0].message,
                product: newProduct,
                categories: [],
                user: user,
                title: "Products Control Panel"
            });
        }
        res.render('admin/add_product', {
            product: newProduct,
            categories: categories,
            user: user,
            title: "Products Control Panel"
        });
    });
});

/*
 * POST add product
 */
router.post('/add-product', imageUpload.array('images', 5), async (req, res) => {
    let seller = req.body.seller,
        title = req.body.title,
        slug = title.replace(/\s+/g, '-').toLowerCase(),
        description = req.body.description,
        category = req.body.category,
        price = req.body.price,
        user = req.user;
    let newProduct = {
        seller: seller,
        title: title,
        slug: slug,
        description: description,
        category: category,
        price: price,
        images: req.files,
        image_ids: req.files //cloudinary public id per images, will get real value later
    }
    const {
        error
    } = productValidation(newProduct);
    if (error) {
        return Category.find((_err, categories) => {
            res.render('admin/add_product', {
                error: error.details[0].message,
                product: newProduct,
                categories: categories,
                user: user,
                title: "Products Control Panel"
            });
        });
    }

    // Uploading the files to cloudinary
    let images = [],
        image_ids = [];
    try {
        for (let i = 0; i < req.files.length; i++) {
            let result = await cloudinary.uploader.upload(req.files[i].path, {
                folder: `${user.username}/${category}/${slug}`
            })
            images.push(result.secure_url);
            image_ids.push(result.public_id)
        }
    } catch (err) {
        res.send(err);
    }

    newProduct.images = images;
    newProduct.image_ids = image_ids;
    Product.create(newProduct, (err, product) => {
        if (product) {
            req.flash('success', 'Product added');
            res.redirect('/admin/products');
        }
        if (err) {
            return Category.find((_err, categories) => { //err not gonna happen here for sure
                res.render('admin/add_product', {
                    error: 'Similar product exist, Try another title.',
                    product: newProduct,
                    categories: categories,
                    user: user,
                    title: "Products Control Panel"
                });
            });
        };
    });
});

/*
 * GET edit product
 */
router.get('/edit-product/:id', isSellerAdmin, async (req, res) => {
    /* 
    >> Since this path requires the product id and the id is visible to all users shopping here so any registered
    user can easily edit the product by making a link by themself.
    I am making sure whoever trying to access the link is
    1. Either the admin himself or
    2. The real owner of the product.
    To anyone else send status code 403 (Forbidden)

    >> What if user is trying to edit a product that is linked incorrectly or not available!
    Send status code 404 (Not found)
    */

    await Product.findById(req.params.id, (err, product) => {
        if (err) return res.sendStatus(404);
        if (req.user.username == product.seller || req.user._id == "60e7166e31b12f23187f4b68") {
            return res.render('admin/edit_product', {
                product: product,
                user: req.user,
                title: "Edit a Product"
            });
        } else return res.sendStatus(403);
    });
});
/*
 * POST edit product
 */
router.post('/edit-product/:id', imageUpload.array('newImages', 5), async (req, res) => {

    /*

    ?? What if user is trying to upload images more than 5.
    >> They cant do it at a time since the max upload is 5.

    ?? But they can do it when they edit a product.
    >> If they try to do so validation will handle this. In validation.js theres a schema called images which will
    handle the images array so it doesnt exceed 5. When it exceeds I will send overSizedImageArray thus
    it will show error. I dont want to lose my previous images array so I will store it in oldImages.

    ?? What happens to the extra images. 
    >> I dont want to store images when they exceed size thats why I store them in a tmp (temporary) folder. If
    they exceeds size I will empty the tmp directory and
    if they pass the validation process I will move them to the products own folder.

    ?? Where do i store images.
    >> I actually store images to the computer and store only the filenames to the database.

    ?? What if user is delete all pics
    >>

    */

    let seller = req.body.seller,
        title = req.body.title,
        slug = title.replace(/\s+/g, '-').toLowerCase(),
        description = req.body.description,
        category = req.body.category,
        price = req.body.price,
        id = req.params.id,
        images = req.body.images.split(','),
        oldImages = images;
    image_ids = req.body.image_ids.split(','),
        overSizedImageArray = [1, 2, 3, 4, 5, 6],
        user = req.user;
    if (req.files !== undefined && images.length + req.files.length < 6) {
        // Uploading the files to cloudinary
        for (let i = 0; i < req.files.length; i++) {
            let result = await cloudinary.uploader.upload(req.files[i].path, {
                folder: `${seller}/${category}/${slug}`
            });
            images.push(result.secure_url);
            image_ids.push(result.public_id)
        }
        //if theres some other error image uploading also should be affected
        //oldImages = images;
    } else {
        images = overSizedImageArray; //pass this oversized array in newProduct just to inform what happened
    }
    let newProduct = {
        seller: seller,
        title: title,
        slug: slug,
        description: description,
        category: category,
        price: price,
        images: images,
        image_ids: image_ids,
        _id: id
    };
    const {
        error
    } = productValidation(newProduct);
    if (error) {
        //Error should stop uploading images
        newProduct.images = oldImages; //
        return res.render('admin/edit_product', {
            error: error.details[0].message,
            product: newProduct,
            user: user,
            title: "Products Control Panel"
        });
    };

    await Product.findByIdAndUpdate(id, newProduct, (err, product) => {
        if (err) {
            return res.render('admin/edit_product', {
                error: 'Similar product exist, Try another title.',

                /*
        
                Only one of a kind error can happen here so
        
                */

                product: newProduct,
                user: user,
                title: "Products Control Panel"
            });
        };
        req.flash('success', 'Product updated.');
        res.redirect(`/admin/products/edit-product/${id}`);
    });
});

/*
 * GET delete product
 */
router.get('/delete-product/:id', isSellerAdmin, async (req, res) => {
    /*

    >> If the link with provided id is not found return send status code 404 (not found)

    >> If the link provided by the real seller or the admin then give him access. Otherwise return status code
    403 (forbidden)

    */

    Product.findById(req.params.id, async (err, product) => {
        if (err) {
            return res.sendStatus(404);
        }
        if (req.user.username == product.seller || req.user._id == "60e7166e31b12f23187f4b68") {
            await Product.findByIdAndDelete(req.params.id, async (err, product) => {
                if (err) {
                    req.flash('danger', 'Deletion failed.');
                    res.redirect('/admin/products/');
                }
                if (product) {
                    //also delete pics from cloudinary
                    //first empty the folder
                    //then delete the empty folder
                    await cloudinary.api.delete_resources_by_prefix(`${product.seller}/${product.category}/${product.slug}`);
                    await cloudinary.api.delete_folder(`${product.seller}/${product.category}/${product.slug}`);
                    req.flash('success', 'Product deleted.');
                    res.redirect('/admin/products/');
                };
            });
        } else return res.sendStatus(403);
    });
});


/*
 * GET delete image
 */
router.get('/delete-image/:id', isSellerAdmin, (req, res) => {
    /*
    
    ?? Anyone with the image name and product id can delete the image.
    >> Fixed it.
    
    */
    let id = req.params.id,
        imgLink = req.query.imgLink,
        imgId = req.query.imgId
    try {
        Product.findById(id, async (err, product) => {
            if (req.user.username == product.seller || req.user._id == "60e7166e31b12f23187f4b68") {
                //delete the image using image_ids (single)
                await cloudinary.uploader.destroy(imgId);
                //remove image url from images and image_ids from image_ids
                await Product.findByIdAndUpdate(id, {
                    $pull: {
                        images: imgLink,
                        image_ids: imgId
                    }
                })
                req.flash('success', 'Image deleted.');
                res.redirect(`/admin/products/edit-product/${id}`)
            }
        })
    } catch (err) {
        res.sendStatus(403)
    }

});




//exports
module.exports = router;