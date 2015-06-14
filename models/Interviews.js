var mongoose = require('mongoose');

var InterviewSchema = new mongoose.Schema({
	body: String,
	author: String,
	goodAnswers: String,
	badAnswers: String,
	date: { type: Date, default: Date.now },
	maxRating: { type: Number, default: 10 },
	overallRating: { type: Number, default: 0 },
	cultureRating: { type: Number, default: 0 },
	knowledgeRating: { type: Number, default: 0 },
	leadershipRating: { type: Number, default: 0 },
	upvotes: { type: Number, default: 0 },
	hire: String,
	post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
});

InterviewSchema.methods.upvote = function(cb){
	this.upvotes += 1;
	this.save(cb);
};

mongoose.model('Interview', InterviewSchema);