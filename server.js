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
jobPost = require("./models/jobpost");

//const bcrypt = require('bcrypt')
const nodemailer = require("nodemailer");
const jobpost = require('./models/jobpost');

const path = require('path');
//const fileUpload = require('express-fileupload');
const fs = require('fs');





const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_CONNECT_KEY);

var multer = require('multer')
var upload = multer({ dest: 'uploads/' })

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// Connection URL
mongoose.connect(process.env.MONGO_CONNECT_KEY,);

const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.json());

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

app.use(express.static(__dirname + "/public"));


//app.use(fileUpload());

// passport.use('employerLocal', new LocalStrategy({
//     usernameField: 'email'
// }, employerUser.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//home page 
app.get("/", function (req, res) {
    res.render("index");
});

//portal when logged in 
app.get("/portal", isLoggedIn, function (req, res) {

    // if (req.user.isVerified === false) {
    //     res.render("emailConfirmation", {
    //         email: req.user.email, firstname: req.user.firstname, lastname: req.user.lastname, accountType,
    //         school: req.user.School, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified
    //     });
    // } else {

    if (req.user.accountType == "student") {
        res.redirect("student-portal/student-findjobs");
    }
    else if (req.user.accountType == "employer") {
        res.redirect("employer-portal/employer-editprofile");
    }
    else if (req.user.accountType == "admin") {
        res.redirect("admin-portal/admin-userview");
    }
    //res.render("portal", { email: req.user.email, firstname: req.user.firstname, lastname: req.user.lastname, school: req.user.School });
    // }
});

//resources page
app.get("/resources", function (req, res) {
    res.render("resources", { error: false });
});

//help center page
app.get("/helpcenter", function (req, res) {
    res.render("helpcenter", { error: false });
});

//help center page
app.post("/helpcenter", function (req, res) {

    if (req.body.name && req.body.email && req.body.subject && req.body.message) {
        contactUs(req.body.name, req.body.email, req.body.subject, req.body.message)
        res.render("helpcenter", { error: "Message sent" });
    } else {
        res.render("helpcenter", { error: "Ensure all fields are filled in" });
    }
});

async function contactUs(name, email, subject, message) {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL, // generated ethereal user
            pass: process.env.PASSWORD, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: email, // sender address
        to: process.env.EMAIL, // list of receivers
        subject: subject, // Subject line
        text: "Message from" + name + " (" + email + ") " + ": " + message, // plain text body
        html: "<b> Message from </b>" + name + " (" + email + ") " + ": <br>" + message, // html body
    });

    console.log("Message sent: %s", info.messageId);
}

//student myapplications page
app.get("/student-portal/student-myapplications", isLoggedIn, async function (req, res) {

    var previouslyAppliedObj = []
    var v;

    for (i = 0; i < req.user.previouslyApplied.length; i++) {

        console.log("hello")

        await jobPost.findOne({ _id: req.user.previouslyApplied[i] }, (err, jobpost) => {
            // Check if error connecting
            if (err) {
                console.log("error")
                //res.json({ success: false, message: err }); // Return error
            } else {
                if (jobpost) {
                    previouslyAppliedObj[i] = jobpost
                    v++
                }
            }
        });
    }
    res.render("student-portal/student-myapplications", { previouslyApplied: previouslyAppliedObj })
    console.log(previouslyAppliedObj);
});

//student application page
app.get("/student-portal/student-applications", isLoggedIn, function (req, res) {

    if (!req.query.postID) {
        res.redirect("/student-portal/student-findjobs")
    } else {

        jobPost.findOne({ _id: req.query.postID }, (err, jobpost) => {
            // Check if error connecting
            if (err) {
                res.json({ success: false, message: err }); // Return error
            } else {
                res.render('student-portal/student-applications', { jobpost: jobpost });
            }
        });
    }
});

//student application page
app.post("/student-portal/student-applications", isLoggedIn, upload.fields([{ name: 'Resume', maxCount: 1 }, { name: 'coverLetter', maxCount: 1 }]), function (req, res) {

    User.updateOne({ _id: req.user._id }, { $push: { previouslyApplied: req.body.postID } }, function (err, docs) {
        if (err) {
            console.log(err)
        }
        else {
            console.log("Updated Docs : ", docs);
        }
    });

    jobPost.findOne({ _id: req.body.postID }, (err, jobpost) => {
        // Check if error connecting
        if (err) {
            res.json({ success: false, message: err }); // Return error
        } else {

            f()

            async function f() {
                await applicationEmail(req.user.firstname + " " + req.user.lastname, req.user.email, jobpost, req.body, req.files['Resume'][0], req.files['coverLetter'][0])
                fs.unlinkSync(req.files['Resume'][0].path)
                fs.unlinkSync(req.files['coverLetter'][0].path)
            }

            res.redirect("/student-portal/student-findjobs");
        }
    });

});


async function applicationEmail(name, email, jobpost, response, resume, coverLetter) {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL, // generated ethereal user
            pass: process.env.PASSWORD, // generated ethereal password
        },
    });

    var htmlText = "Application from " + name + " (" + email + " )" + " for " + jobpost.jobTitle + "<br>";
    var i;
    for (i = 0; i < jobpost.questions.length; i++) {
        htmlText += "<b>" + jobpost.questions[i] + "</b> <br>" + response.response[i] + "<br><br>";
    }

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: email, // sender address
        to: jobpost.creator, // list of receivers
        cc: email,
        subject: "Application from " + name + " for " + jobpost.jobTitle, // Subject line
        text: htmlText,
        html: htmlText,
        attachments: [{ filename: resume.originalname, path: resume.path }, { filename: coverLetter.originalname, path: coverLetter.path }]
    });

    console.log("Message sent: %s", info.messageId);
}

//student bookmarks page
app.get("/student-portal/student-bookmarks", isLoggedIn, function (req, res) {
    res.render("student-portal/student-bookmarks", { error: false });
});

//student profile page
app.get("/student-portal/student-viewprofile", isLoggedIn, function (req, res) {
    message = req.session.message
    res.render("student-portal/student-viewprofile", { error: false, firstname: req.user.firstname, lastname: req.user.lastname, school: req.user.school, grade: req.user.grade, message: message });
});

var employerPosts;

app.get("/student-portal/student-employerprofile", isLoggedIn, isStudent, async function (req, res) {

    jobPost = require("./models/jobpost");

    User.findOne({ _id: req.query.employerID }, async function (err, employer) {
        // Check if error connecting
        if (err) {
            res.json({ success: false, message: err }); // Return error
        } else {
            employerPosts = await jobPost.find({ creator: employer.email })

            if (req.query.postId) {

                jobPost = require("./models/jobpost");

                jobPost.findOne({ _id: req.query.postId }, (err, jobpost) => {
                    // Check if error connecting
                    if (err) {
                        res.json({ success: false, message: err }); // Return error
                    } else {
                        res.render('student-portal/student-employerprofile', { employerPosts, employer: employer, jobpost });
                    }
                });

            } else {
                res.render('student-portal/student-employerprofile', { employerPosts, employer: employer, jobpost: false });
            }
        }
    });

});

app.get("/admin-portal/admin-viewprofile", isLoggedIn, isAdmin, async function (req, res) {

    jobPost = require("./models/jobpost");

    User.findOne({ _id: req.query.employerID }, async function (err, employer) {
        // Check if error connecting
        if (err) {
            res.json({ success: false, message: err }); // Return error
        } else {
            employerPosts = await jobPost.find({ creator: employer.email })

            if (req.query.postId) {

                jobPost = require("./models/jobpost");

                jobPost.findOne({ _id: req.query.postId }, (err, jobpost) => {
                    // Check if error connecting
                    if (err) {
                        res.json({ success: false, message: err }); // Return error
                    } else {
                        res.render('admin-portal/admin-viewprofile', { employerPosts, employer: employer, jobpost });
                    }
                });

            } else {
                res.render('admin-portal/admin-viewprofile', { employerPosts, employer: employer, jobpost: false });
            }
        }
    });

});

// app.post("/student-portal/student-employerprofile", isLoggedIn, isStudent, async function (req, res) {

//     jobPost = require("./models/jobpost");

//     jobPost.findOne({ _id: req.body.postId }, (err, jobpost) => {
//         // Check if error connecting
//         if (err) {
//             res.json({ success: false, message: err }); // Return error
//         } else {
//             res.render('student-portal/student-employerprofile', { employerPosts, employer: req.body.employer, jobpost });
//         }
//     });

// });


//presignup page
app.get("/preregister", function (req, res) {
    res.render("preregister", { error: false });
});

var accountType;

//presignup function
app.post("/preregister", function (req, res) {
    accountType = req.body.accounttype

    if (accountType == "student" || (!accountType)) {
        res.redirect("/registerStudent")
    } else if (accountType == "employer") {
        res.redirect("/registerEmployer")
    } else if (accountType == "admin") {
        res.redirect("/registerAdmin")
    }
    //res.render("register", { error: false, accountType: req.body.accounttype});
});


app.get("/registerStudent", function (req, res) {
    res.render("registerStudent", { error: false });
});

app.get("/registerEmployer", function (req, res) {
    res.render("registerEmployer", { error: false });
});

app.get("/registerAdmin", function (req, res) {
    res.render("registerAdmin", { error: false });
});

// //signup page
// app.get("/register", function (req, res) {
//     res.render("register", { error: false });
// });

app.post("/registerAdmin", function (req, res) {
    accountType == "admin"
    var email = req.body.email
    var password = req.body.password
    var confirmPassword = req.body.confirmPassword
    var verificationCode = randomString(4)

    if (password != confirmPassword) {
        return res.render("registerAdmin", { error: "passwords don't match" });
    }

    User.register(new User({ email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType: accountType, school: req.body.School, verificationCode: verificationCode }),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("registerAdmin", { error: false });
            }

            passport.authenticate("local")(
                req, res, function () {
                    sendEmail(email, verificationCode)
                    res.redirect("/emailConfirmation");
                });
        });
});

app.post("/registerStudent", function (req, res) {
    accountType == "student"
    var email = req.body.email
    var password = req.body.password
    var confirmPassword = req.body.confirmPassword
    var monthNumber = parseInt(req.body.month)
    var dateString = req.body.year + '-' + monthNumber + '-' + req.body.day
    var dateOfBirth = Date.parse(dateString)

    var verificationCode = randomString(4)

    if (password != confirmPassword) {
        return res.render("registerStudent", { error: "Passwords don't match" });
    }

    User.register(new User({ email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType: accountType, school: req.body.School, grade: req.body.grade, verificationCode: verificationCode, dateOfBirth: dateOfBirth, isCoop: false }),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("registerStudent", { error: false });
            }

            passport.authenticate("local")(
                req, res, function () {
                    sendEmail(email, verificationCode)
                    res.redirect("/emailConfirmation");
                });
        });
});

app.post("/registerEmployer", function (req, res) {
    accountType == "employer"
    var email = req.body.email
    var password = req.body.password
    var confirmPassword = req.body.confirmPassword
    var verificationCode = randomString(4)

    var address = req.body.address
    var unit = req.body.unit
    var city = req.body.city
    var province = req.body.province
    var country = req.body.country
    var postalCode = req.body.postalCode

    if (password != confirmPassword) {
        return res.render("registerEmployer", { error: "passwords don't match" });
    }

    User.register(new User({ email: email, companyName: req.body.companyName, accountType: accountType, school: req.body.School, verificationCode: verificationCode, address: req.body.address, unit: req.body.unit, city: req.body.city, province: req.body.province, country: req.body.country, postalCode: req.body.postalCode }),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("registerEmployer", { error: false });
            }

            passport.authenticate("local")(
                req, res, function () {
                    sendEmail(email, verificationCode)
                    res.redirect("emailConfirmation");
                });
        });
});

function randomString(length) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var string = '';
    for (var i = 0; i < length; i++) {
        string = string + randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return string;
}

app.get("/emailConfirmation", function (req, res) {
    res.render("emailConfirmation", { error: false, email: req.user.email, isVerified: req.user.isVerified });
});

app.post("/emailConfirmation", function (req, res) {
    userCode = req.body.code

    if (userCode != req.user.verificationCode) {
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

    res.redirect("/portal");

    //res.render("register", { error: false, accountType: req.body.accounttype});
});

app.post("/resendEmail", function (req, res) {

    var verificationCode = randomString(4)

    User.updateOne({ _id: req.user._id }, { verificationCode: verificationCode }, function (err, docs) {
        if (err) {
            console.log(err)
        }
        else {
            console.log("Updated Docs : ", docs);
        }
    });

    sendEmail(req.user.email, verificationCode)
    res.redirect("/emailConfirmation", { error: false });
});


//login page
app.get("/login", function (req, res) {

    if (req.isAuthenticated()) {
        if (req.user.isVerified = false) {
            res.redirect("/emailConfirmation");
        } else {
            res.redirect("/portal");
        }
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

app.get("/forgotpassword", function (req, res) {
    res.render('forgotpassword');
});

app.post("/forgotpassword", function (req, res) {
    resetCode = randomString(4)

    //CHECK IF THE USER EXISTS FIRST
    //CHECK IF THE USER EXISTS FIRST
    sendEmailReset(req.body.email, resetCode)

    User.updateOne({ email: req.body.email }, { resetCode: resetCode }, function (err, docs) {
        if (err) {
            console.log(err)
        }
        else {
            console.log("Updated Docs : ", docs);
        }
    });
    res.render('forgotpasswordcode', { email: req.body.email })

});

app.get("/forgotpasswordcode", function (req, res) {
    res.render('forgotpassword');
});

app.post("/forgotpasswordcode", function (req, res) {

    const query = User.findOne({ email: req.body.email });

    if (req.body.code == query.resetCode) {
        res.render('forgotpasswordreset')
    }
});

// Make sure the user has been verified
//if (!user.isVerified) return res.render("login", { error: "passwords don't match" }); 

//logout function 
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {

        if (req.user.isVerified == false) {
            res.redirect("/emailConfirmation")
        } else if (req.user.isApproved == false) {
            res.redirect("/userApproval")
        } else {
            return next();
        }
    } else {
        res.redirect("/login");
    }
}

app.get("/userApproval", function (req, res) {

    if (req.isAuthenticated()) {
        if (req.user.isVerified == false) {
            res.redirect("/emailConfirmation")
        } else if (req.user.isApproved == true) {
            res.redirect("/portal")
        } else {
            res.render("userApproval")
        }
    } else {
        res.redirect("/login");
    }

})

function isEmployer(req, res, next) {
    if (req.user.accountType == "employer") { return next(); }
    else if (req.user.accountType == "student") { res.redirect("/student-portal/student-findjobs"); }
    else { res.redirect("/admin-portal/admin-userview"); }
}

function isStudent(req, res, next) {
    if (req.user.accountType == "student") { return next(); }
    else if (req.user.accountType == "employer") { res.redirect("/employer-portal/employer-editprofile"); }
    else { res.redirect("/admin-portal/admin-userview"); }
}

function isAdmin(req, res, next) {
    if (req.user.accountType == "admin") { return next(); }
    else if (req.user.accountType == "student") { res.redirect("/student-portal/student-findjobs"); }
    else { res.redirect("/employer-portal/employer-editprofile"); }


}

//current example code taken from https://nodemailer.com/about/ 
async function sendEmail(email, code) {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL, // generated ethereal user
            pass: process.env.PASSWORD, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Testing Account" <no-reply@jobfinder.com>', // sender address
        to: email, // list of receivers
        subject: "Confirmation Code", // Subject line
        text: "Your confirmation code is " + code, // plain text body
        html: "<b>Your confirmation code is </b>" + code, // html body
    });

    console.log("Message sent: %s", info.messageId);
}
//sendEmail().catch(console.error);

//current example code taken from https://nodemailer.com/about/ 
async function sendEmailReset(email, code) {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Testing Account" <no-reply@jobfinder.com>', // sender address
        to: email, // list of receivers
        subject: "Reset Password Code", // Subject line
        text: "Your reset password code is " + code, // plain text body
        html: "<b>Your reset password code is </b>" + code, // html body
    });

    console.log("Message sent: %s", info.messageId);
}
//sendEmail().catch(console.error);

app.get("/changepassword", isLoggedIn, function (req, res) {
    res.render("changepassword", { message: false });
});

app.post('/changepassword', function (req, res) {

    if (req.body.newpassword != req.body.confirmpassword) {
        res.render("changepassword", { message: "Passwords don't match" });
    } else {

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
                            //res.render("changepassword", { message: 'Your password has been changed' });
                            req.session.message = 'Your password has been changed'
                            if (req.user.accountType == "employer") { res.redirect("/employer-portal/employer-editprofile") }
                            else if (req.user.accountType == "student") { res.redirect("/student-portal/student-viewprofile") }
                            else { res.redirect("/admin-portal/admin-myaccount") }
                        }
                    })
                }
            }
        });

    }

});

var userPosts;

app.get("/employer-portal/employer-jobview", isLoggedIn, isEmployer, async function (req, res) {

    jobPost = require("./models/jobpost");

    userPosts = await jobPost.find({ creator: req.user.email })
    res.render('employer-portal/employer-jobview', { currentUser: req.user.email, userPosts, jobpost: false });
});

app.post("/employer-portal/employer-jobview", isLoggedIn, isEmployer, async function (req, res) {

    userPosts = await jobPost.find({ creator: req.user.email })

    jobPost = require("./models/jobpost");

    jobPost.findOne({ _id: req.body.postId }, (err, jobpost) => {
        // Check if error connecting
        if (err) {
            res.json({ success: false, message: err }); // Return error
        } else {
            // Check if it's their post.
            if (jobpost.creator != req.user.email) {
                res.render("employer-portal/employer-jobview", { currentUser: req.user.email, userPosts, message: 'not your post' });
            } else {
                res.render("employer-portal/employer-jobview", { currentUser: req.user.email, userPosts, jobpost });
            }
        }
    });

});

app.get("/employer-portal/employer-jobcreate", isLoggedIn, function (req, res) {
    res.render('employer-portal/employer-jobcreate');
});

app.post("/employer-portal/employer-jobcreate", function (req, res) {
    jobPost = require("./models/jobpost");

    jobPost.create({
        creator: req.user.email, creatorID: req.user._id, creatorName: req.user.companyName, jobTitle: req.body.jobTitle, location: req.body.location, discipline: req.body.discipline, type: req.body.type, briefDescription: req.body.briefDescription, description: req.body.description,
        responsibilities: req.body.responsibilities, skills: req.body.skills, questions: req.body.question
    }, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/employer-portal/employer-jobcreate");
        } else {
            res.redirect("/employer-portal/employer-jobview");
        }
    });

});

app.get("/employer-portal/employer-jobedit", isLoggedIn, function (req, res) {

    jobPost.findOne({ _id: req.query.postID }, (err, jobpost) => {
        // Check if error connecting
        if (err) {
            res.json({ success: false, message: err }); // Return error
        } else {
            // Check if it's their post.
            if (jobpost.creator != req.user.email) {
                res.redirect("/employer-portal/employer-jobview");
            } else {
                res.render('employer-portal/employer-jobedit', { jobpost: jobpost });
            }
        }
    });

});

app.post("/employer-portal/employer-jobedit", function (req, res) {

    if (req.body.creator != req.user.email) {
        res.redirect("/employer-portal/employer-jobview", { currentUser: req.user.email, userPosts, message: 'not your post' });
    } else {

        if (!req.body.deleteButton) {

            jobPost.updateOne({ _id: req.body.postID }, {
                jobTitle: req.body.jobTitle, location: req.body.location, discipline: req.body.discipline, type: req.body.type, briefDescription: req.body.briefDescription, description: req.body.description,
                responsibilities: req.body.responsibilities, skills: req.body.skills, questions: req.body.question
            }, function (err, docs) {
                if (err) {
                    console.log(err)
                }
                else {
                    console.log("Updated Docs : ", docs);
                }
            });

        } else {

            jobPost.deleteOne({ _id: req.body.postID }, function (err, docs) {
                if (err) {
                    console.log(err)
                }
                else {
                    console.log("Updated Docs : ", docs);
                }
            });

        }
        res.redirect("/employer-portal/employer-jobview");

    }
});

app.post("/deletePostAdmin", function (req, res) {

    jobPost.deleteOne({ _id: req.body.postID }, function (err, docs) {
        if (err) {
            console.log(err)
        }
        else {
            console.log("Updated Docs : ", docs);
        }
    });
    res.redirect("/admin-portal/admin-jobview");

});

app.get("/employer-portal/employer-editprofile", isLoggedIn, function (req, res) {
    message = req.session.message
    res.render('employer-portal/employer-editprofile', { user: req.user, message: message });
});

app.post("/employer-portal/employer-editprofile", function (req, res) {

    User.updateOne({ _id: req.user._id }, {
        companyName: req.body.companyName, address: req.body.address, unit: req.body.unit, city: req.body.city,
        province: req.body.province, Country: req.body.Country, postalCode: req.body.postalCode, companyWebsite: req.body.companyWebsite,
        companyDescription: req.body.companyDescription
    }, function (err, docs) {
        if (err) {
            console.log(err)
        }
        else {
            console.log("Updated Docs : ", docs);
        }
    });

    res.redirect("/employer-portal/employer-editprofile")

});


function bookmark(action, postID) {

    if (action) {

        User.updateOne({ _id: req.user._id }, { $push: { bookmarks: postID } }, function (err, docs) {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Updated Docs : ", docs);
            }
        });

    } else {

        User.updateOne({ _id: req.user._id }, { $pull: { bookmarks: postID } }, function (err, docs) {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Updated Docs : ", docs);
            }
        });

    }

}


//ADMIN SECTION


//admin user view page
app.get("/admin-portal/admin-userview", isLoggedIn, isAdmin, function (req, res) {

    User.find({ isApproved: false }, async function (err, unapprovedUsers) {
        // Check if error connecting
        if (err) {
            res.json({ success: false, message: err }); // Return error
        } else {
            res.render("admin-portal/admin-userview", { unapprovedUsers: unapprovedUsers, error: false, result: false, term: "", userType: "" });
        }
    });
});

var userCollection;

app.get("/searchUser", async (req, res) => {
    var term = req.query.term
    var userType = req.query.userType

    try {
        let result = await userCollection.aggregate([
            {
                "$search": {
                    "compound": {
                        "must": [
                            {
                                "text": {
                                    "query": userType,
                                    "path": "accountType",
                                }
                            }
                        ]
                        ,

                        "should": [
                            {
                                "text": {
                                    "query": term,
                                    "path": "firstname",
                                }
                            },
                            {
                                "text": {
                                    "query": term,
                                    "path": "lastname",
                                }
                            },
                            {
                                "text": {
                                    "query": term,
                                    "path": "email",
                                }
                            },
                            {
                                "text": {
                                    "query": term,
                                    "path": "companyName",
                                }
                            }
                        ],
                        "minimumShouldMatch": 1
                    }
                }
            }
        ]).toArray();

        User.find({ isApproved: false }, async function (err, unapprovedUsers) {
            // Check if error connecting
            if (err) {
                res.json({ success: false, message: err }); // Return error
            } else {
                res.render("admin-portal/admin-userview", { unapprovedUsers: unapprovedUsers, error: false, result: result, term: term, userType: userType });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).send({ message: e.message });
    }
})

//admin user view put function
app.put("/admin-portal/admin-userview", isLoggedIn, isAdmin, function (req, res) {

    console.log(req.body.userID)

    User.updateOne({ _id: req.body.userID }, { isApproved: true }, function (err, docs) {
        if (err) {
            console.log(err)
        }
        else {
            console.log("Updated Docs : ", docs);
            res.json({ success: "Updated Successfully", status: 200 });
        }
    });

});

//admin user update put function
app.put("/updateUser", isLoggedIn, isAdmin, function (req, res) {

    var isEnabled
    if (req.body.accountStatus == "enabled") {
        isEnabled = true;
    } else {
        isEnabled = false;
    }

    if (firstname || lastname) {
        User.updateOne({ _id: req.body.userID }, { isEnabled: isEnabled, firstname: req.body.firstname, lastname: req.body.lastname }, function (err, docs) {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Updated Docs : ", docs);
                res.json({ success: "Updated Successfully", status: 200 });
            }
        });

    } else {

        User.updateOne({ _id: req.body.userID }, { isEnabled: isEnabled }, function (err, docs) {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Updated Docs : ", docs);
                res.json({ success: "Updated Successfully", status: 200 });
            }
        });

    }

});


//admin job view page
app.get("/admin-portal/admin-jobview", isLoggedIn, isAdmin, function (req, res) {
    res.render("admin-portal/admin-jobview", { result: false, error: false, discipline: "", type: "", term: "" });
});


//admin profile page
app.get("/admin-portal/admin-viewprofile", isLoggedIn, isAdmin, function (req, res) {
    res.render("admin-portal/admin-viewprofile", { error: false });
});

//admin edit job page
app.get("/admin-portal/admin-jobedit", isLoggedIn, isAdmin, function (req, res) {
    if (!req.query.postID) {
        res.redirect("/student-portal/student-findjobs")
    } else {
        res.render("admin-portal/admin-jobedit", { error: false });
    }
});

//admin account settings page
app.get("/admin-portal/admin-myaccount", isLoggedIn, isAdmin, function (req, res) {
    message = req.session.message
    res.render("admin-portal/admin-myaccount", { error: false, firstname: req.user.firstname, lastname: req.user.lastname, message: message });
});

app.post("/admin-portal/admin-myaccount", isLoggedIn, isAdmin, function (req, res) {

    User.updateOne({ _id: req.user._id }, { firstname: req.body.firstname, lastname: req.body.lastname }, function (err, docs) {
        if (err) {
            console.log(err)
        }
        else {
            console.log("Updated Docs : ", docs);
        }
    });

    res.redirect("/admin-portal/admin-myaccount")

});





var jobpostCollection;

app.get("/student-portal/student-findjobs", (req, res) => {
    res.render("student-portal/student-findjobs", { result: false, discipline: "", type: "", term: "" });
})


app.get("/search", isLoggedIn, async function (req, res) {
    var discipline = req.query.discipline
    var type = req.query.type
    var query = req.query.term

    try {
        let result = await jobpostCollection.aggregate([
            {
                "$search": {
                    "compound": {
                        "must": [

                            {
                                "text": {
                                    "query": discipline,
                                    "path": "discipline",
                                }
                            },

                            {
                                "text": {
                                    "query": type,
                                    "path": "type",
                                }
                            },

                            {
                                "text": {
                                    "query": query,
                                    "path": "jobTitle"
                                }
                            }
                        ]
                    }
                }
            }
        ]).toArray();
        if (req.user.accountType == "student") {
            res.render("student-portal/student-findjobs", { result: result, term: query, type: type, discipline: discipline })
        }
        else if (req.user.accountType == "admin") {
            res.render("admin-portal/admin-jobview", { result: result, term: query, type: type, discipline: discipline })
        }

    } catch (e) {
        console.error(e);
        res.status(500).send({ message: e.message });
    }
});

var port = process.env.PORT || 3000;
app.listen(port, async function () {

    try {
        await client.connect();
        jobpostCollection = client.db("login").collection("jobposts");
        userCollection = client.db("login").collection("users");

    } catch (e) {
        console.error(e);
    }

    console.log("Server Running");
});

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
    res.render("404page");
  });