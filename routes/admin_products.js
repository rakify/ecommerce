const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const auth = require('../config/auth')
const isAdmin = auth.isAdmin;
const isSellerAdmin = auth.isSellerAdmin;

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
router.get('/', isSellerAdmin, (req, res) => {
    let user = req.user;
    Product.find((_err, products) => { //if no product available rendered file will handle the err
        res.render('admin/products', {
            products: products,
            count: products.length,
            user: user
        }); //res.render ends
    }); //Product.find ends
}); //router.get ends

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
                user: user
            });
        }
        res.render('admin/add_product', {
            product: newProduct,
            categories: categories,
            user: user
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
    }

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
        images: images
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
                user: user
            }); //res.render ends
        }); //Category.find ends
    } //if ends
    Product.create(newProduct, (err, product) => {
        if (product) {
            images.forEach((image) => {
                fs.move(`public/images/product_images/tmp/${image}`,
                `public/images/product_images/${product._id}/${image}`, (err) => {
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
                    categories: categories,
                    user: user
                }); //res.render ends
            }); //Category.find ends
        }; //if ends
    }); //Product.create ends
}); //router.post ends

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

    >> Now what if user is trying to edit a product that is linked incorrectly or not available!
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
        oldImages = images,
        overSizedImageArray = [1, 2, 3, 4, 5, 6],
        user = req.user;
    if (req.files !== undefined && images.length + req.files.length < 6) {
        req.files.forEach(image => {
            fs.move(`public/images/product_images/tmp/${image.filename}`,
                `public/images/product_images/${req.params.id}/${image.filename}`, (err) => {
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
        seller: seller,
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
        newProduct.images = oldImages;

        /*
        
        if validation process fails, return oldImages to the images array and everything else
        will be the same as user previously input.
        
        */

        return res.render('admin/edit_product', {
            error: error.details[0].message,
            product: newProduct,
            user: user
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
                user: user
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
        } else return res.sendStatus(403);
    });
});


/*
 * GET delete image
 */
router.get('/delete-image/:image', isSellerAdmin, (req, res) => {
    /*
    
    ?? Anyone with the image name and product id can delete the image.
    >> Fixed it.
    
    */
    let id = req.query.id,
        image = req.params.image;
    Product.findById(id, (err, product) => {
        if (err) {
            return res.sendStatus(404);
        }
        if (req.user.username == product.seller || req.user._id == "60e7166e31b12f23187f4b68") {
            fs.remove(`public/images/product_images/${id}/${image}`, async err => {
                if (err) return res.sendStatus(404);
                await Product.findByIdAndUpdate(id, {
                    $pull: {
                        images: image
                    }
                }, (err, product) => {
                    if (product) {
                        req.flash('success', 'Image deleted.');
                        res.redirect(`/admin/products/edit-product/${req.query.id}`)
                    }
                    if (err) return res.sendStatus(404);
                }); //Product.findByIdAndUpdate ends
            }); //fs.remove ends
        } else return res.sendStatus(403);
    })
}); //get router delete image ends





//exports
module.exports = router;