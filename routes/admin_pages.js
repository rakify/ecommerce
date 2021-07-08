const express = require('express');
const router = express.Router();
const auth = require('../config/auth')
const isAdmin = auth.isAdmin;

//get pageValidation
const {
    pageValidation
} = require('./validation');

//get Page Model
const Page = require('../models/Page');

/*
 * GET page index
 */
router.get('/', isAdmin, (_req, res) => {
    try {
        Page.find({}).sort({
            sorting: 1
        }).exec((err, pages) => {
            res.render('admin/pages', {
                pages: pages
            });
        });
    } catch (err) {
        res.render('admin/pages', {
            error: err
        })
    }
});

/*
 * GET add page
 */
router.get('/add-page', isAdmin, (req, res) => {
    let title, slug, content;
    res.render('admin/add_page', {
        title: title,
        slug: slug,
        content: content
    });
});

/*
 * POST add page
 */
router.post('/add-page', async (req, res) => {
    let title = req.body.title;
    let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase(); //all spaces replace with -
    if (slug === '') slug = title.replace(/\s+/g, '-').toLowerCase(); //if slug is empty replace it with title
    let content = req.body.content;
    const {
        error
    } = pageValidation(req.body);
    if (error) return res.render('admin/add_page', {
        error: error.details[0].message,
        title: title,
        slug: slug,
        content: content
    });
    Page.create({
        title: title,
        slug: slug,
        content: content,
        sorting: 100
    }, (err, page) => {
        if (err) {
            req.flash('danger', 'Slug exists, choose another.')
            res.render('admin/add_page', {
                title: title,
                slug: slug,
                content: content
            });
        }
        if (page) {
            Page.find({}).sort({
                sorting: 1
            }).exec((err, pages) => {
                if (err) console.log(err);
                if (pages) req.app.locals.pages = pages;
            });
            req.flash('success', 'Page added');
            res.redirect('/admin/pages');
        }
    });
});

/*
 * GET edit page
 */
router.get('/edit-page/:id', isAdmin, async (req, res) => {
    await Page.findById(req.params.id, (err, page) => {
        if (err) {
            res.render('admin/edit_page', {
                error: err
            });

        }
        if (page) {
            res.render('admin/edit_page', {
                page: page
            });
        }
    });
});

/*
 * POST edit page
 */
router.post('/edit-page/:id', async (req, res) => {
    let title = req.body.title;
    let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase(); //all spaces replace with -
    if (slug === '') slug = title.replace(/\s+/g, '-').toLowerCase(); //if slug is empty replace it with title
    let content = req.body.content;
    let sorting = req.body.sorting;
    let id = req.params.id;
    const page = {
        title: title,
        slug: slug,
        content: content,
        sorting: sorting,
        _id: id
    }
    const {
        error
    } = pageValidation(page);
    if (error) {
        return res.render('admin/edit_page', {
            error: error.details[0].message,
            page: page
        });
    }
    await Page.findByIdAndUpdate(id, page, (err, page) => {
        if (err) {
            req.flash('danger', 'Page slug exists, choose another.');
            res.render('admin/edit_page', {
                page: page
            });
        }
        if (page) {
            Page.find({}).sort({
                sorting: 1
            }).exec((err, pages) => {
                if (err) console.log(err);
                if (pages) req.app.locals.pages = pages;
            });
            req.flash('success', 'Page Updated.');
            res.redirect(`/admin/pages/edit-page/${id}`);
        }
    });
});

/*
 * GET delete page
 */
router.get('/delete-page/:id', isAdmin, async (req, res) => {
    await Page.findByIdAndDelete(req.params.id, (err, page) => {
        if (err) {
            req.flash('danger', 'Deletion failed.');
            res.redirect('/admin/pages/');
        }
        if (page) {
            Page.find({}).sort({
                sorting: 1
            }).exec((err, pages) => {
                if (err) console.log(err);
                if (pages) req.app.locals.pages = pages;
            });
            req.flash('success', 'Page deleted.');
            res.redirect('/admin/pages/');
        }
    })
});



//exports
module.exports = router;