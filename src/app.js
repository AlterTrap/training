const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render('login');
});

app.post('/login', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    if (username == '123' && password == '123') {
        res.render('index', { username: username, password: password });
    }
});

// app.get('/index', function (req, res) {
//     // res.render('index', {username: username, password: password});
// });

app.listen(8080);
