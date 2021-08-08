const mongodb = require('mongodb');
const express = require('express');
const path = require('path');

const app = express()
const port = 3000
const mongoConnect = require('../src/database').mongoConnect;
const getDb = require('../src/database').getDb;

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
    const cusAcc = {username: username, password: password}
    const db = getDb();
    if (password == passwordCfm) {
        db.collection('users').insertOne(cusAcc);
        return res.redirect('/index?username=' + username +'&&password=' + password)
    }
});

app.post('/login', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    if (username == '123' && password == '123') {
        res.redirect('/index?username=' + username +'&&password=' + password)
    }
});

app.get('/index', function (req, res) {
    const username = req.query.username
    const password = req.query.password
    res.render('index', {username: username, password: password});
});

mongoConnect(() => {
    app.listen(port);
  });
