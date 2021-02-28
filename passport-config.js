const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserbyEmail, getUserbyId) {
    const authenticateUser = async (email, password, done) => {
        console.log(email)
        const user = 1614404074601
        //getUserbyEmail("w@w")
        console.log(user)
        console.log(password)
        console.log(user.password)
        
        if (user == null) {
            return done(null, false, { message: "User doesn't exist" })
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false), {message: 'Password incorrect'}
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