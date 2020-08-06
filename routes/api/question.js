var path = require('path');
var request = require("request");
var express = require("express");
var app = express.Router();

//Database Models 
var Question = require("../../db/models/question.js");
var Questionnaire = require("../../db/models/questionnaire.js");


//TODO MOVE THE DATA ACCESS METHODS TO A CONTROLLER!!!

//Getting questions from the Database!
app.get("/getAllQuestions/:questionnaireMongoID", function (req, res) {

    var resultObj = {

    }
    //Use the org id param to find the questionnaire and its associated questions
    Questionnaire.findOne({ "_id": req.params.questionnaireMongoID })
        // ..and populate all of the question comments associated with it
        .populate("questions")
        // now, execute our query
        .exec(function (error, doc) {
            // Log any errors
            if (error) {
                //Error with gettings questions from Questionnaire, sending back error
                console.log(error);
                resultObj.error = true;
                resultObj.errorObj = error;
                res.json(resultObj);
            }
            // Otherwise, send the doc to the browser as a json object
            else {
                resultObj.questionnaireDoc = doc;
                res.json(resultObj);
            }
        });

})


//Getting delete a question from the Database!
app.post("/deleteQuestion", function (req, res) {

    let update = {
        questionTitle: req.body.questionTitle,
        questionDescription: req.body.questionDescription,
        userAssigned: req.body.userAssigned,
        status: req.body.status
    };

    var resultObj = {
        update: update
    }

    Questionnaire.findOneAndUpdate({ "_id": req.body.questionnaireMongoID },
        { $pullAll: { questions: [req.body.questionMongoID] } },
        { safe: true })
        // Execute the above query
        .exec(function (err, orgMongoDoc) {
            // Log any errors
            if (err) {
                console.log(err);
                resultObj.error = true;
                resultObjt.errorObj = err;
                res.json(error);
            }
            else {
                //Now that I updated the Questionnaire's question array...
                //now that we deleted all the question comments, we will now delete the question itself
                //Find the question and deleted
                var filter = { _id: req.body.questionMongoID };
                Question.deleteOne(filter, function (error, questionDoc) {
                    // Log any errors
                    if (error) {
                        console.log(error);
                        resultObj.error = true;
                        resultObj.errorObj = error;
                        res.json(resultObj);
                    }
                    // Or send the doc to the browser as a json object
                    else {
                        //Deleting the question was a success, now we need to make sure that remove the question from the Questionnaire doc in DB
                        //TODO
                        resultObj.deletedQuestionDoc = questionDoc;
                        resultObj.message = "The Question has been deleted.";
                        resultObj.error = false;
                        //Now that the question has been sucessfully deleted, we want to delete all the associated question comments! 

                        res.json(resultObj);

                    }
                })
            }
        });


})


//Updating a question from the Database!
app.post("/updateQuestion", function (req, res) {
    let filter = { _id: req.body.mongoID };
    let options = {
        safe: true,
        upsert: true
    }

    let update = {
        questionText: req.body.questionText,
        questionID: req.body.id
    };

    Question
        .findOneAndUpdate(filter, update, options)
        .then(function (doc, error) {
            // Log any errors
            if (error) {
                console.log(error);
                res.json(error);
            }
            // Or send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        })
        .catch(err => res.status(422).json(err));





})

//Save a question to the Database! 
app.post("/saveQuestion", function (req, res) {
    var resultObj = {
        questionID: req.body.questionID,
        questionText: req.body.questionText

    };

    var entry = new Question(resultObj);

    // Now, save that entry to the db
    entry.save(function (err, doc) {
        // Log any errors
        if (err) {
            console.log(err);
            res.json(err);
        }
        // Or log the doc
        else {
            resultObj.questionDoc = doc;
            //Now that we saved the questions, we need to find the Questionnaire and add to it's array the new question.
            // Use the questionnaire id to find and update its' questions
            Questionnaire.findOneAndUpdate({ "_id": req.body.questionnaireMongoID }, { $push: { "questions": doc._id } },
                { safe: true, upsert: false })
                // Execute the above query
                .exec(function (err, doc) {


                    // Log any errors
                    if (err) {
                        console.log(err);
                        resultObj.error = true;
                        resultObj.errorObj = err;
                        res.send(resultObj);
                    }
                    else {
                        // Updating Questionnaire was success, added new Questionnaire DOc, and send back to client
                        resultObj.questionnaireDoc = doc;
                        res.send(resultObj);
                    }
                });
        }
    });

});

module.exports = app;