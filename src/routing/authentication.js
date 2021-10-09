const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");

const getDb = require('../database').getDb;
const checkLength = require('../validate').checkLength;
const oneUpscalePass = require('../validate').oneUpscalePass;
const memberRole = require("../constant").memberRole;

router.get("/login", function (req, res) {
    // If user is already logged in, then redirect
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    res.render("login", { msg: req.session.error });
});

router.post("/login", function (req, res, next) {
    const username = req.body.username;
    const password = req.body.password;
    const checkUsername = checkLength(username);
    const CheckPassword = checkLength(password);
    const checkUps = oneUpscalePass(password);

    if (!checkUsername) {
        return res.render("login", {
            usernameholder: username,
            msg: "Username not enough 6 letters",
        });
    }

    if (!CheckPassword) {
        return res.render("login", {
            usernameholder: username,
            msg: "Password not enough 6 letters",
        });
    }

    if (checkUps) {
        return res.render("login", {
            usernameholder: username,
            msg: "Password require 1 upscale letter",
        });
    }

    passport.authenticate("local", function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Display message
            msg = info.message;
            return res.render("login", { msg: msg });
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect("/");
        });
    })(req, res, next);
});

router.get("/signup", (req, res) => {
    // If user is already logged in, then redirect
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    res.render("signup");
});

router.post("/signup", function (req, res) {
    const db = getDb();
    const username = req.body.username;
    const password = req.body.password;
    const passwordCfm = req.body.passwordCfm;
    const checkUsername = checkLength(username);
    const checkPassword = checkLength(password);
    const checkPasswordCfm = checkLength(passwordCfm);
    const checkUps = oneUpscalePass(password);

    if (!checkUsername) {
        return res.render("signup", {
            usernameholder: username,
            msg: "Username Not enough 6 letters",
        });
    }

    if (!checkPassword) {
        return res.render("signup", {
            usernameholder: username,
            msg: "Passsword Not enough 6 letters",
        });
    }

    if (!checkPasswordCfm) {
        return res.render("signup", {
            usernameholder: username,
            msg: "Passsword Comfirm Not enough 6 letters",
        });
    }

    if (checkUps) {
        return res.render("signup", {
            usernameholder: username,
            msg: "Password require 1 upscale letter",
        });
    }

    // Check password and password comfirm
    if (password == passwordCfm) {
        db.collection("users")
            .findOne({ username })
            .then((user) => {
                //check user already in DB or not
                if (!user) {
                    return bcrypt.genSalt(10);
                } else {
                    throw "Username already exist";
                }
            })
            .then((salt) => {
                // Hash password
                return bcrypt.hash(password, salt);
            })
            .then((hash) => {
                let cusAcc = { username: username, password: hash, role_flg: memberRole };
                // Save user info to DB
                db.collection("users").insertOne(cusAcc);
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/");
                });
            }).catch(error => {
                return res.render("signup", {
                    usernameholder: username,
                    msg: error,
                });
            }) 
    } else {
        return res.render("signup", {
            usernameholder: username,
            msg: "Password and Password Comfirm not match",
        });
    }
});


router.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/login");
});

module.exports = router;
