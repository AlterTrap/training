const express = require('express');
const router = express.Router();
const database = require('../database');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.error = "Login to view this page";
    res.redirect("/login");
}

function prettyDate(dateString){
    var date = new Date();
    var d = date.getDate(dateString);
    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    var m = monthNames[date.getMonth()];
    var y = date.getFullYear();
    
    return d+'/'+m+'/'+y;
} 

router.get("/", ensureAuthenticated, function (req, res) {
    const db = database.getDb();
    const username = req.session.passport.user;
    const searchName = req.query.searchUser;
    let perPage = 3;
    let page = req.query.page || 1;
    let documentCount = 0;

    if (searchName == null) {
        db.collection("users")
            .find({})
            .count(function (err, count) {
                if (err) res.render('error', {errmsg : 'Sever error'})
                documentCount = count;
            });
        db.collection("users")
            .find({})
            .skip(perPage * page - perPage)
            .limit(perPage)
            .toArray(function (err, userLists) {
                if (err) res.render('error', {errmsg : 'Sever error'})
                res.render("index", {
                    username: username,
                    userLists: userLists,
                    searchholder: searchName,
                    current: page,
                    pages: Math.ceil(documentCount / perPage),
                    moment: require('moment')
                });
            });
    } else {
        if (searchName == ""){
            searchName == null
            return res.redirect('/');
        }
        db.collection("users")
            .find(
                { username: { $regex: searchName, $options: "i" } },
                { projection: { username: 1, name: 1, birthday: 1 } }
            )
            .count(function (err, count) {
                if (err) res.render('error', {errmsg : 'Sever error'})
                documentCount = count;
            });
        db.collection("users")
            .find(
                {
                    username: {
                        $regex: searchName,
                        $options: "i",
                    },
                },
                { projection: { username: 1, name: 1, birthday: 1 } }
            )
            .skip(perPage * page - perPage)
            .limit(perPage)
            .toArray(function (err, userLists) {
                if (err) res.render('error', {errmsg : 'Sever error'})
                console.log(userLists)
                res.render("index", {
                    username: username,
                    searchUser: searchName,
                    userLists: userLists,
                    searchholder: searchName,
                    current: page,
                    pages: Math.ceil(documentCount / perPage),
                });
            });
    }
});

module.exports = router;
