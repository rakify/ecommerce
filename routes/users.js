const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const {
    registerValidation,
    updateValidation
} = require('./validation');
const auth = require('../config/auth')
const isUser = auth.isUser;


// Get User Model
let User = require('../models/User');

/*
 * GET register
 */
router.get('/register', (req, res) => {
    res.render('register', {
        title: 'Register'
    });

});

/*
 * POST register
 */
router.post('/register', async (req, res) => {
    const {
        error
    } = registerValidation(req.body);
    if (error) return res.render('register', {
        error: error.message,
        user: null,
        title: 'Register'
    });

    let username = req.body.username,
        email = req.body.email,
        password = req.body.password,
        hash = await bcrypt.hash(password, 10);
        fname = req.body.fname,
        lname = req.body.lname,
        pn = req.body.pn
        
    User.create({
        username: username,
        email: email,
        password: hash,
        fname: fname,
        lname: lname,
        pn: pn,
        admin: 0
    }, (err, user) => {
        if (err) {
            req.flash('danger', 'Username and/or Email Exists!');
            res.redirect('/users/register');
        }
        if (user) {
            req.flash('success', 'You are registered.');
            res.redirect('/users/login');
        }
    })

})



/*
 * GET login
 */
router.get('/login', function (req, res) {

    if (res.locals.user) res.redirect('/');

    res.render('login', {
        title: 'Log in'
    });

});

/*
 * POST login
 */
router.post('/login', function (req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);

});

/*
 * GET logout
 */
router.get('/logout', function (req, res) {

    req.logout();

    req.flash('success', 'You are logged out!');
    res.redirect('/users/login');

});

// Exports
module.exports = router;