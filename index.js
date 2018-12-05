var express = require('express');
const bodyParser = require("body-parser");
const pg = require('pg');
var cookieParser = require('cookie-parser');
var app = express();

const config ={
 	user: 'postgres',
 	database: 'Surprise_Box',
 	password: 'Qwe1024rty',
 	port: 5432
};

const pool = new pg.Pool(config);



const urlencodedParser = bodyParser.urlencoded({extended: false});

app.use(cookieParser());

app.use('/static', express.static('static'));

app.set('view engine', 'ejs');


var bcrypt = require('bcrypt');








app.get('/',function (req, res) {
    var obj ={
        email: req.cookies.email

    };


    res.render('index', {obj: obj});



});

app.post("/", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400);
    if(!req.body.username) {
        pool.connect(function (err, client, done) {
            client.query('select * from client where client.email = $1', [req.body.email], function (err, result) {
                if (result.rows.length != 0) {
                    if (bcrypt.hashSync(req.body.password, result.rows[0].salt) == result.rows[0].password) {
                        res.cookie('name', result.rows[0].name, {expires: new Date(Date.now() + 300000000), httpOnly: true});
                        res.cookie('email', req.body.email, {expires: new Date(Date.now() + 300000000), httpOnly: true});
                        res.cookie('user', result.rows[0].super_user, {expires: new Date(Date.now() + 300000000), httpOnly: true});
                        done();
                        res.redirect('/');

                    } else { res.redirect('/errorpassword');}
                }
            });
        });
                    }


if(req.body.username){
     pool.connect(function (err, client, done) {
         if (err) console.log('не работает')
         else {
             client.query('select id_client from client where client.email = $1', [req.body.email], function (err, result) {
                    if (result.rows.length == 0) {
                        var salt = bcrypt.genSaltSync(10);
                        var passwordToSave = bcrypt.hashSync(req.body.password, salt)
             client.query('insert into client(name,surname,email,password,bonus,super_user,salt) values($1,$2,$3,$4,0,false,$5);', [req.body.username, req.body.surname, req.body.email, passwordToSave, salt ], function (err, result) {
                  res.cookie('name', req.body.username, {expires: new Date(Date.now() + 300000000), httpOnly: true});
                  res.cookie('email', req.body.email, {expires: new Date(Date.now() + 300000000), httpOnly: true});

                 done();
                 res.redirect('/');
             });
             } else {
                    res.redirect('/error');

             }
             });
         }
         });

     }

});


app.get('/contacts',function (req, res) {
     var obj ={
        email: req.cookies.email
    };
    res.render('contacts', {obj: obj});
});

app.get('/profile',function (req, res) {
     var obj ={
        email: req.cookies.email,
         user: req.cookies.user
    };
     if(req.cookies.email !== undefined) {
         res.render('profile', {obj: obj});
     }
});

app.get('/gifts',function (req, res) {

    pool.connect(function (err, client, done) {
         if (err) {
             console.log('не работает')
         }
         else {
             client.query('select * from gifts', function (err, result) {

                 done();
                 res.render('gifts',{gifts:result.rows,email: req.cookies.email});
             });
         }
    });
});
app.post('/buy',function (req, res){


        res.redirect('/buy');
});


app.post('/out',function (req, res){
     res.clearCookie('name');
        res.clearCookie('email');
        res.clearCookie('user');

        res.redirect('/');
});

app.get('/error',function (req, res) {

    res.render('error');
});

app.get('/buy',function (req, res) {

    res.render('buy');
});
app.get('/update',function (req, res) {

     pool.connect(function (err, client, done) {
            if (err) console.log('не работает')
            else {
                client.query('select * from recipient',  function (err, result) {

                    var recipient = result.rows;
                    client.query('select * from hobbies',  function (err, result){

                        done();
                        if (req.cookies.user == 'true') {
                            res.render('update', {email: req.cookies.email, recipient: recipient, hobby: result.rows});
                        }
                        });
                });
            }
        });


});

app.post('/updategifts', urlencodedParser, function(req, res){
    if(!req.body) return res.sendStatus(400);
   console.log(req.body);

   if (!req.body.action){ var action = false ;} else{var action = true;}
        pool.connect(function (err, client, done) {
            if (err) console.log('не работает')
            else {
                client.query('insert into gifts(name,price,description,bonus,photo,action) values($1,$2,$3,$4,$5,$6);', [req.body.name, req.body.price, req.body.description, req.body.bonus, req.body.photo, action], function (err, result) {
                  client.query('select id_gifts from gifts where name = $1 and description = $2',[req.body.name, req.body.description],  function (err, result) {
                      var id_gifts = result.rows[0].id_gifts;
                      var recipient = 0;
                      for (i = 0; i < req.body.recipient.length; i++) {
                          console.log('///////');
                          console.log(id_gifts);
                          console.log('///////');
                          recipient = req.body.recipient[i];
                          client.query('insert into gifts_recipient(id_gifts, id_recipient) values($1,$2);', [id_gifts, recipient], function (err, result) { if (err) console.log('не работает')});
                          console.log(req.body.recipient[i]);
                      }
                      done();
                      res.redirect('/update');
                  });
                });
            }
        });


});

app.get('/errorpassword',function (req, res) {

    res.render('errorpassword');
});
app.listen(8000);
console.log('Сервер запущен');