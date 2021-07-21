const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const {
    updateValidation,
    passwordValidation
} = require('./validation');
const auth = require('../config/auth')
const isUser = auth.isUser;
// For password reset
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();


// Get User Model
let User = require('../models/User');



/*
 * GET forgot-password
 */
router.get('/forgot-password', (req, res) => {

    res.render('user/forgot_password', {
        title: "Forgot Password"
    })
});

/*
 * POST forgot-password
 */
router.post('/forgot-password', (req, res, next) => {
    const {
        email
    } = req.body;

    User.findOne({
        email: email
    }, (err, user) => {

        if (err) {
            req.flash("danger", "Failed! Please contact administrator.");
            res.redirect('/user/forgot-password');
        }

        if (!user) {
            req.flash("danger", "No user found.");
            res.redirect('/user/forgot-password');
        }
        if (user) {
            const secret = process.env.SECRET_KEY + user.password;
            const payload = {
                email: user.email,
                id: user.id
            };
            const token = jwt.sign(payload, secret, {
                expiresIn: '1h'
            });
            const link = `http://localhost:4000/user/reset-password/${user.id}/${token}`
            // Email process begins here
            try {
                //send mail
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.nm_user,
                        pass: process.env.nm_pass
                    }
                })
                // second step //
                let mailOption = {
                    from: process.env.nm_user,
                    to: user.email,
                    subject: 'Reset Password',
                    text: `Dear ${user.username},\nIt seems that you forgot the password with rakify mall and requested to reset your password.\nHere is a one time usable link to reset your password and it will expire within 1 hour.\nLink: ${link}\nIf you think someone else attempt doing this, please just ignore the mail. Thank you`
                }

                // third step //
                transporter.sendMail(mailOption, function (err, data) {
                    if (err) {
                        return res.json({
                            msg: 'Can not send email',
                            err
                        })
                    } else {
                        req.flash("success", "Check your email. If you are registered, an email has been sent including further process.");
                        res.redirect('/user/forgot-password');
                    }
                })
            } catch (err) {
                res.json({
                    err
                })
            }
        }
    })
});

/*
 * GET reset-password
 */
router.get('/reset-password/:id/:token', (req, res) => {
    const {
        id,
        token
    } = req.params;

    //Check if this is id exist
    User.findById(id, (err, user) => {
        if (err) {
            req.flash("danger", "Failed! Please contact administrator.");
            res.redirect('/user/forgot-password');
        }

        if (!user) {
            req.flash("danger", "No user found.");
            res.redirect('/user/forgot-password');
        }
        if (user) {
            const secret = process.env.SECRET_KEY + user.password;
            try {
                const payload = jwt.verify(token, secret);
                res.render('user/reset_password', {
                    email: user.email,
                    title: "Reset Password"
                })
            } catch (error) {
                req.flash("danger", "Invalid token.");
                res.redirect('/user/forgot-password');
            }
        }
    })
});

/*
 * POST reset-password
 */
router.post('/reset-password/:id/:token', (req, res, next) => {
    const {
        id,
        token
    } = req.params;
    const {
        newPw,
        confirmNewPw
    } = req.body;

    //Check if this id exist
    User.findById(id, async (err, user) => {
        if (err) {
            req.flash("danger", "Failed! Please contact administrator.");
            res.redirect('/user/forgot-password');
        }

        if (!user) {
            req.flash("danger", "No user found.");
            res.redirect('/user/forgot-password');
        }
        if (user) {
            const secret = process.env.SECRET_KEY + user.password;

            jwt.verify(token, secret, async (err, decoded) => {
                if (err) res.send(err)
                if (decoded) {
                    // validate passwords
                    const {
                        error
                    } = passwordValidation(req.body);
                    if (error) {
                        req.flash("danger", "Passwords did not match.");
                        res.redirect(`/user/reset-password/${id}/${token}`);
                    }
                    let hash = await bcrypt.hash(newPw, 10);
                    await User.findByIdAndUpdate(user._id, {
                        password: hash
                    });

                    req.flash("success", "Password reset successful.");
                    res.redirect(`/users/login`);
                }
            })
        }
    });
});


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

/*
 * GET user address
 */
router.get('/set-address', isUser, async (req, res) => {
    res.render('user/set_address.ejs', {
        title: 'Set Delivery Address',
        user: req.user
    });
});

/*
 * POST user address
 */
router.post('/set-address', async (req, res) => {
    let address = {
        division: (req.body.division) ? req.body.division : req.user.address.division,
        district: (req.body.district) ? req.body.district : req.user.address.district,
        address: (req.body.address) ? req.body.address : req.user.address.address
    }
    await User.findByIdAndUpdate(req.user._id, {
        address: address
    }, (err, user) => {
        if (err) {
            req.flash('danger', 'Failed!');
            res.redirect('/user/set-address');
        }
        if (user) {
            req.flash('success', 'Delivery address added.');
            res.redirect('/user/profile');
        }
    });

});


/*
 * POST let user be seller or buyer
 */
router.post('/profile', async (req, res) => {
    let admin;
    if (req.user.admin == 0) admin = 2;
    if (req.user.admin == 2) admin = 0;
    await User.findByIdAndUpdate(req.user._id, {
        admin: admin
    }, (err, user) => {
        if (err) {
            req.flash('danger', 'Something went wrong!');
            res.redirect('/profile');
        }
        if (user) {
            req.flash('success', 'Profile Updated.');
            res.redirect('/user/profile');
        }
    });

});


// Exports
module.exports = router;