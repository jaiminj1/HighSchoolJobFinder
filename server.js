if (process.env.NODE_ENV != 'production') {
    require('dotenv').config()
}

var express = require("express"),
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
    res.render("portal");
    //res.render("portal", req.body.email);
});

//signup page
app.get("/register", function (req, res) {
    res.render("register");
});

//signup function
app.post("/register", function (req, res) {
    var email = req.body.email
    var password = req.body.password
    User.register(new User({ email: email }),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("register");
            }

            passport.authenticate("local")(
                req, res, function () {
                    res.render("portal");
                });
        });
});

//login page
app.get("/login", function (req, res) {
    res.render("login");
});

//login function
app.post("/login", passport.authenticate("local", {
    successRedirect: "/portal",
    failureRedirect: "/login"
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

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Running");
}); 