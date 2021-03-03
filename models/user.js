var mongoose = require("mongoose");
var passportlocalmongoose = require("passport-local-mongoose");
var UserSchema = mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    school: String,
    Password: String
});

UserSchema.plugin(passportlocalmongoose, 
    {usernameField: 'email'},
    { selectFields: 'firstname lastname school' });
module.exports = mongoose.model("User", UserSchema);

//{selectFields: ''}