var mongoose = require("mongoose");
var passportlocalmongoose = require("passport-local-mongoose");
var UserSchema = mongoose.Schema({
    isVerified: { type: Boolean, default: false },
    firstname: String,
    lastname: String,
    accountType: String,
    email: String,
    school: String,
    Password: String,
    verificationCode: String
});

UserSchema.plugin(passportlocalmongoose, 
    {usernameField: 'email'},
    { selectFields: 'firstname lastname accountType school verificationCode' });
module.exports = mongoose.model("User", UserSchema);
