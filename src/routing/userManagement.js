const express = require("express");
const router = express.Router();
const database = require("../database");
const bcrypt = require("bcrypt");
const moment = require("moment");

const checkLength = require("../validate").checkLength;
const oneUpscalePass = require("../validate").oneUpscalePass;
const checkNull = require("../validate").checkNull;
const validDay = require("../validate").validDay;
const ensureAuthenticated = require("../ensureAuthenticated");

router.get("/create", ensureAuthenticated, (req, res) => {
    res.render("createUser");
});

router.post("/create", function (req, res) {
    const db = database.getDb();
    const { name, birthday, username, password } = req.body
    const convertBday = moment(birthday, 'DD/MM/YYYY').format("YYYY-MM-DD");
    const checkUsername = checkLength(username);
    const checkPassword = checkLength(password);
    const checkUps = oneUpscalePass(password);
    const nameNull = checkNull(name);
    const usernameNull = checkNull(username);
    const bDayull = checkNull(birthday);
    const passwordNull = checkNull(password)
    const inFuture = validDay(convertBday);

    if (nameNull){
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            msg: "Please fill name field"
        });
    }

    if (usernameNull){
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            msg: "Please fill username field"
        });
    }

    if (bDayull){
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            msg: "Please choose birthday"
        });
    }

    if (inFuture) {
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            msg: "The birhday can not be in future"
        });
    }

    if (passwordNull){
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            msg: "Please fill password field"
        });
    }

    if (!checkUsername) {
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            msg: "Username Not enough 6 letters",
        });
    }

    if (!checkPassword) {
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            msg: "Passsword Not enough 6 letters",
        });
    }

    if (checkUps) {
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
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
                    username: username,
                    usernameholder: username,
                    nameholder: name,
                    bdayholder: convertBday,
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
                birthday: convertBday,
                username: username,
                password: hash,
            };
            // Save user info to DB
            db.collection("users").insertOne(cusAcc);
            res.redirect("/");
        });
});

router.get("/edit/:username", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const username = req.params.username;
    db.collection("users")
        .findOne({ username })
        .then((user) => {
            res.render("editUser", {
                username: username,
                nameholder: user.name,
                bdayholder: user.birthday || "",
                username: user.username,
                moment: moment
            });
        });
});

router.post("/edit/:username", function (req, res) {
    const db = database.getDb();
    const {name, birthday} = req.body;
    const convertBday = moment(birthday, 'DD/MM/YYYY').format("YYYY-MM-DD");
    const username = req.params.username;
    const nameNull = checkNull(name);
    const bDayull = checkNull(birthday);
    const inFuture = validDay(convertBday);

    if (nameNull){
        return res.render("editUser", {
            username: username,
            nameholder: name,
            bdayholder: convertBday ,
            msg: "Please fill name field",
            moment: moment
        });
    }

    if (bDayull){
        return res.render("editUser", {
            username: username,
            nameholder: name,
            bdayholder: birthday,
            msg: "Please choose birthday",
            moment: moment
        });
    }


    if (inFuture) {
        return res.render("editUser", {
            username: username,
            nameholder: name,
            bdayholder: convertBday,
            msg: "The birhday can not be in future",
            moment: moment
        });
    }

    db.collection("users")
        .findOneAndUpdate(
            { username: username },
            { $set: { name: name, birthday: convertBday } }
        )
        .then(res.redirect("/"));
});

router.post("/delete/:username", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const username = req.params.username;
    db.collection("users").deleteOne({ username: username })
    .then(res.redirect("/"));
});

module.exports = router;
