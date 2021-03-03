var mongoose=require("mongoose");
var passportlocalmongoose=require("passport-local-mongoose");
var UserSchema=mongoose.Schema({
    email: String,
    Password: String,
});

UserSchema.plugin(passportlocalmongoose, { usernameField : 'email' });
module.exports=mongoose.model("User", UserSchema);

//{selectFields: ''}
//firstname: String
//lastname: String