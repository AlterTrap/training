const express = require('express')
const path = require('path');

const app = express()
const port = 3000

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render('login');
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

app.listen(port, () => {
    console.log(`App is running on port ${port}`)
})
