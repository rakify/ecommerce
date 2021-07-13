const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const {
    updateValidation,
    passwordValidation
} = require('./validation');
const auth = require('../config/auth')
const isUser = auth.isUser;


// Get User Model
let User = require('../models/User');


/*
 * GET profile
 */
router.get('/profile', isUser, (req, res) => {
    res.render('user/profile.ejs', {
        user: req.user,
        title: 'Profile'
    });
});

/*
 * GET user details
 */
router.get('/edit-profile', isUser, async (req, res) => {
    res.render('user/edit_profile.ejs', {
        user: req.user,
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
        fname = req.body.fname,
        lname = req.body.lname,
        pn = req.body.pn,
        address = {
            division: (req.body.division) ? req.body.division : req.user.address.division,
            district: (req.body.district) ? req.body.district : req.user.address.district,
            address: (req.body.address) ? req.body.address : req.user.address.address
        },
        hash = password;
    const {
        error
    } = updateValidation(req.body);

    if (error) return res.render('user/edit_profile.ejs', {
        error: error.message,
        user: req.user,
        title: 'Edit Profile'
    });

    if (password == req.body.password) hash = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.user._id, {
        username: username,
        email: email,
        password: hash,
        fname: fname,
        lname: lname,
        pn: pn,
        address: address,
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
    });

});

/*
 * GET user password
 */
router.get('/change-password', isUser, async (req, res) => {
    res.render('user/change_password.ejs', {
        title: 'Change Password',
        user: req.user
    });
});

/*
 * POST user password
 */
router.post('/change-password', async (req, res) => {
    let newPw = req.body.newPw,
        confirmNewPw = req.body.confirmNewPw,
        hash = newPw;

    const {
        error
    } = passwordValidation(req.body);
    if (error) return res.render('user/change_password.ejs', {
        error: error.message,
        title: 'Edit Password',
        user: req.user
    });
    //console.log(req.body)


    hash = await bcrypt.hash(newPw, 10);

    await User.findByIdAndUpdate(req.user._id, {
        password: hash
    }, (err, user) => {
        if (err) {
            req.flash('danger', 'Invalid!');
            res.redirect('/user/change-password');
        }
        if (user) {
            req.flash('success', 'Password changed.');
            res.redirect('/user/change-password');
        }
    });

});


// Exports
module.exports = router;