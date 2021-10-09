const express = require("express");
const router = express.Router();
const database = require("../database");

const constant = require("../constant")
const ensureAuthenticated = require("../ensureAuthenticated");

router.get("/", ensureAuthenticated, function (req, res) {
    const db = database.getDb();
    const username = req.session.passport.user.username;
    const role_flg = req.session.passport.user.role_flg;
    const searchName = req.query.searchUser;
    let perPage = 3;
    let page = req.query.page || 1;
    let documentCount = 0;
    
    if (searchName == null) {
        db.collection("users")
            .find({})
            .count(function (err, count) {
                if (err) res.render("error", { errmsg: "Sever error" });
                documentCount = count;
            });
        db.collection("users")
            .find({})
            .skip(perPage * page - perPage)
            .limit(perPage)
            .toArray(function (err, userLists) {
                if (err) res.render("error", { errmsg: "Sever error" });
                res.render("index", {
                    username: username,
                    role_flg: role_flg || constant.memberRole,
                    userLists: userLists,
                    searchholder: searchName,
                    current: page,
                    pages: Math.ceil(documentCount / perPage),
                    constant: constant
                });
            });
    } else {
        if (searchName == "") {
            searchName == null;
            return res.redirect("/");
        }
        db.collection("users")
            .find(
                {
                    $or: [
                        { username: { $regex: searchName, $options: "i" } },
                        { name: { $regex: searchName, $options: "i" } },
                        { birthday: { $regex: searchName, $options: "i" } },
                    ],
                },
                { projection: { username: 1, name: 1, birthday: 1 } }
            )
            .count(function (err, count) {
                if (err) res.render("error", { errmsg: "Sever error" });
                documentCount = count;
            });
        db.collection("users")
            .find(
                {
                    $or: [
                        { username: { $regex: searchName, $options: "i" } },
                        { name: { $regex: searchName, $options: "i" } },
                        { birthday: { $regex: searchName, $options: "i" } },
                    ],
                },
                { projection: { username: 1, name: 1, birthday: 1 } }
            )
            .skip(perPage * page - perPage)
            .limit(perPage)
            .toArray(function (err, userLists) {
                if (err) res.render("error", { errmsg: "Sever error" });
                res.render("index", {
                    username: username,
                    role_flg: role_flg || constant.memberRole,
                    searchUser: searchName,
                    userLists: userLists,
                    searchholder: searchName,
                    current: page,
                    pages: Math.ceil(documentCount / perPage),
                    constant: constant
                });
            });
    }
});

module.exports = router;
