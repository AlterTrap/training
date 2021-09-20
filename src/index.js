const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");

const app = express();
const port = 3000;
const LocalStrategy = require("passport-local").Strategy;
const mongoConnect = require("../src/database").mongoConnect;// Just attach the function name to the variable
const getDb = require('../src/database').getDb;
const index = require("./routing/index");
const authentication = require("./routing/authentication");

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

app.use(function (req, res, next) {
    if (!req.user)
        res.header(
            "Cache-Control",
            "private, no-cache, no-store, must-revalidate"
        );
    next();
});

app.use(
    session({
        secret: "mysupersecrect",
        resave: true,
        saveUninitialized: true,
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")))

app.use("/", authentication);

app.use("/", index);

mongoConnect(() => {
    app.listen(port);
});
