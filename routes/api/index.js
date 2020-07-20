const router = require("express").Router();
const userRoutes = require("./user");
const questionnaireRoutes = require("./questionnaire");
const questionRoutes = require("./question");

var express = require("express");
var app = express.Router();


// User routes
app.use("/user", userRoutes);

//Questionnaire Routes
app.use("/questionnaire", questionnaireRoutes);

//Question Routes
app.use("/question", questionRoutes);



module.exports = app;
