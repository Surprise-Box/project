var index = require('../index');
var should = require('should'),
    supertest = require('supertest')

describe('Тесты', function(){

    it('Проверка статуса главной страницы', function(done){
        supertest('https://surprisebos.herokuapp.com')
            .get('/')
            .expect(200)
            .end(function(err, res){
                res.status.should.equal(200);
                done();
            });

    });


    it('Проверка подключения к бд', function(done){
        this.timeout(5000);
        supertest('https://surprisebos.herokuapp.com')
            .get('/connect')
            .expect(200)
            .end(function(err, res){
                res.status.should.equal(200);
                done();
            });
    });

    // it('Наличие 2 подарка в бд', function(done){
    //     this.timeout(50000);
    //     supertest('https://surprisebos.herokuapp.com')
    //         .get('/gifts/2/')
    //         .expect(200)
    //         .end(function(err, res){
    //             res.status.should.equal(200);
    //             done();
    //         });
    //
    // });

    it('Проверка формы выбора подарка', function(done){
        this.timeout(5000);
        supertest('https://surprisebos.herokuapp.com')
            .post('/yourgifts')
            .type('form')
            .field('recipient','Любимому')
            .field('hobby','Книголюб')
            .field('celebration','День рождения')
            .redirects(1)
            .expect(200)
            .end(function(err, res){
                res.status.should.equal(200);

                done();
            });

    });



    it('Проверка кнопки выхода', function(done){
        supertest('https://surprisebos.herokuapp.com')
            .post('/out')
            .type('form')
            .redirects('/')
            .expect(200)
            .end(function(err, res){
                res.status.should.equal(200);

                done();
            });


    });



    var Cookies;
    it('Вход в систему c верным логином и паролем', function(done) {
        supertest('https://surprisebos.herokuapp.com')
            .post('/')
            .type('form')
            .send({email: 'grigor777001@yandex.ru', password: 'grigor'})
            .end(function(err, res) {
                if (err) done(err);
                Cookies = res.headers['set-cookie'];
                //console.log(Cookies);
                res.header['location'].should.equal('/');
                done();
            });
    });








     it('Проверка времени < 500ms', function(done){
          this.timeout(500);
          setTimeout(done, 300);
        });


});
