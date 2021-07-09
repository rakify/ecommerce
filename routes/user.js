const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const {
    updateValidation
} = require('./validation');
const auth = require('../config/auth')
const isUser = auth.isUser;


// Get User Model
let User = require('../models/User');


/*
 * GET profile
 */
router.get('/profile', function (req, res) {
    res.render('user/profile.ejs', {
        title: 'Profile'
    });
});

/*
 * GET user details
 */
router.get('/edit-profile', isUser, async (req, res) => {
    let user = {
        username: req.user.username,
        email: req.user.email,
        password: '',
        fname: req.user.fname,
        lname: req.user.lname,
        pn: req.user.pn
    }
    res.render('user/edit_profile.ejs', {
        user: user,
        title: 'Edit Profile'
    });
});

/*
 * POST user details
 */
router.post('/edit-profile', isUser, async (req, res) => {
    let username = (req.body.username) ? req.body.username : req.user.username,
    email = (req.body.email) ? req.body.email : req.user.email,
    password = (req.body.password) ? req.body.password : req.user.password,
    fname = (req.body.fname) ? req.body.fname : req.user.fname,
    lname = (req.body.lname) ? req.body.lname : req.user.lname,
    pn = (req.body.pn) ? req.body.pn : req.user.pn,
    hash;
    const {
        error
    } = updateValidation(req.body);
    
    if (error) return res.render('user/edit_profile.ejs', {
        error: error.message,
        user: req.user,
        title: 'Edit Profile'
    });

    if(password == req.body.password)hash = await bcrypt.hash(password, 10);
    else hash = password;
    await User.findByIdAndUpdate(req.user._id,{
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
            res.redirect('/user/edit-profile');
        }
        if (user) {
            req.flash('success', 'Profile updated.');
            res.redirect('/user/edit-profile');
        }
    })
});




// Exports
module.exports = router;