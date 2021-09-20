const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");


const getDb = require('../database').getDb;
const LocalStrategy = require("passport-local").Strategy;
const checkLength = require('../validate').checkLength;
const oneUpscalePass = require('../validate').oneUpscalePass;

passport.use(
    new LocalStrategy({ usernameField: "username" }, function (
        username,
        password,
        done
    ) {
        const db = getDb();
        //match user
        db.collection("users")
            .findOne({ username: username })
            .then((user) => {
                if (!user) {
                    return done(null, false, { message: "User not exist" });
                }
                //match pass
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) return done(null, false, { message: err });

                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, {
                            message: "Password incorrect",
                        });
                    }
                });
            })
            .catch((err) => {
                return res.render("login", { msg: err });
            });
    })
);

passport.serializeUser((user, done) => {
    console.log(
        "Inside serializeUser callback. User id is save to the session file store here"
    );
    return done(null, user.username);
});

passport.deserializeUser(function (username, done) {
    const db = getDb();
    db.collection("users").findOne(
        { username: username },
        function (err, user) {
            return done(err, user);
        }
    );
});

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


router.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/login");
});

module.exports = passport;
module.exports = router;
