const express = require('express');
const router = express.Router();

//get categoryValidation
const {
    categoryValidation
} = require('./validation');

//get category Model
const Category = require('../models/Category');

/*
 * GET category index
 */
router.get('/', async (req, res) => {
    try {
        await Category.find((err, categories) => {
            res.render('admin/categories', {
                categories: categories
            });
        });
    } catch (err) {
        res.render('admin/categories', {
            error: err
        });
    };
});

/*
 * GET add category
 */
router.get('/add-category', (req, res) => {
    let title;
    res.render('admin/add_category', {
        title: title
    });
});

/*
 * POST add category
 */
router.post('/add-category', async (req, res) => {
    let title = req.body.title;
    let slug = title.replace(/\s+/g, '-').toLowerCase(); //all spaces replace with -
    const {
        error
    } = categoryValidation(req.body);
    if (error) return res.render('admin/add_category', {
        error: error.details[0].message,
        title: title
    });

    try {
        await Category.create({
            title: title,
            slug: slug
        });

        req.flash('success', 'Category added');
        res.redirect('/admin/categories');

    } catch (err) {
        req.flash('danger', 'Category title exists, choose another.')
        res.render('admin/add_category', {
            title: title
        });
    };
});

/*
 * GET edit category
 */
router.get('/edit-category/:id', async (req, res) => {
    try {
        await Category.findOne({
            _id: req.params.id
        }, (err, category) => {
            res.render('admin/edit_category', {
                category: category
            });
        })
    } catch (err) {
        res.render('admin/edit_category', {
            category: category
        });
    };
});

/*
 * POST edit category
 */
router.post('/edit-category/:id', async (req, res) => {
    let title = req.body.title;
    let slug = title.replace(/\s+/g, '-').toLowerCase(); //all spaces replace with -
    let id = req.params.id;
    const category = {
        title: title,
        slug: slug,
        _id:id
    }
    const {
        error
    } = categoryValidation(category);
    if (error) {
        return res.render('admin/edit_category', {
            error: error.details[0].message,
            category: category
        });
    }
    try {
        await Category.findOneAndUpdate({
            _id: id
        }, category)
        req.flash('success', 'Category updated.');
        res.redirect(`/admin/categories/edit-category/${id}`);
    } catch (err) {
        req.flash('danger', 'Category exists, choose another.');
        res.render('admin/edit_category', {
            category: category
        });
    };
});

/*
 * GET delete category
 */
router.get('/delete-category/:id', async (req, res) => {
    try {
        await Category.findOneAndDelete({
            _id: req.params.id
        })
        req.flash('success', 'Category deleted.');
        res.redirect('/admin/categories/');
    } catch (err) {
        req.flash('danger', 'Deletion failed.');
        res.redirect('/admin/categories/');
    }
});



//exports
module.exports = router;