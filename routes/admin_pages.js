const express = require('express');
const router = express.Router();

//get pageValidation
const {
    pageValidation
} = require('./validation');

//get Page Model
const Page = require('../models/Page');

/*
 * GET page index
 */
router.get('/', (req, res) => {
    Page.find({}).sort({
        sorting: 1
    }).exec((err, pages) => {
        res.render('admin/pages', {
            pages: pages
        });
    });
});

/*
 * GET add page
 */
router.get('/add-page', (req, res) => {
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

    try {
        await Page.create({
            title: title,
            slug: slug,
            content: content,
            sorting: 100
        });

        req.flash('success', 'Page added');
        res.redirect('/admin/pages');

    } catch (err) {
        req.flash('danger', 'Slug exists, choose another.')
        res.render('admin/add_page', {
            title: title,
            slug: slug,
            content: content
        });
    };
});

/*
 * GET edit page
 */
router.get('/edit-page/:slug', async (req, res) => {
    await Page.findOne({
        slug: req.params.slug
    }, (err, page) => {
        if (err) return console.log(err);
        res.render('admin/edit_page', {
            page: page
        });
    })
});

/*
 * POST edit page
 */
router.post('/edit-page/:slug', async (req, res) => {
    let title = req.body.title;
    let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase(); //all spaces replace with -
    if (slug === '') slug = title.replace(/\s+/g, '-').toLowerCase(); //if slug is empty replace it with title
    let content = req.body.content;
    let sorting = req.body.sorting;
    let id = req.body.id;
    const page = {
        title: title,
        slug: slug,
        content: content,
        sorting: sorting,
        id: id
    }
    const {
        error
    } = pageValidation(page);
    if (error){
        return res.render('admin/edit_page', {
        error: error.details[0].message,
        page:page
    });
}
    try {
        await Page.findOneAndUpdate({_id:id},page)
        req.flash('success', 'Page Updated.');
        res.redirect(`/admin/pages/edit-page/${slug}`);
    } catch (err) {
        req.flash('danger', 'Page slug exists, choose another.');   
        res.render('admin/edit_page', {
            page:page
        });
    };
});


//exports
module.exports = router;