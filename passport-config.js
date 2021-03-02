const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const { password } = require('./password.js')
const url = password;

var userPassword = null
var userEmail = null

function initialize(passport, getUserbyEmail, getUserbyId) {
    const authenticateUser = async (email, password, done) => {


        console.log(getUserbyEmail)

        // await MongoClient.connect(url, function (err, client) {
        //     assert.equal(null, err);
        
        //     const db = client.db("login");
        
        //     db.collection('users').find({ email: email }).forEach(function (document) {
        //         userEmail = document.email;
        //         userPassword = document.password;
        //     });
        //     client.close();
        // })

        // console.log(userPassword)
        // console.log(userEmail)


        function getUserInfo(whatInfo) {
            MongoClient.connect(url, function (err, client) {
                assert.equal(null, err);

                const db = client.db("login");

                db.collection('users').find({ email: email }).forEach(function (document) {

                    if (whatInfo === email) {
                        const x = document.email;
                        console.log(x)
                        client.close();
                        return x;
                    } else {
                        const x = document.password;
                        client.close();
                        console.log(x)
                        return x;
                    }
                });
                client.close();
                return null;
            })
        }

        if (getUserInfo(email) === null) {
            return done(null, false, { message: "User doesn't exist" })
        }

        try {
            const x = getUserInfo(password)
            console.log(getUserInfo(password))
            console.log(x)
            if (await bcrypt.compare(password, x)) {
                return done(null, user)
            } else {
                return done(null, false), { message: 'Password incorrect' }
            }
        } catch (e) {
            return done(e)
        }
    }

    passport.use(new LocalStrategy({ usernameField: 'email' },
        authenticateUser))

    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        return done(null, getUserbyId(id))
    })
}
module.exports = initialize
