var path = require('path');
var request = require("request");
var express = require("express");
var app = express.Router();

//Database Models 
var Questionnaire = require("../../db/models/questionnaire.js");
var User = require("../../db/models/user.js");

//SAVE A Questionnaire
app.post("/saveQuestionnaire", function (req, res) {
    // Create a new Questionnaire and pass the req.body to the entry
    let result = {
        name: req.body.questionnaireName,
        questionnaireID: req.body.questionnaireID,
        userWhoCreatedOrgMongoID: req.body.mongoID,
        users: [req.body.userFirstName + " " + req.body.userLastName]
    }

    var newQuestionnaire = new Questionnaire(result);

    let filter = { questionnaireID: req.body.questionnaireID };

    Questionnaire
        .findOne(filter, function (error, doc) {
            // Log any errors -- 
            if (error) {
                let responseObj = {
                    error: "Server error."
                }
                res.json(responseObj);
            }
            // IF questionnaire IS NOT FOUND, then we an save the new questionnaire, since questionnaireID MUST BE UNIQUE!
            else if (doc === null) {
                // And save the new questionnaire in the db
                newQuestionnaire.save(function (error, doc) {
                    // Log any errors
                    if (error) {
                        console.log(error);
                        res.json(error);
                    }
                    // Otherwise
                    else {
                        // Use the User id to find and update its' questionnaire
                        User.findOneAndUpdate({ "_id": req.body.mongoID }, { $push: { "questionnaires": doc._id } },
                            { safe: true, upsert: true })
                            // Execute the above query
                            .exec(function (err, doc) {
                                // Log any errors
                                if (err) {
                                    console.log(err);
                                    res.json(err);
                                }
                                else {
                                    // Or send the document to the browser
                                    res.send(doc);
                                }
                            });
                    }
                });
            }
            else {
                //IF USER IS FOUND, WE SEND ERROR BACK SAYING Questionnaire ID IS TAKEN
                let responseObj = {
                    error: "Questionnaire ID is taken already."
                }
                res.json(responseObj);
            }
        });

});

//UPDATING AN Questionnaire
app.post("/updateQuestionnaire", function (req, res) {

    let filter = { _id: req.body.questionnaireMongoID };
    let options = {
        safe: true,
        upsert: false
    }

    var update = {
        name: req.body.questionnaireName,
        questionnaireID: req.body.questionnaireID
    }

    var newArray = [];
    console.log(req.body.questions);
    for(var i=0; i<req.body.questions.length;i++){
        newArray.push(req.body.questions[i]._id);
    }

    console.log("new array");
    console.log(newArray);

    if (req.body.isFromAnswerQuestionnaire) {
        console.log("IS FROME ANSWER QQQ!!!");

        update = {
            $set: {
                questions:newArray
            }
        }
    }

    Questionnaire
        .findOneAndUpdate(filter, update, options)
        .populate("questions")
        .then(function (doc, error) {
            // Log any errors
            if (error) {
                console.log(error);
                res.json(error);
            }
            // Or send the doc to the browser as a json object
            else {
                console.log("success?");
                console.log(doc);
                if (req.body.isFromAnswerQuestionnaire) {
                    for(var i=0;i<req.body.questions.length;i++){
                        doc.questions[req.body.questions[i].questionID].answerHistory = req.body.questions[i].answerHistory;
                    }
                     doc.save(function(err){
                         if(!err){
                             console.log("SUCCESS!!!!");
                             res.json(doc);
                         }
                     })
                } else {
                    res.json(doc);
                }
            }
        })
        .catch(err => res.status(422).json(err));
});

//Get all questionnaires of a user object
app.get("/getAllQuestionnairesOfUser/:mongoID", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    User.findOne({ "_id": req.params.mongoID })
        // ..and populate all of the bug comments associated with it
        .populate("questionnaires")
        // now, execute our query
        .exec(function (error, doc) {
            // Log any errors
            if (error) {
                console.log(error);
                res.json(error);
            }
            // Otherwise, send the doc to the browser as a json object
            else {
                if(doc.questionnaires == null){
                    doc = {questionnaires: []};
                }
                res.json(doc);
            }
        });
});

//Get questionnaire from DB
app.get("/getQuestionnaireFromDB/:questionnaireID", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    Questionnaire.findOne({ "questionnaireID": req.params.questionnaireID })
        // ..and populate all of the bug comments associated with it
        .populate("questions")
        // now, execute our query
        .exec(function (error, doc) {
            // Log any errors
            if (error) {
                res.json(error);
            }
            // Otherwise, send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
});


//attach user to questionnaire
app.post("/attachUserToQuestionnaire", function (req, res) {
    // Create a new Questionnaire and pass the req.body to the entry
    let resultObj = {
        questionnaireID: req.body.questionnaireID,
        userMongoID: req.body.mongoID
    }

    let filter = { questionnaireID: req.body.questionnaireID };

    Questionnaire
        .findOne(filter, function (error, questionnaireDoc) {
            // Log any errors -- 
            if (error) {
                console.log(error);
                let responseObj = {
                    error: true,
                    errorReason: "Server error."
                }
                res.json(responseObj);
            }
            // IF Questionnaire IS NOT FOUND, then we send error back to client, unable to join organizaiton
            //questionnaireID MUST BE UNIQUE! 
            else if (questionnaireDoc === null) {
                let responseObj = {
                    error: "Cannot find Questionnaire with that Questionnaire ID"
                }
                res.json(responseObj);
            }
            else {
                //If the Questionnaire ID is found, then we will update that Questionnaire.
                //We will update the Questionnaire mongoID in the User Model's "Questionnaires" array
                // Use the User id to find and update its' questionnaire

                //First, if the user is already in the questionnaire, we don't want the user to join again. So we will send error message back.
                //We want to search our database to see if this email is already taken.
                var filter = { _id: resultObj.userMongoID }

                var userIsAlreadyInquestionnaire = false;
                //Before we update user or questionnaire, we want to make sure user is not already in organzation
                for (var i = 0; i < questionnaireDoc.users.length; i++) {
                    if (questionnaireDoc.users[i] === req.body.userFirstName + " " + req.body.userLastName) {
                        userIsAlreadyInQuestionnaire = true;
                    }
                }
                if (userIsAlreadyInQuestionnaire) {
                    //Otherwise, we will officially send error messsage.
                    resultObj.error = "You have already joined that questionnaire.";
                    res.json(resultObj);
                } else {
                    console.log("BEFORE USER UPDATE!!");
                    // Use the User id to find and update its' questionnaire
                    User.findOneAndUpdate({ "_id": req.body.mongoID }, { $push: { "questionnaires": questionnaireDoc._id } },
                        { safe: true, upsert: true })
                        // Execute the above query
                        .exec(function (err, userDoc) {
                            // Log any errors
                            if (err) {
                                console.log(err);
                                res.json(err);
                            }
                            else {
                                // Or send the document to the browser

                                //Now that we saved the user, we need to push his name to the questionnaire user list
                                // Use the User id to find and update its' questionnaire
                                resultObj.successMessage = "You've successfully joined an questionnaire.";
                                resultObj.newUserObj = userDoc;
                                resultObj.questionnaires = userDoc.questionnaires;
                                questionnaireDoc.users.push(userDoc.firstName + " " + userDoc.lastName);
                                //And then save questionnaire
                                questionnaireDoc.save(function (err, afterQuestionnaireIsSaved) {
                                    // Log any errors
                                    if (err) {
                                        console.log(err);
                                        resultObj.error = "Something went wrong when trying to save the user";
                                        res.json(resultObj);
                                    }

                                    else {
                                        resultObj.successMessage = "You've successfully joined an questionnaire.";
                                        res.json(resultObj);

                                    }
                                });

                            }
                        });


                }
            }
        });

});


//Delete an questionnaire
app.post("/deleteQuestionnaire", function (req, res) {
    // Create a new Questionnaire and pass the req.body to the entry
    let resultObj = {
        questionnaireMongoID: req.body.questionnaireMongoID,
        userMongoID: req.body.userMongoID,
        questionnaire: req.body.questionnaireData,
        questionnaireAdminMongoID: req.body.questionnaireAdminMongoID,
        isUserQuestionnaireOwner: req.body.isUserQuestionnaireOwner
    }

    var filter = { _id: resultObj.userMongoID }

    User.findOne({ "_id": resultObj.userMongoID })
        // ..and populate all of the Questionnaires associated with it
        .populate("questionnaires")
        // now, execute our query
        .exec(function (error, userDoc) {
            // Log any errors
            if (error) {
                console.log(error);
                res.json(error);
            }
            // Otherwise, we found the user!
            else {

                User.findOneAndUpdate({ "_id": resultObj.userMongoID },
                    { $pullAll: { questionnaires: [resultObj.questionnaireMongoID] } },
                    { safe: true })
                    // Execute the above query
                    .exec(function (err, userDoc) {


                        // Log any errors
                        if (err) {
                            console.log(err);
                        }
                        else {
                            //Now that I updated the user...
                            //If user is questionnaire owner, then we will remove the questionnaire!!!
                            if (resultObj.isUserQuestionnaireOwner) {
                                var filter = { _id: resultObj.questionnaireMongoID };
                                Questionnaire
                                    .deleteOne(filter, function (error, doc) {
                                        // Log any errors
                                        if (error) {
                                            console.log(error);
                                            resultObj.error = true;
                                            resultObj.errorObj = error;
                                            res.json(error);
                                        }
                                        // Or send the doc to the browser as a json object
                                        else {
                                            //Deleting the bug was a success, now we need to make sure that remove the bug from the Questionnaire doc in DB
                                            //TODO
                                            resultObj.deletedQuestionnaireDoc = doc;
                                            resultObj.message = "The Questionnaire has been deleted.";
                                            res.json(resultObj);

                                        }
                                    })
                            } else {
                                //IF user is NOT owner of Questionnaire, then user will only LEAVE that Questionnaire
                                //At this point, we need to update the Questionnaire users list
                                resultObj.message = "User has left the Questionnaire.";
                                var filter = { _id: resultObj.questionnaireMongoID };
                                Questionnaire
                                    .findOneAndUpdate(filter, { $pullAll: { users: [req.body.userFirstName + " " + req.body.userLastName] } }, function (error, doc) {
                                        // Log any errors
                                        if (error) {
                                            console.log(error);
                                            resultObj.error = true;
                                            resultObj.errorObj = error;
                                            res.json(error);
                                        }
                                        // Or send the doc to the browser as a json object
                                        else {
                                            //Updating the questionnaire was a success,
                                            resultObj.deletedQuestionnaireDoc = doc;
                                            resultObj.message = "You have successfully left the questionnaire.";
                                            res.json(resultObj);

                                        }
                                    })

                            }

                        }
                    });







            }
        });


});




module.exports = app;