const express = require("express");
const router = express.Router();
const database = require("../database");
const moment = require("moment");

const ensureAuthenticated = require("../ensureAuthenticated");

router.get("/", ensureAuthenticated, function (req, res) {
    const db = database.getDb();
    const username = req.session.passport.user;
    const searchName = req.query.searchUser;
    let perPage = 3;
    let page = req.query.page || 1;
    let documentCount = 0;
    const date = moment(searchName, "DD/MM/YYYY").format("YYYY-MM-DD");
    
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
                    userLists: userLists,
                    searchholder: searchName,
                    current: page,
                    pages: Math.ceil(documentCount / perPage),
                    moment: moment,
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
                        { birthday: { $regex: date, $options: "i" } },
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
                        { birthday: { $regex: date, $options: "i" } },
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
                    searchUser: searchName,
                    userLists: userLists,
                    searchholder: searchName,
                    current: page,
                    pages: Math.ceil(documentCount / perPage),
                    moment: moment,
                });
            });
    }
});

module.exports = router;
