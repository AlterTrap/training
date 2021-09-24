const express = require("express");
const router = express.Router();
const database = require("../database");
const bcrypt = require("bcrypt");

const checkLength = require("../validate").checkLength;
const oneUpscalePass = require("../validate").oneUpscalePass;

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.error = "Login to view this page";
    res.redirect("/login");
}

router.get("/create", ensureAuthenticated, (req, res) => {
    res.render("createUser");
});

router.post("/create", function (req, res) {
    const db = database.getDb();
    const name = req.body.name;
    const bDay = req.body.birthday;
    const username = req.body.username;
    const password = req.body.password;
    const checkUsername = checkLength(username);
    const checkPassword = checkLength(password);
    const checkUps = oneUpscalePass(password);

    if (!checkUsername) {
        return res.render("createUser", {
            usernameholder: username,
            msg: "Username Not enough 6 letters",
        });
    }

    if (!checkPassword) {
        return res.render("createUser", {
            usernameholder: username,
            nameholder: name,
            msg: "Passsword Not enough 6 letters",
        });
    }

    if (checkUps) {
        return res.render("createUser", {
            usernameholder: username,
            nameholder: name,
            msg: "Password require 1 upscale letter",
        });
    }

    // Check password and password comfirm
    db.collection("users")
        .findOne({ username })
        .then((user) => {
            //check user already in DB or not
            if (!user) {
                return bcrypt.genSalt(10);
            } else {
                return res.render("createUser", {
                    usernameholder: username,
                    nameholder: name,
                    msg: "Username already exist",
                });
            }
        })
        .then((salt) => {
            // Hash password
            return bcrypt.hash(password, salt);
        })
        .then((hash) => {
            let cusAcc = {
                name: name,
                birthday: bDay,
                username: username,
                password: hash,
            };
            // Save user info to DB
            db.collection("users").insertOne(cusAcc);
            res.redirect("/");
        });
});

router.get("/:username/edit", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const username = req.params.username;
    db.collection("users")
        .findOne({ username })
        .then((user) => {
            res.render("editUser", {
                nameholder: user.name,
                bdayholder: user.birthday,
                username: user.username,
            });
        });
});

router.post("/:username/edit", function (req, res) {
    const db = database.getDb();
    const name = req.body.name;
    const bDay = req.body.birthday;
    const username = req.params.username;

    db.collection("users")
        .findOneAndUpdate(
            { username: username },
            { $set: { name: name, birthday: bDay } }
        )
        .then(res.redirect("/"));
});

router.get("/:username/delete", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const username = req.params.username;
    db.collection("users").deleteOne({ username: username });
    res.redirect("/");
});

module.exports = router;
