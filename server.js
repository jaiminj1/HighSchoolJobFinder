if (process.env.NODE_ENV != 'production') {
    require('dotenv').config()
}

var express = require("express"),
    flash = require('express-flash'),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose =
        require("passport-local-mongoose"),
    User = require("./models/user");

//const bcrypt = require('bcrypt')
const nodemailer = require("nodemailer");
const jobpost = require('./models/jobpost');
const Cors = require("cors");
const { response } = require('express');
const bodyParser = require("body-parser");

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_CONNECT_KEY);


const atlasPlugin = require('mongoose-atlas-search');


mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// Connection URL
mongoose.connect(process.env.MONGO_CONNECT_KEY);

//const client = new mongoose(process.env.MONGO_CONNECT_KEY);

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(Cors());

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

    if (req.user.isVerified === false) {
        res.render("emailConfirmation", {
            email: req.user.email, firstname: req.user.firstname, lastname: req.user.lastname, accountType,
            school: req.user.School, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified
        });
    } else {

        // accounType = req.user.accountType
        // console.log(req.user.accountType)
        // console.log(accountType)

        if (req.user.accountType == "student") {
            res.redirect("student-portal/student-findjobs");
        }
        else if (req.user.accountType == "employer") {
            res.redirect("employer-portal/employer-profile");
        }
        else if (req.user.accountType == "admin") {
            res.redirect("admin-portal/admin-userview");
        }
        //res.render("portal", { email: req.user.email, firstname: req.user.firstname, lastname: req.user.lastname, school: req.user.School });
    }
});

//employer find jobs page
// app.get("/student-portal/student-findjobs", isLoggedIn, function (req, res) {
//     res.render("student-portal/student-findjobs", { error: false });
// });


//employer edit profile page
app.get("/employer-portal/employer-profile", isLoggedIn, function (req, res) {
    res.render("employer-portal/employer-profile", { error: false });
});

//employer job create page
app.get("/employer-portal/employer-jobcreate", isLoggedIn, function (req, res) {
    res.render("employer-portal/employer-jobcreate", { error: false });
});

//employer job view page
app.get("/employer-portal/employer-jobview", isLoggedIn, function (req, res) {
    res.render("employer-portal/employer-jobview", { error: false });
});

//employer job edit page
app.get("/employer-portal/employer-jobedit", isLoggedIn, function (req, res) {
    res.render("employer-portal/employer-jobedit", { error: false });
});

//admin user view page
app.get("/admin-portal/admin-userview", isLoggedIn, function (req, res) {
    res.render("admin-portal/admin-userview", { error: false });
});

//resources page
app.get("/resources", function (req, res) {
    res.render("resources", { error: false });
});

//help center page
app.get("/helpCenter", isLoggedIn, function (req, res) {
    res.render("helpCenter", { error: false });
    // search();
});

//student myapplications page
app.get("/student-portal/student-applications", isLoggedIn, function (req, res) {
    res.render("student-portal/student-applications", { error: false });
});

//student bookmarks page
app.get("/student-portal/student-bookmarks", isLoggedIn, function (req, res) {
    res.render("student-portal/student-bookmarks", { error: false });
});

//student profile page
app.get("/student-portal/student-viewprofile", isLoggedIn, function (req, res) {
    res.render("student-portal/student-viewprofile", { error: false, name: req.user.firstname, school: req.user.school });
});



//presignup page
app.get("/preregister", function (req, res) {
    res.render("preregister", { error: false });
});

var accountType;

//presignup function
app.post("/preregister", function (req, res) {
    accountType = req.body.accounttype

    if (accountType == "student") {
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

//signup page
app.get("/register", function (req, res) {
    res.render("register", { error: false });
});

app.post("/registerAdmin", function (req, res) {
    var email = req.body.email
    var password = req.body.password
    var confirmPassword = req.body.confirmPassword
    var verificationCode = randomString(4)

    if (password != confirmPassword) {
        console.log(password)
        console.log(confirmPassword)
        return res.render("register", { error: "passwords don't match" });
    }

    User.register(new User({ email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType: accountType, school: req.body.School, verificationCode: verificationCode }),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("registerAdmin", { error: false });
            }

            //res.render("emailConfirmation", { email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType, school: req.body.School, verificationCode});
            passport.authenticate("local")(
                req, res, function () {
                    sendEmail(email, verificationCode)
                    res.render("emailConfirmation", { email: email, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified });
                });
        });
});

app.post("/registerStudent", function (req, res) {
    var email = req.body.email
    var password = req.body.password
    var confirmPassword = req.body.confirmPassword
    var monthNumber = parseInt(req.body.month)
    var dateString = req.body.year + '-' + monthNumber + '-' + req.body.day
    var dateOfBirth = Date.parse(dateString)

    var verificationCode = randomString(4)

    if (password != confirmPassword) {
        console.log(password)
        console.log(confirmPassword)
        return res.render("register", { error: "passwords don't match" });
    }

    User.register(new User({ email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType: accountType, school: req.body.School, grade: req.body.grade, verificationCode: verificationCode, dateOfBirth: dateOfBirth }),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("registerStudent", { error: false });
            }

            //res.render("emailConfirmation", { email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType, school: req.body.School, verificationCode});
            passport.authenticate("local")(
                req, res, function () {
                    sendEmail(email, verificationCode)
                    res.render("emailConfirmation", { email: email, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified });
                });
        });
});

app.post("/registerEmployer", function (req, res) {
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
        console.log(password)
        console.log(confirmPassword)
        return res.render("register", { error: "passwords don't match" });
    }

    User.register(new User({ email: email, companyName: req.body.companyName, accountType: accountType, school: req.body.School, verificationCode: verificationCode, address: req.body.address, unit: req.body.unit, city: req.body.city, province: req.body.province, country: req.body.country, postalCode: req.body.postalCode }),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("registerEmployer", { error: false });
            }

            //res.render("emailConfirmation", { email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType, school: req.body.School, verificationCode});
            passport.authenticate("local")(
                req, res, function () {
                    sendEmail(email, verificationCode)
                    res.render("emailConfirmation", { email: email, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified });
                });
        });
});


// app.post("/register", function (req, res) {
//     var email = req.body.email
//     var password = req.body.password
//     var confirmPassword = req.body.confirmPassword
//     var verificationCode = randomString(4)

//     if (password != confirmPassword) {
//         console.log(password)
//         console.log(confirmPassword)
//         return res.render("register", { error: "passwords don't match" });
//     }

//     User.register(new User({ email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType: accountType, school: req.body.School, verificationCode: verificationCode }),
//         password, function (err, user) {
//             if (err) {
//                 console.log(err);
//                 return res.render("register", { error: false });
//             }

//             //res.render("emailConfirmation", { email: email, firstname: req.body.firstname, lastname: req.body.lastname, accountType, school: req.body.School, verificationCode});
//             passport.authenticate("local")(
//                 req, res, function () {
//                     sendEmail(email, verificationCode)
//                     console.log(req.user.verificationCode)
//                     res.render("emailConfirmation", { email: email, firstname: req.user.firstname, lastname: req.user.lastname, accountType, school: req.user.School, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified });
//                 });
//         });
// });

function randomString(length) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var string = '';
    for (var i = 0; i < length; i++) {
        string = string + randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return string;
}

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

    res.redirect("/portal");

    //res.render("register", { error: false, accountType: req.body.accounttype});
});


//login page
app.get("/login", function (req, res) {

    if (req.isAuthenticated()) {
        if (req.user.isVerified = false) {
            res.render("emailConfirmation", { email: email, firstname: req.user.firstname, lastname: req.user.lastname, accountType, school: req.user.School, verificationCode: req.user.verificationCode, isVerified: req.user.isVerified });
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

app.get("/changepassword", isLoggedIn, function (req, res) {
    res.render("changepassword", { message: false });
});

app.post('/changepassword', function (req, res) {
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

app.get("/employer-portal/employer-jobview", isLoggedIn, async function (req, res) {

    jobPost = require("./models/jobpost");

    const userPosts = await jobPost.find({ creator: req.user.email })
    res.render('employer-portal/employer-jobview', { currentUser: req.user.email, userPosts });

    // jobPost.find({ creator: req.user.email }, (err, posts) => {
    //     if (err) {
    //         console.log(err);
    //         res.render('employer-portal/employer-profile')
    //     } else {
    //         res.render('employer-portal/employer-view', { currentUser: req.user, posts: posts });
    //     }
    // });
});


app.get("/employer-portal/employer-jobcreate", isLoggedIn, function (req, res) {
    res.render('employer-portal/employer-jobcreate');
});

app.post("/employer-portal/employer-jobcreate", function (req, res) {
    jobPost = require("./models/jobpost");

    jobPost.create({
        creator: req.user.email, jobTitle: req.body.jobTitle, discipline: req.body.discipline, type: req.body.type, briefDescription: req.body.briefDescription, description: req.body.description,
        jobTitle: req.body.jobTitle, discipline: req.body.discipline, type: req.body.type, briefDescription: req.body.briefDescription, description: req.body.description,
        responsibilities: req.body.responsibilities, skills: req.body.skills
    }, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/employer-portal/employer-jobcreate");
        } else {
            res.redirect("/employer-portal/employer-jobview");
        }
    });

});

// function getSelectedOptions(sel) {
//     var opts = [], opt;

//     // loop through options in select list
//     for (var i = 0, len = sel.options.length; i < len; i++) {
//         opt = sel.options[i];

//         // check if selected
//         if (opt.selected) {
//             // add to array of option elements to return from this function
//             opts.push(opt);
//         }
//     }
//     // return array containing references to selected option elements
//     return opts;
// }

// function search(){
//     // n = number of items
//     // var input, n, discipline, type;
//     var n = req.jobposts.find({});
//     // discipline = req.jobposts.discipline;
//     // type = req.jobposts.type;
// ff
//     console.log(n);

//         next();

// }




// var n = req.jobposts.find({})
// console.log(n);

// //res.redirect("/login");
// return next();

// function search(){
//     var result = db.collection('jobposts', 'users').find({
//         $or: [{ vehicleDescription: { $regex: search.keyWord, $options: 'i' } },
//         { adDescription: { $regex: search.keyWord, $options: 'i' } }]
//     });

//     console.log(result)
// }




//student find jobs page
// app.get("/student-portal/student-findjobs", isLoggedIn, function (req, res) {
//     res.render("student-portal/student-findjobs", {
//         error: false, creator: req.user.email, jobTitle: req.body.jobTitle, discipline: req.body.discipline,
//         type: req.body.type, briefDescription: req.body.briefDescription, description: req.body.description,
//         jobTitle: req.body.jobTitle, discipline: req.body.discipline, type: req.body.type,
//         briefDescription: req.body.briefDescription, description: req.body.description,
//         responsibilities: req.body.responsibilities, skills: req.body.skills
//     });
// });

// app.get('/student-portal/student-findjobs' , function (req , res) {
//     User.find({}).then(function (users) {
//     res.send(users);
//     });
//    });
// app.get("/student-portal/student-findjobs", function (req, res) {
//     jobPost = require("./models/jobpost");

//     jobPost.find({}, function (err, jobPost) {
//         var jobPosts = {};

//         jobPosts.forEach(function (jobPost) {
//             jobPostMap[user._id] = jobPost;
//         });

//         res.send(jobPostMap);
//         console.log(jobPostMap)
//     });
    // exports.product_update = function (req, res, next) {
    //     Product.findByIdAndUpdate(req.params.id, {$set: req.body}, function (err, product) {
    //         if (err) return next(err);
    //         Product.find({}).then(function (products) {
    //             res.send(products);
    //             });
    //         //res.send('Product udpated.');
    //     });
    // };
//});



// app.post("/student-portal/student-findjobs", async function (req, res) {
//     jobPost = require("./models/jobpost");

//     const studentViewJobs = jobPost.find({
//         creator: req.user.email, creator: req.user.email, jobTitle: req.body.jobTitle, discipline: req.body.discipline,
//         type: req.body.type, briefDescription: req.body.briefDescription, description: req.body.description,
//         jobTitle: req.body.jobTitle, discipline: req.body.discipline, type: req.body.type,
//         briefDescription: req.body.briefDescription, description: req.body.description,
//         responsibilities: req.body.responsibilities, skills: req.body.skills
//     })
//     var newJob = mongoose.model("jobPost", jobPostSchema);
//     const allusers = newJob.find({}, "discipline", function (err, docs) {
//         if (err) console.log(err);
//         console.log(docs);
//     });


//     newJob.find({ name: { $regex: "s", $options: "i" } }, function (err, docs) {
//         console.log("Partial Search Begins");
//         console.log(docs);
//     });
//     res.redirect("/student-portal/student-findjobs")
// });


//student job view function
// app.post("/student-portal/student-findjobs"), 

// // passport.authenticate("local", {
// //     successRedirect: "/student-portal/non-dynamic-search",
// //     failureRedirect: "/student-portal/student-findjobs",
// //     failureFlash: { type: 'error', message: 'Invalid username or password.' }
// // }),
// function (req, res) {
//     jobpost.findById({ _id: req.jobpost._id })
//         .then(jobpost => {
//             if (!jobpost) {
//                 res.status(404).send();
//             }
//             res.send({ jobpost });
//         }).catch((e) => { 
//             res.status(400).send(e);
//         });
//     console.log("Server Running");
// };

//non-dynamic-search page
app.get("/student-portal/non-dynamic-search", isLoggedIn, function (req, res) {
    jobPost = require("./models/jobpost");
    res.render("student-portal/non-dynamic-search", { error: false });
});


// app.get('/jobPost/id/:id', (req, res) => {

// });

// app.get('/student-portal/non-dynamic-search',function(req,res){ 

//     var search_key = req.param('search'); 

//     jobPost.find({title: search_key}) 

//     .then(jobpost => res.json(jobpost)) 

//     .catch(err => res.status(404).json({ success: false})); 

//     });






// var port = process.env.PORT || 3000;
// app.listen(port, function () {
//     console.log("Server Running");
// });

var collection;

app.get("/student-portal/student-findjobs", (req, res) =>{
    res.render("student-portal/student-findjobs");
})

app.get("/search", async (req, res) => {
    // console.log("in get")
    try {
        let result = await collection.aggregate([
            {
                "$search": {
                    "autocomplete": {
                        "query": `${req.query.term}`,
                        "path": "jobTitle",
                        "fuzzy": {
                            "maxEdits": 1
                        }
                    }
                }
            }
        ]).toArray();
        // console.log(result[0].jobTitle);
        res.send(result);
        // console.log("went through")
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: e.message });
        // console.log("nope")
    }
})




app.listen("3000", async () => {
    try {
        await client.connect();
        collection = client.db("login").collection("jobposts");
        // jobPost = require("./models/jobpost");

    } catch (e) {
        console.error(e);
    }
})





// const schema = new mongoose.Schema({ _id: mongoose.ObjectId });
// const Model = mongoose.model('MyModel', schema);

// await Model.create({ _id: new mongoose.Types.ObjectId(_id) });

// typeof _id; // 'string'
// // `{ _id: '5d273f9ed58f5e7093b549b0' }`
// const doc = await Model.findById(_id);

// typeof doc._id; // 'object'
// doc._id instanceof mongoose.Types.ObjectId; // true

// module.exports = mongoose.model("Search function", EmployerSchema);

// var result = db.collection('jobposts', 'users').find({
//     $or: [{ vehicleDescription: { $regex: search.keyWord, $options: 'i' } },
//     { adDescription: { $regex: search.keyWord, $options: 'i' } }]
// });

// function find (name, query, cb) {
//     mongoose.connection.db.collection(name, function (err, collection) {
//        collection.find(query).toArray(cb);
//    });
// }

// const Model = mongoose.model('jobPost', jobPostSchema);


// //atlasPlugin.initialize(<options>);
// atlasPlugin.initialize({
//     model: Model,
//     overwriteFind: true,
//     searchKey: 'search',
//     addFields: {
//       id: '$_id'
//     },
//     searchFunction: query => {
//       return {
//         'wildcard': {
//           'query': `${query}*`,
//           'path': '_id',
//           'allowAnalyzedField': true
//         }
//       }
//     }

//   });


//   (async () => {
//     const resultWithSearch = await jobPostSchema.find({search: 'test user'}); //aggregation is used
//     const resultWithoutSearch = await jobPostSchema.find({name: 'test user'}); //standard "find" is used
//   })();


