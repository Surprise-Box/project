var express = require('express');

var app = express();


app.use('/static', express.static('static'));

app.set('view engine', 'ejs');

app.get('/',function (req, res) {
    res.render('index');
});

app.get('/information',function (req, res) {
    res.render('information');
});

app.get('/sign',function (req, res) {
    res.render('sign');
});

app.listen(8000);