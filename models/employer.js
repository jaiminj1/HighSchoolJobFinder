var mongoose = require("mongoose");
var passportlocalmongoose = require("passport-local-mongoose");
var EmployerSchema = mongoose.Schema({
    isVerified: { type: Boolean, default: false },
    companyName: String,
    accountType: String,
    email: String,
    Password: String,
    address: String,
    unit: String,
    city: String,
    province: String,
    Country: String,
    postalCode: String,
    verificationCode: String,
});

EmployerSchema.plugin(passportlocalmongoose, 
    {usernameField: 'email'},
    { selectFields: 'companyName accountType email address unit city province Country postalCode verificationCode' });
module.exports = mongoose.model("employerUser", EmployerSchema);
