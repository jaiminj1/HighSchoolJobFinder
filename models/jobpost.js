var mongoose = require('mongoose');

var jobPostSchema = new mongoose.Schema({
    creator: String,
    creatorID: String,
    creatorName: String,
    location: String,
    jobTitle: String,
    discipline: [{type: String}],
    //  discipline: String,

    type: String,
    briefDescription: String,
    description: String,
    responsibilities: String,
    skills: String,
    questions: [{type: String}]
}, { timestamps: true });

module.exports = mongoose.model('jobPost', jobPostSchema);