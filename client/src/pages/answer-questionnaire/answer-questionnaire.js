import React, { Component } from "react";
import { Col, Row, Container } from "../../components/Grid";
import { Input, Button, TextArea } from "../../components/Form";
import API from "../../utils/API";
// import "./create-questionnaire.css";
import { Link } from "react-router-dom";
import Modal from "react-bootstrap/Modal";

class AnswerQuestionnairePage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            questionnaireID: this.props.match.params.questionnaireID,
            questionnaireName: "",
            test:"",
            questions: [],
            errorResponse: null
        };

    }

    componentDidMount() {
        this.getQuestionnaireFromDB();
    }

    getQuestionnaireFromDB() {

            let questionnaireObj = {
                questionnaireID: this.state.questionnaireID
            }

        API.getQuestionnaireFromDB(questionnaireObj)
                .then(response => {

                    if (!response.data.error) {
                        //If we find no error, then we successful got the user's list of questionnaires. Update state with questionnaires.
                        console.log("I got questionnaire back from DB!");
                        console.log(response);

                        if(response.data.questions !== null){
                            for(var i=0; i<response.data.questions.length; i++){
                                var answerKey = {  }
                                answerKey["answer"+response.data.questions[i].questionID] = ""
                                this.setState(answerKey)
                            }
                            console.log(response.data);
                            this.setState({
                                questionnaireData: response.data,
                                questionnaireName: response.data.name,
                                questions: response.data.questions
                            })
                        }

                    }
                })
                .catch(err => console.log(err));
  
    }

    handleChange(e) {
        this.setState({ [e.target.id]: e.target.value });
    }   
    //This method will handle all the form validation
    //TODO
    validateFields() {

    }

    //Here we check if the field has an error. If it does, it will add the "has-error" class to the field.
    //"has-error" is a default bootstrap class that will nicely color the outline of the field red to indicate an error for the user. 
    errorClass(error) {
        return (error.length === 0 ? "" : "has-error");
    }

    //This is used onBlur in order to trim the values. 
    formatInput = (event) => {
        const attribute = event.target.getAttribute('name')
        this.setState({ [attribute]: event.target.value.trim() })
    }

    updateQuestionnaireInDB = () => {

        console.log("UPDATE QUESTIONS!!");

        for(var i=0; i<this.state.questionnaireData.questions.length; i++){
            var currentQuestion = this.state.questionnaireData.questions[i];
            //Adding to the history of answers for a specific question!
            currentQuestion.answerHistory.push(this.state["answer"+currentQuestion.questionID]);
        }
        this.state.questionnaireData["isFromAnswerQuestionnaire"] = true;
        this.state.questionnaireData["questionnaireMongoID"] = this.state.questionnaireData._id;
        this.state.questionnaireData["questionnaireName"] = this.state.questionnaireData.name;
        console.log(this.state.questionnaireData);
        API.updateQuestionnaireInDB(this.state.questionnaireData)
            .then(response => {
                console.log("test 123");
                console.log(response);
                if (response.data) {
                    if(response.data.error){
                        return;
                    }
                    this.setState({ 
                        questionnaireData: response.data,
                        questionnaireName: response.data.name,
                        questions: response.data.questions
                    });
                } else {
                    this.setState({ errorResponse: response })
                }
            })

    }

    handleFormSubmit = event => {
        event.preventDefault();
        this.validateFields();
    };

    render() {
        return (
            <Container id="containerViewQuestions" fluid="true">
                <Row id="mainRow">
                    <Col size="sm-12">
                        <div className="jumbotron jumbotron-fluid">
                            <h1>{this.state.questionnaireName}</h1>
                        </div>
                        <br />
                        {this.state.questions ? 
                        
                        <div>
                            <form>
                                    {this.state.questions.map((question, i) => {
                                    return (
                                        <div>
                                            <h3>{question.questionText}</h3>
                                            <select key={i} value={this.state["answer"+question.questionID]} onChange={this.handleChange.bind(this)} id={"answer" + question.questionID} name={"answer" + question.questionID}>
                                            <option className="dropdown-item" href="#" value=""></option>
                                            <option className="dropdown-item" href="#" value="Yes">Yes</option>
                                            <option className="dropdown-item" href="#" value="No">No</option>       
                                            </select> 
                                        </div>
                                    )
                                })} 
                            </form>
                                <Button type="button" className="btn btn-primary" onClick={this.updateQuestionnaireInDB}>Submit</Button>
                        </div>
                        
                        : ""}

                    </Col>
                </Row>

            </Container>
        );

    }
    
}

export default AnswerQuestionnairePage;
