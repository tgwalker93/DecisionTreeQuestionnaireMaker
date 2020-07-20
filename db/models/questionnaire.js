const mongoose = require('mongoose')
const Schema = mongoose.Schema
mongoose.promise = Promise

const QuestionnaireSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    questionnaireID: {
        type: String,
        required: true
    },
    //MongoID of user who created ID. Only owners can delete the organization
    userWhoCreatedOrgMongoID: {
        type: String,
        required: true
    },
    //MongoID of user who created ID. Only owners can delete the Questionnaire
    userWhoCreatedQuestionnaire: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    // This only saves one comment's ObjectId, ref refers to the Note model
    questions: [{
        type: Schema.Types.ObjectId,
        ref: "Question"
    }]
});


QuestionnaireSchema.index({ '$**': 'text' });

// Create reference to Bug & export
const Questionnaire = mongoose.model("Questionnaire", QuestionnaireSchema);
module.exports = Questionnaire