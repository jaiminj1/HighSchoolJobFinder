var mongoose = require('mongoose');
//var textSearch = require('mongoose-partial-full-search');



const jobPostSchema = new mongoose.Schema({
    creator: String,
    jobTitle: String,
    discipline: [{type: String}],
    type: String,
    briefDescription: String,
    description: String,
    responsibilities: String,
    skills: String
}, { timestamps: true });


// give our schema text search capabilities
//jobPostSchema.plugin(textSearch);

// add a text index to the tags array
jobPostSchema.index({ tags: 'text' });





module.exports = mongoose.model('jobPost', jobPostSchema);

