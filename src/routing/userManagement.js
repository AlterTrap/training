const express = require("express");
const router = express.Router();
const database = require("../database");
const bcrypt = require("bcrypt");
const path = require('path');

const checkLength = require("../validate").checkLength;
const oneUpscalePass = require("../validate").oneUpscalePass;
const checkNull = require("../validate").checkNull;
const futureDay = require("../validate").futureDay;
const isNotDate = require("../validate").isNotDate;
const checkRoleVal = require("../validate").checkRoleVal;
const required = require("../validate").required;
const constant = require("../constant")
const upload = require('../uploadMiddleware');
const Resize = require('../Resize');
const ensureAuthenticated = require("../ensureAuthenticated");

router.get("/create", ensureAuthenticated, (req, res) => {
    const loggedUser = req.session.passport.user.username;
    res.render("createUser",{loggedUser: loggedUser});
});

router.post("/create",upload.single('avatar'), async function (req, res) {
    const loggedUser = req.session.passport.user.username;
    const db = database.getDb();
    const { name, birthday, username, password, role } = req.body
    const imagePath = path.join(process.cwd(), 'src/public/images');
    const fileUpload = new Resize(imagePath);
    const checkUsername = checkLength(username);
    const checkPassword = checkLength(password);
    const checkUps = oneUpscalePass(password);
    const nameNull = checkNull(name);
    const usernameNull = checkNull(username);
    const bDayull = checkNull(birthday);
    const passwordNull = checkNull(password)
    const isDate = isNotDate(birthday);
    const inFuture = futureDay(birthday);
    const invalidRole = checkRoleVal(role);
    const isRequireRole = required(role);

    if (nameNull){
        return res.render("createUser", {
            loggedUser: loggedUser,
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
            loggedUser: loggedUser,
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
            loggedUser: loggedUser,
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
            loggedUser: loggedUser,
            username: username,
            usernameholder: username,
            nameholder: name,
            role: role,
            msg: "Please input correct date with format DD/MM/YYYY",
        });
    }

    if (inFuture) {
        return res.render("createUser", {
            loggedUser: loggedUser,
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
            loggedUser: loggedUser,
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
            loggedUser: loggedUser,
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
            loggedUser: loggedUser,
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
            loggedUser: loggedUser,
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: "Password require 1 upscale letter",
        });
    }

    if (invalidRole || !(isRequireRole)){
        return res.render("createUser", {
            loggedUser: loggedUser,
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            msg: "Please choose role member in box dropdown",
        });
    }

    if (req.file) {
        const filename = await fileUpload.save(req.file.buffer);

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
                role_flg: role,
                avatar: filename || "default.png",
            };
            // Save user info to DB
            db.collection("users").insertOne(cusAcc);
            res.redirect("/");
        }).catch(err => {
            return res.render("createUser", {
                loggedUser: loggedUser,
                username: username,
                usernameholder: username,
                nameholder: name,
                bdayholder: birthday,
                role: role,
                msg: err,
            });
        });
    } else {
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
            role_flg: role,
            avatar: "default.png",
        };
        // Save user info to DB
        db.collection("users").insertOne(cusAcc);
        res.redirect("/");
    }).catch(err => {
        return res.render("createUser", {
            loggedUser: loggedUser,
            username: username,
            usernameholder: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            msg: err,
        });
    });
    }
});

router.get("/edit/:username", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const username = req.params.username;
    const accRole = req.session.passport.user.role_flg;
    const loggedUser = req.session.passport.user.username;

    if(accRole != constant.adminRole && loggedUser != username){
        return res.render("error", {errmsg: "This page is not exist"});
    }

    db.collection("users")
        .findOne({ username })
        .then((user) => {
            res.render("editUser", {
                loggedUser: loggedUser,
                username: username,
                nameholder: user.name,
                bdayholder: user.birthday,
                username: user.username,
                role_flg: accRole,
                role: user.role_flg,
                constant: constant
            });
        });
});

router.post("/edit/:username",upload.single('avatar'), async function (req, res) {
    const db = database.getDb();
    const loggedUser = req.session.passport.user.username;
    const {name, birthday, role} = req.body;
    const username = req.params.username;
    const accRole = req.session.passport.user.role_flg;
    const imagePath = path.join(process.cwd(), 'src/public/images');
    const fileUpload = new Resize(imagePath);
    const nameNull = checkNull(name);
    const bDayull = checkNull(birthday);
    const isDate = isNotDate(birthday);
    const inFuture = futureDay(birthday);
    const invalidRole = checkRoleVal(role);
    const isRequireRole = required(role);

    if (nameNull){
        return res.render("editUser", {
            loggedUser: loggedUser,
            username: username,
            nameholder: name,
            bdayholder: birthday ,
            role: role,
            role_flg: accRole,
            constant: constant,
            msg: "Please fill name field",
        });
    }

    if (bDayull){
        return res.render("editUser", {
            loggedUser: loggedUser,
            username: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            role_flg: accRole,
            constant: constant,
            msg: "Please choose birthday",
        });
    }

    if (!(isDate)) {
        return res.render("editUser", {
            loggedUser: loggedUser,
            username: username,
            nameholder: name,
            role: role,
            role_flg: accRole,
            constant: constant,
            msg: "Please input correct date with format DD/MM/YYYY",
        });
    }

    if (inFuture) {
        return res.render("editUser", {
            loggedUser: loggedUser,
            username: username,
            nameholder: name,
            bdayholder: birthday,
            role: role,
            role_flg: accRole,
            constant: constant,
            msg: "The birhday can not be in future",
        });
    }

    if (invalidRole || !(isRequireRole)) {
        return res.render("editUser", {
            loggedUser: loggedUser,
            username: username,
            nameholder: name,
            bdayholder: birthday ,
            role_flg: accRole,
            constant: constant,
            msg: "Please choose role member in box dropdown",
        });
    }

    if (req.file) {
        const filename = await fileUpload.save(req.file.buffer);

        db.collection("users")
        .findOneAndUpdate(
            { username: username },
            { $set: { name: name, birthday: birthday, role_flg: role, avatar: filename} }
        )
        .then(res.redirect("/"));
    } else {
        db.collection("users")
        .findOneAndUpdate(
            { username: username },
            { $set: { name: name, birthday: birthday, role_flg: role} }
        )
        .then(res.redirect("/"));
    }

});

router.post("/delete/:username", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const username = req.params.username;
    db.collection("users").deleteOne({ username: username })
    .then(res.redirect("/"));
});

module.exports = router;
