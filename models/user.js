var mongoose = require("mongoose");
var passportlocalmongoose = require("passport-local-mongoose");
var UserSchema = mongoose.Schema({
    isVerified: { type: Boolean, default: false },
    firstname: String,
    lastname: String,
    accountType: String,
    email: String,
    school: String,
    grade: Number,
    Password: String,

    companyName: String,
    accountType: String,
    address: String,
    unit: String,
    city: String,
    province: String,
    Country: String,
    postalCode: String,

    dateOfBirth: {type: Date, default: Date.now},
    verificationCode: String
});

UserSchema.plugin(passportlocalmongoose, 
    {usernameField: 'email'},
    { selectFields: 'firstname lastname accountType school verificationCode dateOfBirth companyName accountType address unit city province Country postalCode' });
module.exports = mongoose.model("User", UserSchema);
