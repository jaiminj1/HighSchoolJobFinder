var mongoose = require("mongoose");
var passportlocalmongoose = require("passport-local-mongoose");
var UserSchema = mongoose.Schema({

    //all users
    isVerified: { type: Boolean, default: false },
    firstname: String,
    lastname: String,
    accountType: String,
    email: String,
    Password: String,
    accountType: String,

    //student only information
    dateOfBirth: {type: Date, default: Date.now},
    school: String,
    grade: Number,

    //employer only information
    companyName: String,
    address: String,
    unit: String,
    city: String,
    province: String,
    Country: String,
    postalCode: String,

    profilePhoto: String,
    companyWebsite: String,
    companyDescription: String,


    //verification code
    verificationCode: String,

    //reset code
    resetCode: String,

    previouslyApplied: [{type: String}],
    bookmarks: [{type: String}]

});

UserSchema.plugin(passportlocalmongoose, 
    {usernameField: 'email'},
    { selectFields: 'firstname lastname accountType school verificationCode dateOfBirth companyName accountType address unit city province Country postalCode profilePhoto companyWebsite companyDescription resetCode previouslyApplied bookmarks' });
module.exports = mongoose.model("User", UserSchema);
