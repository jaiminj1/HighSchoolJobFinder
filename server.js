if (process.env.NODE_ENV != 'production') {
    require('dotenv').config()
}

var express = require("express"),
    flash = require('express-flash'),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose =
        require("passport-local-mongoose"),
    User = require("./models/user");

//const bcrypt = require('bcrypt')

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// Connection URL
mongoose.connect(process.env.MONGO_CONNECT_KEY,);

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(require("express-session")({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
    usernameField: 'email'
}, User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//home page 
app.get("/", function (req, res) {
    res.render("index");
});

//portal when logged in 
app.get("/portal", isLoggedIn, function (req, res) {
    res.render("portal", { email: req.user.email, firstname: req.user.firstname, lastname: req.user.lastname, school: req.user.School });
});

//signup page
app.get("/register", function (req, res) {
    res.render("register", { error: false });
});

//signup function
app.post("/register", function (req, res) {
    var email = req.body.email
    var password = req.body.password
    var confirmPassword = req.body.confirmPassword

    if (password != confirmPassword) {
        return res.render("register", { error: "passwords don't match" });
    }

    User.register(new User({ email: email, firstname: req.body.firstname, lastname: req.body.lastname, school: req.body.School }),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("register");
            }

            passport.authenticate("local")(
                req, res, function () {
                    res.render("portal", { email: req.user.email, firstname: req.user.firstname, lastname: req.user.lastname, school: req.user.School });
                });
        });
});

//login page
app.get("/login", function (req, res) {

    if (req.isAuthenticated()) {
        res.render("portal", { email: req.user.email, firstname: req.user.firstname, lastname: req.user.lastname, school: req.user.School });
    } else {
        res.render("login", { error: req.flash('error') });
    }
});

//login function
app.post("/login", passport.authenticate("local", {
    successRedirect: "/portal",
    failureRedirect: "/login",
    failureFlash: { type: 'error', message: 'Invalid username or password.' }
}), function (req, res) {
});

//logout function 
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

app.get("/changepassword", isLoggedIn, function (req, res) {
    res.render("changepassword", { message: false });
});

app.post('/changepassword',
    // {
    //     successRedirect: "/portal",
    //     failureRedirect: "/login",
    //     failureFlash: { type: 'notFound', message: 'User not found. Please sign out and try again' },
    //     failureFlash: { type: 'error', message: 'Something went wrong.' },
    //     failureFlash: { type: 'incorrect', message: 'Incorrect password' },
    //     successFlash: { type: 'success', message: 'Your password has been changed successfully' },
    // },
    function (req, res) {
        User.findOne({ _id: req.user._id }, (err, user) => {
            // Check if error connecting
            if (err) {
                res.json({ success: false, message: err }); // Return error
            } else {
                // Check if user was found in database
                if (!user) {
                    res.render("changepassword", { message: 'User not found' });
                } else {
                    user.changePassword(req.body.currentpassword, req.body.newpassword, function (err) {
                        if (err) {
                            if (err.name === 'IncorrectPasswordError') {
                                res.render("changepassword", { message: 'Password incorrect' });
                            } else {
                                res.render("changepassword", { message: 'Unknown error occurred' });
                            }
                        } else {
                            res.render("changepassword", { message: 'Your password has been changed' });
                        }
                    })
                }
            }
        });
    });

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Running");
}); 