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


var newUser = mongoose.model("jobposts", jobposts);
const allusers = newUser.find({}, "name age", function(err, docs) {
if (err) console.log(err);
console.log(docs);
});


newUser.find({ name: { $regex: "s", $options: "i" } }, function(err, docs) {
console.log("Partial Search Begins");
console.log(docs);
});