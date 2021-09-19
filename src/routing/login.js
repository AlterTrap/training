const express = require('express');
const router = express.Router();
const passport = require("passport");
const checkLength = require('../validate').checkLength;
const oneUpscalePass = require('../validate').oneUpscalePass;

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

module.exports = router;
