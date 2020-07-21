import React, { Component } from "react";
import { Col, Row, Container } from "../../components/Grid";
import { Input, Button, TextArea } from "../../components/Form";
import API from "../../utils/API";
// import "./create-questionnaire.css";
import { Link } from "react-router-dom";
import Modal from "react-bootstrap/Modal";

class CreateQuestionnairePage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            questionnaireID: this.props.match.params.questionnaireID,
            questionnaireName: "",
            questions: []
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
                            this.setState({
                                questionnaireData: response.data,
                                questionnaireName: response.data.name,
                                questions: response.data.questions,
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

    saveQuestionnaireInDB = () => {
        
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
                                {this.state.questions.map(question => {
                                    return (
                                        <div>
                                        {/* <label htmlFor="questionHTML">{question.questionText} </label> */}
                                            <h3>{question.questionText}</h3>
                                            <select value={this.state.userFilter} onChange={this.handleChange.bind(this)} id="questionHTML" name="questionHTML">
                                            <option className="dropdown-item" href="#" value="Yes">Yes</option>
                                            <option className="dropdown-item" href="#" value="No">No</option>
                                            }
                                        </select>
                                        </div>
                                    )
                                })}
                            </form>
                            <Button type="button" className="btn btn-primary" onClick={this.saveQuestionnaireInDB}>Submit</Button>
                        </div>
                        
                        : ""}

                    </Col>
                </Row>

            </Container>
        );

    }
    
}

export default CreateQuestionnairePage;
