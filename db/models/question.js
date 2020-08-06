// Require mongoose
var mongoose = require("mongoose");
// Create a schema class
var Schema = mongoose.Schema;

// Create the Note schema
var QuestionSchema = new Schema({
    questionID: {
        type: Number  
    },
    questionText: {
        type: String
    },
    answer: {
        type: Boolean
    },
    answerHistory: [{
        type: String
    }]
});

// Remember, Mongoose will automatically save the ObjectIds of the comments

QuestionSchema.index({ '$**': 'text' });

// Create the Question model with the Question
var Question = mongoose.model("Question", QuestionSchema);

// Export the Note model
module.exports = Question;