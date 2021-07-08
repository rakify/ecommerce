const express = require('express');
const router = express.Router();
const auth = require('../config/auth')
const isAdmin = auth.isAdmin;

//get categoryValidation
const {
    categoryValidation
} = require('./validation');

//get category Model
const Category = require('../models/Category');

/*
 * GET category index
 */
router.get('/', isAdmin, async (req, res) => {
    await Category.find((err, categories) => {
        if (err) {
            res.render('admin/categories', {
                error: err
            });
        }
        if (categories) {
            res.render('admin/categories', {
                categories: categories
            });
        }
    });
});

/*
 * GET add category
 */
router.get('/add-category', isAdmin, (req, res) => {
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

    Category.create({
        title: title,
        slug: slug
    }, (err, category) => {
        if (err) {
            req.flash('danger', 'Category title exists, choose another.')
            res.render('admin/add_category', {
                title: title
            });
        }
        if (category) {
            Category.find((err, categories) => {
                if (err) console.log(err);
                if (categories) req.app.locals.categories = categories;
            });
            req.flash('success', 'Category added');
            res.redirect('/admin/categories');
        }
    });
});

/*
 * GET edit category
 */
router.get('/edit-category/:id', isAdmin, async (req, res) => {
    await Category.findById(req.params.id, (err, category) => {
        if (err) {
            res.render('admin/edit_category', {
                category: category
            });
        }
        if (category) {
            res.render('admin/edit_category', {
                category: category
            });
        }
    });
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
        _id: id
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
    await Category.findByIdAndUpdate(id, category, (err, category) => {
        if (err) {
            req.flash('danger', 'Category exists, choose another.');
            res.render('admin/edit_category', {
                category: category
            });
        }
        if (category) {
            Category.find((err, categories) => {
                if (err) console.log(err);
                if (categories) req.app.locals.categories = categories;
            });
            req.flash('success', 'Category updated.');
            res.redirect(`/admin/categories/edit-category/${id}`);
        }
    });
});

/*
 * GET delete category
 */
router.get('/delete-category/:id', isAdmin, async (req, res) => {
    await Category.findByIdAndRemove(req.params.id, (err, category) => {
        if (err) {
            req.flash('danger', 'Deletion failed.');
            res.redirect('/admin/categories/');
        }
        if (category) {
            Category.find((err, categories) => {
                if (err) console.log(err);
                if (categories) req.app.locals.categories = categories;
            });
            req.flash('success', 'Category deleted.');
            res.redirect('/admin/categories/');
        }
    });
});



//exports
module.exports = router;