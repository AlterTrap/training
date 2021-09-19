const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const getDb = require('../database').getDb;
const checkLength = require('../validate').checkLength;
const oneUpscalePass = require('../validate').oneUpscalePass;

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
                    return res.render("signup", {
                        usernameholder: username,
                        msg: "Username already exist",
                    });
                }
            })
            .then((salt) => {
                // Hash password
                return bcrypt.hash(password, salt);
            })
            .then((hash) => {
                let cusAcc = { username: username, password: hash };
                // Save user info to DB
                db.collection("users").insertOne(cusAcc);
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/");
                });
            });
    } else {
        return res.render("signup", {
            usernameholder: username,
            msg: "Password and Password Comfirm not match",
        });
    }
});

module.exports = router;
