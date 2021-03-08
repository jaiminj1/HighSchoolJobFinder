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

    if (req.user.isVerified === false) {
        res.render("emailConfirmation", { email: req.user.email, firstname: req.user.firstname, lastname: req.user.lastname, accountType, school: req.user.School, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified });
    } else {
        res.render("portal", { email: req.user.email, firstname: req.user.firstname, lastname: req.user.lastname, school: req.user.School });
    }
});

//presignup page
app.get("/preregister", function (req, res) {
    res.render("preregister", { error: false });
});

var accountType;

//presignup function
app.post("/preregister", function (req, res) {
    accountType = req.body.accounttype
    res.render("register", { error: false });
    //res.render("register", { error: false, accountType: req.body.accounttype});
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
    var verificationCode = "ABCD"

    if (password != confirmPassword) {
        console.log(password)
        console.log(confirmPassword)
        return res.render("register", { error: "passwords don't match" });
    }

    User.register(new User({ email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType: accountType, school: req.body.School, verificationCode: verificationCode }),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("register");
            }

            //res.render("emailConfirmation", { email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType, school: req.body.School, verificationCode});
            passport.authenticate("local")(
                req, res, function () {
                    res.render("emailConfirmation", { email: email, firstname: req.user.firstname, lastname: req.user.lastname, accountType, school: req.user.School, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified });
                });
        });
});

app.get("/emailConfirmation", function (req, res) {
    res.render("emailConfirmation", { error: false });
});

app.post("/emailConfirmation", function (req, res) {
    userCode = req.body.code

    if (userCode != req.user.verificationCode) {
        console.log(userCode)
        console.log(req.user.verificationCode)
        return res.render("emailConfirmation", { error: "codes don't match" });
    } else {
        // Verify and save the user
        User.updateOne({ _id: req.user._id }, { isVerified: true }, function (err, docs) {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Updated Docs : ", docs);
            }
        });


        // req.user.isVerified = true;
        // User.save(function (err) {
        //     // if (err) { return res.status(500).send({ msg: err.message }); }
        //     // res.status(200).send("The account has been verified. Please log in.");
        // });
    }

    res.render("portal", { email: req.user.email, firstname: req.user.firstname, lastname: req.user.lastname, accountType, school: req.user.School, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified });

    //res.render("register", { error: false, accountType: req.body.accounttype});
});


//login page
app.get("/login", function (req, res) {

    if (req.isAuthenticated()) {
        if (req.user.isVerified = false) {
            res.render("emailConfirmation", { email: email, firstname: req.user.firstname, lastname: req.user.lastname, accountType, school: req.user.School, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified });
        }
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

// Make sure the user has been verified
//if (!user.isVerified) return res.render("login", { error: "passwords don't match" }); 

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