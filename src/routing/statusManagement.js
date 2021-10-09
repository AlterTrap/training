const express = require("express");
const router = express.Router();
const database = require("../database");
const moment = require("moment");

const checkNull = require("../validate").checkNull;
const constant = require("../constant");
const ensureAuthenticated = require("../ensureAuthenticated");

router.get("/status", ensureAuthenticated, (req, res) => {
    const accUser = req.session.passport.user.username;
    const role = req.session.passport.user.role_flg;
    const db = database.getDb();
    let perPage = 3;
    let page = req.query.page || 1;
    let documentCount = 0;

    db.collection("posts")
        .find(
            {},
            { projection: { username: 1, tittle: 1, status: 1, date: 1 } }
        )
        .count(function (err, count) {
            if (err) res.render("error", { errmsg: "Sever error" });
            documentCount = count;
        });
    db.collection("posts")
        .find(
            {},
            { projection: { username: 1, tittle: 1, status: 1, date: 1 } }
        )
        .skip(perPage * page - perPage)
        .limit(perPage)
        .sort({ _id: -1 })
        .toArray((err, user) => {
            if (err) res.render("error", { errmsg: "Sever error" });
            res.render("statusUser", {
                username: accUser,
                role: role,
                statusLists: user,
                current: page,
                pages: Math.ceil(documentCount / perPage),
                constant: constant,
            });
        });
});

router.get("/status/create", ensureAuthenticated, (req, res) => {
    res.render("createStatus");
});

router.post("/status/create", (req, res) => {
    const db = database.getDb();
    const username = req.session.passport.user.username;
    const { tittle, status } = req.body;
    const date = new Date();
    const convertDate = moment(date).format("MM/DD/YYYY HH:mm");
    const cusStatus = {
        username: username,
        date: convertDate,
        tittle: tittle,
        status: status,
    };
    const checkNullTittle = checkNull(tittle);
    const checkNullStatus = checkNull(status);

    if (checkNullTittle) {
        return res.render("createStatus", {
            tittleholder: tittle,
            statusholder: status,
            msg: "Please fill tittle field",
        });
    }

    if (checkNullStatus) {
        return res.render("createStatus", {
            tittleholder: tittle,
            statusholder: status,
            msg: "Please fill status field",
        });
    }

    db.collection("posts").insertOne(cusStatus).then(res.redirect("/status"));
});

router.get("/status/edit/:id", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const id = req.params.id;
    const username = req.session.passport.user.username;

    if (!database.ObjectId.isValid(id)) {
        return res.render("error", {
            errmsg: "This page is not exist",
        });
    }

    db.collection("posts")
        .findOne(
            { _id: database.ObjectId(id) },
            { projection: { _id: 1, username: 1, tittle: 1, status: 1 } }
        )
        .then((post) => {
            if (post.username != username || post == null) {
                return res.render("error", {
                    errmsg: "This page is not exist",
                });
            }
            res.render("editStatus", {
                id: post._id,
                tittleholder: post.tittle,
                statusholder: post.status,
            });
        });
});

router.post("/status/edit/:id", function (req, res) {
    const db = database.getDb();
    const { tittle, status } = req.body;
    const id = req.params.id;
    const checkNullTittle = checkNull(tittle);
    const checkNullStatus = checkNull(status);

    if (checkNullTittle) {
        return res.render("editStatus", {
            id: id,
            tittleholder: tittle,
            statusholder: status,
            msg: "Please fill tittle field",
        });
    }

    if (checkNullStatus) {
        return res.render("editStatus", {
            id: id,
            tittleholder: tittle,
            statusholder: status,
            msg: "Please fill status field",
        });
    }

    db.collection("posts")
        .findOneAndUpdate(
            { _id: database.ObjectId(id) },
            { $set: { tittle: tittle, status: status } }
        )
        .then(res.redirect("/status"));
});

router.post("/status/delete/:id", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const id = req.params.id;

    if (!database.ObjectId.isValid(id)) {
        return res.render("error", {
            errmsg: "This page is not exist",
        });
    }

    db.collection("posts")
        .deleteOne({ _id: database.ObjectId(id) })
        .then(res.redirect("/status"));
});

module.exports = router;
