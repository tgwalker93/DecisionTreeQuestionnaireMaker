import axios from "axios";

export default {

    // USER CALLS TO DB -----
    user: function () {
        return axios.get("/api/user");
    },
    sendForgotPasswordEmail(userObj) {
        return axios.post("/api/user/sendForgotPasswordEmail", userObj);
    },
    updateUserInDB(userObj){
        return axios.post("/api/user/updateUser", userObj);
    },
    login: function (userData) {
        return axios.post("/api/user/login", userData)
    },
    saveUser: function (userData) {
        return axios.post("/api/user/saveUser", userData);
    },

    //QUESTION CALLS TO DB --------
    saveQuestion: function (questionData) {
        return axios.post("/api/question/saveQuestion", questionData);
    },
    updateQuestion: function (questionData) {
        return axios.post("/api/question/updateQuestion", questionData);
    },
    deleteQuestion: function (questionData) {
        return axios.post("/api/question/deleteQuestion", questionData);
    },
    getAllQuestions: function (organizationMongoID) {
        return axios.get("/api/question/getAllQuestions/" + organizationMongoID);
    },
    


    // questionnaire CALLS TO DB ------
    getQuestionnaireFromDB: function(questionnaireObj){
        console.log("hi");
        console.log(questionnaireObj);
        return axios.get("/api/questionnaire/getQuestionnaireFromDB/" + questionnaireObj.questionnaireID);
    },
    saveQuestionnaireInDB: function(questionnaireData) {
        return axios.post("/api/questionnaire/saveQuestionnaire", questionnaireData);
    },
    getQuestionnairesOfUserInDB: function(userData){
        console.log("i'm in API!!!");
        return axios.get("/api/questionnaire/getAllQuestionnairesOfUser/" + userData.mongoID);
    },
    attachUserToQuestionnaireInDB: function (userData) {
        return axios.post("/api/questionnaire/attachUserToQuestionnaire", userData);
    },
    deleteQuestionnaireInDB: function(questionnaireData){
        return axios.post("/api/questionnaire/deleteQuestionnaire", questionnaireData);
    },
    updateQuestionnaireInDB: function(userData){
        return axios.post("/api/questionnaire/updateQuestionnaire", userData)
    },
    updateQuestionnaireAnswersInDB: function (userData) {
        return axios.post("/api/questionnaire/updateQuestionnaireAnswers", userData)
    }

};