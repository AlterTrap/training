const mongodb = require('mongodb');
const express = require('express');
const path = require('path');
const bcrypt = require("bcrypt");

const app = express()
const port = 3000
const mongoConnect = require('../src/database').mongoConnect;
const getDb = require('../src/database').getDb; // gán tên hàm vào biến thôi

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
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
    if(username.length < 6 || password.length < 6){
        res.render('signup', {msg: 'username or password not enough 6 letters'})
    }
    if (password == passwordCfm) {
        db.collection('users').findOne({username})
        .then(user => {
            if(!(user)){
                bcrypt.genSalt(10, function(err, salt) {  
                    bcrypt.hash(password, salt, function(err, hash) {
                        let cusAcc = {username: username, password: hash}
                        db.collection('users').insertOne(cusAcc);
                        return res.redirect('/index?username=' + username +'&&password=' + password)
                    });
                });
            }else{
                res.render('signup',{msg: 'username already exist'});
            }
        })
    }else{
        res.render('signup',{msg: 'Password and Password Comfirm not match'});
    }
});

app.post('/login', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const db = getDb();
    let user = {};
    if(username.length < 6 || password.length < 6){
        res.render('login',{msg: "username or password not enough 6 letters"})
    }
    db.collection('users').findOne({username})
        .then(user => {
            if (!user) return {msg: "user not exist"}
                bcrypt.compare(password, user.password, function(error, result){
            if(error){
                throw error;
            }
            if(result){
                res.redirect('/index?username=' + username +'&&password=' + password)
            }else{
                res.render('login',{msg: 'not correct password'})
            }
        })
        }
    )

});

app.get('/index', function (req, res) {
    const username = req.query.username
    const password = req.query.password
    res.render('index', {username: username, password: password});
});

mongoConnect(() => {
    app.listen(port);
  });
