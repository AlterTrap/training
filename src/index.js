const express = require('express');
const path = require('path');
const bcrypt = require("bcrypt");
const session = require('express-session')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express()
const port = 3000
const mongoConnect = require('../src/database').mongoConnect;
const getDb = require('../src/database').getDb; // Just attach the function name to the variable 

passport.use(
    new LocalStrategy({usernameField : 'username'},function(username,password,done) {
            const db = getDb();
            //match user
            db.collection('users').findOne({username: username})
            .then((user)=>{
                if(!user) {
                    return done(null,false,{message: 'User not exist'});
            }
             //match pass
             bcrypt.compare(password,user.password,(err,isMatch)=>{
                 if(err) throw err;

                 if(isMatch) {
                     return done(null,user);
                 } else {
                     return done(null,false,{message: 'Password incorrect'});
                 }
             })
            })
            .catch((err)=> {console.log(err)})
    })
    
)

passport.serializeUser((user, done) => {
    console.log('Inside serializeUser callback. User id is save to the session file store here')
    return done(null, user.username);
});
passport.deserializeUser(function(username, done) {
    const db = getDb();
    db.collection('users').findOne({username: username}, function(err, user) {
        return done(err, user);
    });
}); 

app.use(session({
    secret: 'mysupersecrect',
    resave: true,
    saveUninitialized: true
}));

function ensureAuthenticated (req,res,next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.render('login', {msg: 'please login to view this resource'});
}

app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', function (req, res, next) {
    // If user is already logged in, then redirect
    if(req.isAuthenticated()){
        return res.redirect('/index');
    }
    res.render('login');
});

app.get('/signup', (req, res, next) => {
    // If user is already logged in, then redirect
    if(req.isAuthenticated()){
        return res.redirect('/index');
    }
    res.render('signup');
  });

app.post('/signup', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const passwordCfm = req.body.passwordCfm;
    const db = getDb();
    
    // Check if there is a uppscale letter in password
    if(password.search(/[A-Z]/) < 0){
        return res.render('signup', {usernameholder: username, msg: 'Password require one letter is uppercase'})
    }

    // Check length in Username, Password and Password Comfirm
    if (username.length < 6) {
        return res.render('signup', {usernameholder: username, msg: 'Username not enough 6 letters'})
    }
    
    if(password.length < 6) {
        return res.render('signup', {usernameholder: username, msg: 'Password not enough 6 letters'})
    }
    
    if(passwordCfm.length < 6){
        return res.render('signup', {usernameholder: username, msg: 'Password comfirm not enough 6 letters'})
    }

    // Check password and password comfirm
    if (password == passwordCfm) {

        db.collection('users').findOne({username})
        .then(user => {
            //check user already in DB or not
            if (!(user)) {
                bcrypt.genSalt(10)
                .then(salt => {
                    // Hash password
                    return bcrypt.hash(password, salt)})
                .then(hash => {
                    let cusAcc = {username: username, password: hash}
                    // Save user info to DB
                    db.collection('users').insertOne(cusAcc);
                    return res.redirect('/index?username=' + username)
                })
            } else {
                return res.render('signup',{usernameholder: username, msg: 'Username already exist'});
            }
        })

    } else {
        return res.render('signup',{usernameholder: username, msg: 'Password and Password Comfirm not match'});
    }
});

app.post('/login', function (req, res, next) {
    const username = req.body.username;
    const password = req.body.password;

    // Check length in Username and Password
    if (username.length < 6) {
        return res.render('login', {usernameholder: username, msg: 'Username not enough 6 letters'})
    }
    
    if(password.length < 6) {
        return res.render('login', {usernameholder: username, msg: 'Password not enough 6 letters'})
    }

    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
          // Display message
          msg = info.message;
          return res.render('login', {msg: msg});
        }
        req.logIn(user, function(err) {
        if (err) { return next(err); }
            return res.redirect('/index');
        });
      })(req, res, next);
    // // Find info user in DB
    // db.collection('users').findOne({username})
    // .then(user => {
    //     if (!user) return {msg: "user not exist"}

    //     // Compare Password in client with password DB
    //     bcrypt.compare(password, user.password, function(error, result){
    //         if (error) {
    //             return res.render('login', {usernameholder: username, msg: 'Password not enough 6 letters'})
    //         }
            
    //         if (result) {
    //             return res.redirect('/index?username=' + username)
    //         } else {
    //             return res.render('login',{usernameholder: username, msg: 'Username or Password not correct'})
    //         }
    //     })
    // })
});

app.get('/index',ensureAuthenticated, function (req, res) {
    const username = req.session.passport.user;
    res.render('index', {username: username});
});

mongoConnect(() => {
    app.listen(port);
});
