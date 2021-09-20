const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const getDb = require('../src/database').getDb;

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

module.exports = passport;