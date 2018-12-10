var express = require('express');
const bodyParser = require("body-parser");
require('dotenv').load();
const pg = require('pg');
var cookieParser = require('cookie-parser');
var app = express();



const config ={
    host:process.env.DB_Host,
 	user: process.env.DB_Name,
 	database: process.env.DB_DB,
 	password: process.env.DB_Password,
 	port: 5432,
    ssl:true
};

const pool = new pg.Pool(config);



const urlencodedParser = bodyParser.urlencoded({extended: false});

app.use(cookieParser());

app.use('/static', express.static('static'));
app.use('/gifts/:id', express.static(__dirname + '/static'));

app.set('view engine', 'ejs');



var bcrypt = require('bcryptjs');



app.get('/',function (req, res) {
    var obj ={
        email: req.cookies.email

    };


    res.render('index', {obj: obj});



});

app.post('/', urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400);
    if(!req.body.username) {
        pool.connect(function (err, client, done) {
            client.query('select * from client where client.email = $1', [req.body.email], function (err, result) {
                if (result.rows.length != 0) {
                    console.log('1',req.body.password,'2');
                    if (bcrypt.hashSync(req.body.password, result.rows[0].salt) == result.rows[0].password) {
                        res.cookie('name', result.rows[0].name, {expires: new Date(Date.now() + 14400000), httpOnly: true});
                        res.cookie('email', req.body.email, {expires: new Date(Date.now() + 14400000), httpOnly: true});
                        res.cookie('user', result.rows[0].super_user, {expires: new Date(Date.now() + 14400000), httpOnly: true});

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
                        var passwordToSave = bcrypt.hashSync(req.body.password, salt);
             client.query('insert into client(name,surname,email,password,bonus,super_user,salt,phone) values($1,$2,$3,$4,0,false,$5,$6);', [req.body.username, req.body.surname, req.body.email, passwordToSave, salt, req.body.phone ], function (err, result) {
                 res.cookie('name', req.body.username, {expires: new Date(Date.now() + 14400000), httpOnly: true});
                  res.cookie('email', req.body.email, {expires: new Date(Date.now() + 14400000), httpOnly: true});

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

app.post('/contacts', urlencodedParser, function (req, res){
 var obj ={
     name: req.body.name,
     email: req.body.email,
     phone: req.body.phone,
     message: req.body.message,
 }
 console.log(obj);
 res.redirect('/contacts');


});

app.post('/deletereviews', urlencodedParser, function (req, res){
 pool.connect(function(err,client,done){
     client.query('delete from gifts_reviews where id_reviews=$1',[req.body.id],function(err, result) {
         client.query('delete from reviews where id_reviews=$1', [req.body.id], function (err, result) {

             done();
             res.redirect('/reviews');
         });
     });
 });


});

 app.post('/okreviews', urlencodedParser, function (req, res){
 pool.connect(function(err,client,done){
     client.query('update reviews set status=true where id_reviews=$1',[req.body.id],function(err, result){

            done();
            res.redirect('/reviews');
     });
 });


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
             console.log('не работает'+ err);
         }
         else {
             client.query('select hobby from hobbies', function (err, result) {
                 var hobby = result.rows;
                 client.query('select name from celebration', function (err, result) {
                     var name = result.rows;

                     client.query('select position from recipient', function (err, result) {
                         var position = result.rows;
                         done();
                         res.render('gifts', {hobby: hobby, celebration: name, recipient: position, email: req.cookies.email});
                     });
                 });
             });
         }
    });
});

app.get('/gifts/:id',  function (req, res) {
    var id = req.params.id;

         pool.connect(function (err, client, done) {
         if (err) {
             console.log('не работает')
         }
         else {
             client.query('select * from gifts where id_gifts=$1',[id], function (err, result) {
                 console.log(err);
                gift=result.rows[0];
                    client.query('select reviews.review,client.email from reviews,client where reviews.id_client=client.id_client and status=true and id_reviews in (select id_reviews from gifts_reviews where id_gifts=$1)',[id], function(err, result){

                 done();
                 res.render('onegift',{gifts: gift,email: req.cookies.email, name: req.cookies.name, reviews: result.rows});
                });
             });
         }
    });


});

app.get('/reviews', function(req,res){
       pool.connect(function (err, client, done) {
         if (err) {
             console.log('не работает')
         }
         else {
             client.query('select reviews.id_reviews, reviews.review, gifts_reviews.id_gifts,client.email  ' +
                 'from reviews,client,gifts_reviews  ' +
                 'where status=false and ' +
                 'reviews.id_reviews=gifts_reviews.id_reviews and ' +
                 'reviews.id_client=client.id_client', function (err, result) {
                 done();
                 res.render('reviews',{email: req.cookies.email, name: req.cookies.name, reviews: result.rows});

             });
         }
    });
});

app.post('/yourgifts', urlencodedParser, function (req, res){
    pool.connect(function(err,client,done){
        if (err){console.log('не работает')} else
        { if (req.body.hobby !== 'Не выбрано') { console.log(req.body.hobby);

                client.query('select * from gifts where id_gifts in (select gifts.id_gifts from gifts,recipient,celebration,hobbies,gifts_recipient,gifts_celebration,gifts_hobbies ' + 'where recipient.position=$1 and ' +
                'celebration.name=$2 and ' +
                'hobbies.hobby=$3 and ' +
                'gifts_recipient.id_recipient = recipient.id_recipient and ' +
                'gifts_celebration.id_celebration = celebration.id_celebration and ' +
                    'gifts_hobbies.id_hobbies = hobbies.id_hobbies and '+
                    'gifts.id_gifts = gifts_hobbies.id_gifts and ' +
                'gifts.id_gifts = gifts_celebration.id_gifts and ' +
                'gifts.id_gifts = gifts_recipient.id_gifts)', [req.body.recipient, req.body.celebration, req.body.hobby], function (err, result) {
                                console.log(result.rows);
                                done();
                                res.render('yourgifts',{gifts: result.rows, email:req.cookies.email,recipient:req.body.recipient, celebration:req.body.celebration, hobby:req.body.hobby});
                        });


        }else{
            client.query('select * from gifts where id_gifts in (select gifts.id_gifts from gifts,recipient,celebration,gifts_recipient,gifts_celebration where recipient.position=$1 and ' +
                'celebration.name=$2 and ' +
                'gifts_recipient.id_recipient = recipient.id_recipient and ' +
                'gifts_celebration.id_celebration = celebration.id_celebration and ' +
                'gifts.id_gifts = gifts_celebration.id_gifts and ' +
                'gifts.id_gifts = gifts_recipient.id_gifts)', [req.body.recipient, req.body.celebration], function (err, result) {



                                done();
                                res.render('yourgifts',{gifts: result.rows, email:req.cookies.email,recipient:req.body.recipient, celebration:req.body.celebration, hobby:req.body.hobby});



                        });






        }
        }


    });

});

app.post('/buy', urlencodedParser, function (req, res){
    let options={
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }
    pool.connect(function(err,client,done){
        if (err){console.log('не работает')} else
        {
            client.query('select id_client from client where email=$1',[req.cookies.email],function(err,result) {
                var id_client =result.rows[0].id_client;
                client.query('select id_gifts from gifts_client where id_client=$1 and id_gifts=$2 and position = true',[id_client,req.body.id_gift],function(err,result) {

                    if (result.rows[0] == undefined){
                    client.query('insert into gifts_client(id_client,id_gifts,position,date) values($1,$2,true,$3);', [id_client, req.body.id_gift, new Date().toLocaleString('ru', options)], function (err, result) {
                        console.log(err);


                    });
                    }
                });
            done();
                        res.redirect('/buy');
            });
        }


    });

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

    let options={
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }

    pool.connect(function(err,client,done){
        if (err){console.log('не работает')} else
        {
            client.query('select id_client from client where email=$1',[req.cookies.email],function(err, result){
             client.query('select * from gifts_client where id_client=$1 and position=$2', [result.rows[0].id_client, true ], function (err, result) {
                for (i=0;i<result.rows;i++) {
                    if (result.rows[i].date - new Date().toLocaleString('ru', options) > 1) {
                        client.query('delete from gifts_client where id_gifts_client=$1', [result.rows[i].id_client_gifts], function (err, result) {
                        });
                    }

                }

             });
             client.query('select gifts.name,gifts.price,gifts.photo,gifts.id_gifts from gifts,gifts_client where gifts.id_gifts = gifts_client.id_gifts and gifts_client.position=true',function(err,result){
                    done();
                    res.render('buy',{gift:result.rows,email: req.cookies.email});
                });

             });
             }



    });


});

app.post('/buygift', urlencodedParser, function(req, res){
    var id = req.body.id_gift;

    pool.connect(function(err, client, done){
       if (err){console.log('Не работает')} else
       {
           client.query('update gifts_client set position=false where gifts_client.id_gifts=$1 ',[id],function(err,result){
               if (err){console.log('Не работает')}
                done();
                res.redirect('/buy');
           });
       }
    });

});

app.get('/update',function (req, res) {

     pool.connect(function (err, client, done) {
            if (err) console.log('не работает')
            else {
                client.query('select * from recipient',  function (err, result) {

                    var recipient = result.rows;
                    client.query('select * from hobbies',  function (err, result){
                        var hobby = result.rows;
                        client.query ('select * from celebration', function(err, result){

                        done();
                        if (req.cookies.user == 'true') {
                            res.render('update', {email: req.cookies.email, recipient: recipient, hobby: hobby, celebration: result.rows});
                        }
                           });
                        });
                });
            }
        });


});

app.post('/updategifts', urlencodedParser, function(req, res){
    if(!req.body) return res.sendStatus(400);


   if (!req.body.action){ var action = false ;} else{var action = true;}
        pool.connect(function (err, client, done) {
            if (err) console.log('не работает')
            else {
                client.query('insert into gifts(name,price,description,bonus,photo,action) values($1,$2,$3,$4,$5,$6);', [req.body.name, req.body.price, req.body.description, req.body.bonus, req.body.photo, action], function (err, result) {
                  client.query('select id_gifts from gifts where name = $1 and description = $2',[req.body.name, req.body.description],  function (err, result) {
                      var id_gifts = result.rows[0].id_gifts;
                      var recipient = 0;
                      for (i = 0; i < req.body.recipient.length; i++) {

                          recipient = req.body.recipient[i];
                          client.query('insert into gifts_recipient(id_gifts, id_recipient) values($1,$2);', [id_gifts, recipient], function (err, result) { if (err) console.log('не работает')});

                      }

                       for (i = 0; i < req.body.hobby.length; i++) {

                           hobby = req.body.hobby[i];
                          client.query('insert into gifts_hobbies(id_gifts, id_hobbies) values($1,$2);', [id_gifts, hobby], function (err, result) { if (err) console.log('не работает')});

                       }
                       for (i = 0; i < req.body.celebration.length; i++) {

                          celebration = req.body.celebration[i];
                          client.query('insert into gifts_celebration(id_gifts, id_celebration) values($1,$2);', [id_gifts, celebration], function (err, result) { if (err) console.log('не работает')});

                       }
                      done();
                      res.redirect('/update');
                  });
                });
            }
        });


});

app.get('/history', function (req, res){
    pool.connect(function(err,client,done){
        if (err) console.log('не рабоате')
        else {
            client.query('select gifts.name,gifts.price,gifts.photo,gifts.id_gifts,gifts.description from gifts,gifts_client,client where gifts.id_gifts = gifts_client.id_gifts and gifts_client.position=false and client.email=$1 and client.id_client=gifts_client.id_client',[req.cookies.email],function(err,result){
                    done();
                    res.render('history',{gifts:result.rows,email: req.cookies.email});
                });
        }
    });
});

app.get('/errorpassword',function (req, res) {

    res.render('errorpassword');
});

app.post('/comment',urlencodedParser, function(req, res){
   pool.connect(function(err,client,done){
        if (err) console.log('не рабоате')
        else {
            client.query('select id_client from client where email=$1',[req.cookies.email],function(err,result){
                var id = result.rows[0].id_client;
                   client.query('insert into reviews(review, id_client,status) values($1,$2,false) returning id_reviews',[req.body.review, id], function(err, result){
                       console.log(result.rows[0].id_reviews);
                       client.query('insert into gifts_reviews(id_reviews,id_gifts) values($1,$2);',[result.rows[0].id_reviews,req.body.id_gift], function(err, result){
                            done();
                            res.redirect('/gifts/'+req.body.id_gift);

                       });
                       });
                   });
        }
    });
});

app.get('/connect', function(req, res){
    pool.connect(function (err, client, done) {
       if (err) {return res.sendStatus(404)} else {return res.sendStatus(200)}
    });
});
app.listen(process.env.PORT);
console.log('Сервер запущен');