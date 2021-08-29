const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();
const port = 3000;
const mongoConnect = require("../src/database").mongoConnect;
const getDb = require("../src/database").getDb; // Just attach the function name to the variable

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

app.use(
    session({
        secret: "mysupersecrect",
        resave: true,
        saveUninitialized: true,
    })
);

function checkLength(val){
    // Check length in Username, Password and Password Comfirm
    if (val.length < 6) {
        return true;
    } else {
        return false;
    }
}

function checkUpscale(val){
    // Check if there is a uppscale letter in password
    if (val.search(/[A-Z]/) < 0) {
        return true;
    } else {
        return false;
    }
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.error = "Login to view this page";
    res.redirect("/login");
}

app.use(passport.initialize());
app.use(passport.session());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/login", function (req, res) {
    // If user is already logged in, then redirect
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    res.render("login", { msg: req.session.error });
});

app.get("/signup", (req, res) => {
    // If user is already logged in, then redirect
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    res.render("signup");
});

app.post("/signup", function (req, res) {
    const db = getDb();
    const username = req.body.username;
    const password = req.body.password;
    const passwordCfm = req.body.passwordCfm;
    const checkUsername = checkLength(username);
    const checkPassword = checkLength(password);
    const checkPasswordCfm = checkLength(passwordCfm);
    const checkUps = checkUpscale(password);

    if(checkUsername){
        return res.render('signup', {usernameholder: username, msg: 'Username Not enough 6 letters'})
    }

    if(checkPassword){
        return res.render('signup', {usernameholder: username, msg: 'Passsword Not enough 6 letters'})
    }

    if(checkPasswordCfm){
        return res.render('signup', {usernameholder: username, msg: 'Passsword Comfirm Not enough 6 letters'})
    }

    if(checkUps){
        return res.render('signup', {usernameholder: username, msg: 'Password require 1 upscale letter'})
    }

    // Check password and password comfirm
    if (password == passwordCfm) {
        db.collection("users")
            .findOne({ username })
            .then((user) => {
                //check user already in DB or not
                if (!user) {
                    return bcrypt.genSalt(10)
                } else {
                    return res.render("signup", {
                        usernameholder: username,
                        msg: "Username already exist",
                    });
                }
            }).then((salt) => {
                // Hash password
                return bcrypt.hash(password, salt);
            }).then((hash) => {
                let cusAcc = { username: username, password: hash };
                // Save user info to DB
                db.collection("users").insertOne(cusAcc);
                passport.authenticate("local")(req,res,function () {
                    res.redirect("/");
                });
            });;
    } else {
        return res.render("signup", {
            usernameholder: username,
            msg: "Password and Password Comfirm not match",
        });
    }
});

app.post("/login", function (req, res, next) {
    const username = req.body.username;
    const password = req.body.password;
    const checkUsername = checkLength(username);
    const CheckPassword = checkLength(password);
    const checkUps = checkUpscale(password);

    if(checkUsername){
        return res.render('login',{usernameholder: username, msg: 'Username not enough 6 letters'})
    }

    if(CheckPassword){
        return res.render('login',{usernameholder: username, msg: 'Password not enough 6 letters'})
    }

    if(checkUps){
        return res.render('login', {usernameholder: username, msg: 'Password require 1 upscale letter'})
    }

    passport.authenticate("local", function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Display message
            msg = info.message;
            return res.render("login", { msg: msg });
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect("/");
        });
    })(req, res, next);
});

app.get("/", ensureAuthenticated, function (req, res) {
    const username = req.session.passport.user;
    res.render("index", { username: username });
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect('/login');
});

mongoConnect(() => {
    app.listen(port);
});
