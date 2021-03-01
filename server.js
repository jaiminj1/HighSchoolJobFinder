if (process.env.NODE_ENV != 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const { password } = require('./password.js')
const url = password;

const initializePassport = require('./passport-config')


var emailExist = false;
var idExist = false;

initializePassport(
    // passport,
    // email => users.find(user => user.email === email),
    // id => users.find(user => user.id === id)

    passport,
    email => MongoClient.connect(url, function (err, client) {
        assert.equal(null, err);


        const db = client.db("login");

        var cursor = db.collection('users').find({ email: email });

        function iterateFunc(doc) {
            return email;
        }

        function errorFunc(error) {
            return false;
        }

        cursor.forEach(iterateFunc, errorFunc);

        client.close();
    }),
    id => MongoClient.connect(url, function (err, client) {
        console.log(id)
        assert.equal(null, err);


        const db = client.db("login");

        var cursor = db.collection('users').find({ id: id });

        function iterateFunc(doc) {
            console.log(id)
            return id;
        }

        function errorFunc(error) {
            console.log(id)
            return false;
        }

        cursor.forEach(iterateFunc, errorFunc);

        client.close();
    })
)

app.set('vie-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name })
})

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', (req, res) => {
    res.render('register.ejs')
})

app.post('/register', async (req, res) => {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        MongoClient.connect(url, function (err, client) {
            assert.equal(null, err);


            const db = client.db("login");

            db.collection('users').insertOne({
                id: Date.now().toString(),
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword
            })
                .then(function (result) {
                    // process result
                })

            client.close();
        });

        res.redirect('/login')
    } catch (error) {
        res.redirect('/register')
    }
})


// app.post('/register', async (req, res) => {

//     try {
//         const hashedPassword = await bcrypt.hash(req.body.password, 10)
//         users.push({
//             id: Date.now().toString(),
//             name: req.body.name,
//             email: req.body.email,
//             password: hashedPassword
//         })
//         res.redirect('/login')
//     } catch (error) {
//         res.redirect('/register')
//     }
//     console.log(users)
// })

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('login')
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

app.listen(3000)
