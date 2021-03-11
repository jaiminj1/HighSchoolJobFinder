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
    { selectFields: '' });
module.exports = mongoose.model("null", EmployerSchema);
