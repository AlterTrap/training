const express = require("express");
const router = express.Router();
const database = require("../database");
const bcrypt = require("bcrypt");
const moment = require("moment");

const checkLength = require("../validate").checkLength;
const oneUpscalePass = require("../validate").oneUpscalePass;
const checkNull = require("../validate").checkNull;
const futureDay = require("../validate").futureDay;
const isNotDate = require("../validate").isNotDate;
const ensureAuthenticated = require("../ensureAuthenticated");

router.get("/create", ensureAuthenticated, (req, res) => {
    res.render("createUser");
});

router.post("/create", function (req, res) {
    const db = database.getDb();
    const { name, birthday, username, password, role } = req.body
    const checkUsername = checkLength(username);
    const checkPassword = checkLength(password);
    const checkUps = oneUpscalePass(password);
    const nameNull = checkNull(name);
    const usernameNull = checkNull(username);
    const bDayull = checkNull(birthday);
    const passwordNull = checkNull(password)
    const isDate = isNotDate(birthday);
    const inFuture = futureDay(birthday);

    if (nameNull){
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: "Please fill name field"
        });
    }

    if (usernameNull){
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: "Please fill username field"
        });
    }

    if (bDayull){
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: "Please choose birthday"
        });
    }

    if (!(isDate)) {
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            role: role,
            msg: "Please input correct date with format DD/MM/YYYY",
        });
    }

    if (inFuture) {
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: "The birhday can not be in future"
        });
    }

    if (passwordNull){
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: "Please fill password field"
        });
    }

    if (!checkUsername) {
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: "Username Not enough 6 letters",
        });
    }

    if (!checkPassword) {
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: "Passsword Not enough 6 letters",
        });
    }

    if (checkUps) {
        return res.render("createUser", {
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
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
                throw "Username already exist";
            }
        })
        .then((salt) => {
            // Hash password
            return bcrypt.hash(password, salt);
        })
        .then((hash) => {
            let cusAcc = {
                name: name,
                birthday: birthday,
                username: username,
                password: hash,
                role_flg: role
            };
            // Save user info to DB
            db.collection("users").insertOne(cusAcc);
            res.redirect("/");
        }).catch(err => {
            return res.render("createUser", {
                username: username,
                usernameholder: username,
                nameholder: name,
                bdayholder: birthday,
                role: role,
                msg: err,
            });
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
                bdayholder: user.birthday,
                username: user.username,
                role: user.role_flg
            });
        });
});

router.post("/edit/:username", function (req, res) {
    const db = database.getDb();
    const {name, birthday, role} = req.body;
    const username = req.params.username;
    const nameNull = checkNull(name);
    const bDayull = checkNull(birthday);
    const isDate = isNotDate(birthday);
    const inFuture = futureDay(birthday);

    if (nameNull){
        return res.render("editUser", {
            username: username,
            nameholder: name,
            bdayholder: birthday ,
            role: role,
            msg: "Please fill name field",
        });
    }

    if (bDayull){
        return res.render("editUser", {
            username: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: "Please choose birthday",
        });
    }

    if (!(isDate)) {
        return res.render("editUser", {
            username: username,
            nameholder: name,
            role: role,
            msg: "Please input correct date with format DD/MM/YYYY",
        });
    }

    if (inFuture) {
        return res.render("editUser", {
            username: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: "The birhday can not be in future",
        });
    }

    db.collection("users")
        .findOneAndUpdate(
            { username: username },
            { $set: { name: name, birthday: birthday, role_flg: role } }
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
