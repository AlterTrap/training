const express = require("express");
const router = express.Router();
const database = require("../database");
const moment = require("moment");

const checkNull = require("../validate").checkNull;
const checkBlank = require("../validate").checkBlank;
const constant = require("../constant");
const ensureAuthenticated = require("../ensureAuthenticated");

router.get("/status", ensureAuthenticated, async (req, res) => {
    const accUser = req.session.passport.user.username;
    const role = req.session.passport.user.role_flg;
    const db = database.getDb();
    const searchStatus = req.query.searchStatus;
    let perPage = 3;
    let page = req.query.page || 1;
    let count = 0;

    if (searchStatus == null) {
        db.collection("posts")
            .find(
                {},
                { projection: { username: 1, title: 1, status: 1, date: 1 } }
            )
            .count(function (err, documentCount) {
                if (err) res.render("error", { errmsg: "Sever error" });
                count = documentCount;
            });

        let status = await db
            .collection("posts")
            .aggregate([
                {
                    $addFields: {
                        id: {
                            $toObjectId: "$userid",
                        },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "id",
                        foreignField: "_id",
                        as: "output",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        username: {
                            $arrayElemAt: ["$output.username", 0],
                        },
                        avatar: { $arrayElemAt: ['$output.avatar', 0] },
                        status: 1,
                        date: 1,
                        dateConvert: {
                            $dateFromString: {
                               dateString: '$date',
                               format: "%d/%m/%Y %H:%M"
                            }
                         }
                    },
                },
                {
                    $sort: {
                        dateConvert: -1,
                    },
                },
                {
                    $skip: perPage * page - perPage,
                },
                {
                    $limit: perPage,
                },
            ])
            .toArray();

        res.render("statusUser", {
            username: accUser,
            role: role,
            statusLists: status,
            current: page,
            pages: Math.ceil(count / perPage),
            constant: constant,
            searchholder: searchStatus
        });
    } else {
        if (searchStatus == "") {
            searchStatus == null;
            return res.redirect("/status");
        }

        let documentCount = await db
            .collection("posts")
            .aggregate([
                {
                    $addFields: {
                        id: {
                            $toObjectId: "$userid",
                        },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "id",
                        foreignField: "_id",
                        as: "output",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        username: {
                            $arrayElemAt: ["$output.username", 0],
                        },
                        avatar: { $arrayElemAt: ['$output.avatar', 0] },
                        status: 1,
                        date: 1,
                    },
                },
                {
                    $match: {
                        $or: [
                            {
                                username: {
                                    $regex: searchStatus,
                                    $options: "i",
                                },
                            },
                            { date: { $regex: searchStatus, $options: "i" } },
                            { title: { $regex: searchStatus, $options: "i" } },
                            { status: { $regex: searchStatus, $options: "i" } },
                        ],
                    },
                },
                {
                    $count: "documentCount",
                },
            ])
            .toArray();

        if(documentCount.length){
            count = Object.values(documentCount[0]);
        } 

        let status = await db
            .collection("posts")
            .aggregate([
                {
                    $addFields: {
                        id: {
                            $toObjectId: "$userid",
                        },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "id",
                        foreignField: "_id",
                        as: "output",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        username: {
                            $arrayElemAt: ["$output.username", 0],
                        },
                        status: 1,
                        date: 1,
                        dateConvert: {
                            $dateFromString: {
                               dateString: '$date',
                               format: "%d/%m/%Y %H:%M"
                            }
                         },
                    },
                },
                {
                    $match: {
                        $or: [
                            {
                                username: {
                                    $regex: searchStatus,
                                    $options: "i",
                                },
                            },
                            { date: { $regex: searchStatus, $options: "i" } },
                            { title: { $regex: searchStatus, $options: "i" } },
                            { status: { $regex: searchStatus, $options: "i" } },
                        ],
                    },
                },
                {
                    $sort: {
                        dateConvert: -1,
                    },
                },
                {
                    $skip: perPage * page - perPage,
                },
                {
                    $limit: perPage,
                },
            ])
            .toArray();

        res.render("statusUser", {
            username: accUser,
            searchStatus: searchStatus,
            role: role,
            statusLists: status,
            current: page,
            pages: Math.ceil(count / perPage),
            constant: constant,
            searchholder: searchStatus
        });
    }
});

router.get("/status/create", ensureAuthenticated, (req, res) => {
    const loggedUser = req.session.passport.user.username;
    res.render("createStatus", {loggedUser: loggedUser});
});

router.post("/status/create", (req, res) => {
    const db = database.getDb();
    const accID = req.session.passport.user.id;
    const loggedUser = req.session.passport.user.username;
    const { title, status } = req.body;
    const date = new Date();
    const convertDate = moment(date).format("DD/MM/YYYY HH:mm");
    const cusStatus = {
        userid: accID,
        date: convertDate,
        title: title,
        status: status,
    };
    const checkNullTitle = checkNull(title);
    const checkNullStatus = checkNull(status);
    const blankTitle = checkBlank(title);
    const blankStatus = checkBlank(status);

    if (checkNullTitle) {
        return res.render("createStatus", {
            titleholder: title,
            statusholder: status,
            msg: "Please fill title field",
            loggedUser: loggedUser
        });
    }

    if (checkNullStatus) {
        return res.render("createStatus", {
            titleholder: title,
            statusholder: status,
            msg: "Please fill status field",
            loggedUser: loggedUser
        });
    }

    if (!blankTitle || !blankStatus) {
        return res.render("createStatus", {
            msg: "Title and status must not blank",
            loggedUser: loggedUser
        });
    }

    db.collection("posts").insertOne(cusStatus).then(res.redirect("/status"));
});

router.get("/status/edit/:id", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const id = req.params.id;
    const accID = req.session.passport.user.id
    const loggedUser = req.session.passport.user.username;

    if (!database.ObjectId.isValid(id)) {
        return res.render("error", {
            errmsg: "You do not have permission to access this page",
        });
    }

    db.collection("posts")
        .findOne(
            { _id: database.ObjectId(id) },
            {
                projection: {
                    _id: 1,
                    title: 1,
                    status: 1,
                    userid: 1,
                },
            }
        )
        .then((post) => {
            if (post.userid != accID || post == null) {
                return res.render("error", {
                    errmsg: "You do not have permission to access this page",
                });
            }
            res.render("editStatus", {
                loggedUser: loggedUser,
                id: post._id,
                titleholder: post.title,
                statusholder: post.status,
            });
        });
});

router.post("/status/edit/:id", function (req, res) {
    const db = database.getDb();
    const { title, status } = req.body;
    const id = req.params.id;
    const checkNullTitle = checkNull(title);
    const checkNullStatus = checkNull(status);
    const blankTitle = checkBlank(title);
    const blankStatus = checkBlank(status);
    const loggedUser = req.session.passport.user.username;

    if (checkNullTitle) {
        return res.render("editStatus", {
            id: id,
            titleholder: title,
            statusholder: status,
            msg: "Please fill title field",
            loggedUser: loggedUser
        });
    }

    if (checkNullStatus) {
        return res.render("editStatus", {
            id: id,
            titleholder: title,
            statusholder: status,
            msg: "Please fill status field",
            loggedUser: loggedUser
        });
    }

    if (!blankTitle || !blankStatus) {
        return res.render("editStatus", {
            id: id,
            msg: "Title and status must not blank",
            loggedUser: loggedUser
        });
    }

    db.collection("posts")
        .findOneAndUpdate(
            { _id: database.ObjectId(id) },
            { $set: { title: title, status: status } }
        )
        .then(res.redirect("/status"));
});

router.get("/status/view/:id", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const id = req.params.id;
    const loggedUser = req.session.passport.user.username;

    db.collection("posts")
        .findOne(
            { _id: database.ObjectId(id) },
            {
                projection: {
                    _id: 1,
                    title: 1,
                    status: 1,
                    userid: 1,
                },
            }
        )
        .then((post) => {
            res.render("viewStatus", {
                loggedUser: loggedUser,
                id: post._id,
                titleholder: post.title,
                statusholder: post.status,
            });
        });
});

router.post("/status/delete/:id", ensureAuthenticated, (req, res) => {
    const db = database.getDb();
    const id = req.params.id;

    if (!database.ObjectId.isValid(id)) {
        return res.render("error", {
            errmsg: "You do not have permission to access this page",
        });
    }

    db.collection("posts")
        .deleteOne({ _id: database.ObjectId(id) })
        .then(res.redirect("/status"));
});

module.exports = router;
