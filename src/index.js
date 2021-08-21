const mongodb = require('mongodb');
const express = require('express');
const path = require('path');
const bcrypt = require("bcrypt");

const app = express()
const port = 3000
const mongoConnect = require('../src/database').mongoConnect;
const getDb = require('../src/database').getDb; // Just attach the function name to the variable 

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', function (req, res) {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
  });

app.post('/signup', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const passwordCfm = req.body.passwordCfm;
    const db = getDb();
    let hash = '';
    
    if(password.search(/[A-Z]/) < 0){
        res.render('signup', {msg: 'Password require one letter is uppercase'})
    }

    // Check length in Username, Password and Password Comfirm
    if (username.length < 6) {
        res.render('signup', {msg: 'Username not enough 6 letters'})
    }
    
    if(password.length < 6) {
        res.render('signup', {msg: 'Password not enough 6 letters'})
    }
    
    if(passwordCfm.length < 6){
        res.render('signup', {msg: 'Password comfirm not enough 6 letters'})
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
                    return hash = bcrypt.hash(password, salt)})
                .then(hash => {
                    let cusAcc = {username: username, password: hash}
                    // Save user info to DB
                    db.collection('users').insertOne(cusAcc);
                    return res.redirect('/index?username=' + username)
                })
            } else {
                res.render('signup',{msg: 'Username already exist'});
            }
        })

    } else {
        res.render('signup',{msg: 'Password and Password Comfirm not match'});
    }
});

app.post('/login', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const db = getDb();
    let user = {};

    // Check length in Username and Password
    if (username.length < 6) {
        res.render('signup', {msg: 'Username not enough 6 letters'})
    }
    
    if(password.length < 6) {
        res.render('signup', {msg: 'Password not enough 6 letters'})
    }

    // Find info user in DB
    db.collection('users').findOne({username})
    .then(user => {
        if (!user) return {msg: "user not exist"}

        // Compare Password in client with password DB
        bcrypt.compare(password, user.password, function(error, result){
            if (error) {
                throw error;
            }
            
            if (result) {
                res.redirect('/index?username=' + username)
            } else {
                res.render('login',{msg: 'Username or Password not correct'})
            }
        })
    })
});

app.get('/index', function (req, res) {
    const username = req.query.username
    const password = req.query.password
    res.render('index', {username: username});
});

mongoConnect(() => {
    app.listen(port);
  });
