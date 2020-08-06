import React, { Component } from "react";
import { Col, Row, Container } from "../../components/Grid";
import { Input, Button, TextArea } from "../../components/Form";
import API from "../../utils/API";
// import "./create-questionnaire.css";
import { Link } from "react-router-dom";
import Modal from "react-bootstrap/Modal";

class ViewQuestionnairePage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            formErrors: { questionText: "" },
            questionTextValid: false,
            isLogin: true,
            isNewQuestion: false,
            selectedQuestion: "",
            currentModalTitle: "View Question",
            currentQuestionIndex: 0,
            currentCompletedQuestionIndex: 0,
            showModal: false,
            showModal2: false,
            questionData: [],
            filteredCompletedQuestionData: [],
            filteredQuestionData: [],
            users: [{ text: 'Tyler', id: '1' }, { text: 'Tawny', id: '2' }, { text: 'Anthony', id: '3' }, { text: 'Arthur', id: '4' }],
            currentQuestionCommentInModal: "",
            questionTextInModal: "",
            questionStatusInModal: "",
            questionUserAssignedInModal: "",
            userFilter: "",
            statusFilter: "",
            questionnaireMongoID: "",
            questionnaireNameInTitle: "",
            formSubmitButtonText: "Submit",
            userFirstName: "",
            userLastName: "",
            showActiveQuestions: true,
            showCompletedQuestions: false,
            isCurrentQuestionCompleted: false
        };

    }

    delta = () => {
        this.setState({
            count: this.state.count + 1
        });
    }
    handleChange(e) {
        this.setState({ [e.target.id]: e.target.value });
    }
    //This method will handle all the form validation
    validateFields() {
        let fieldValidationErrors = this.state.formErrors;
        let questionTextValid = this.state.questionTextValid;


        questionTextValid = this.state.questionTextInModal.length > 0;
        fieldValidationErrors.questionText = questionTextValid ? "" : "Please add Question Text.";


        this.setState({
            formErrors: fieldValidationErrors,
            questionTextValid: questionTextValid
        }, () => {
            this.closeModal();
        });


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


    handleFormSubmit = event => {
        event.preventDefault();
        this.validateFields();
    };


    //************************** DB METHODS ************** THESE METHODS SAVE, EDIT, GET BUGS FROM DB *******************************************
    saveNewQuestionInDB = () => {
        var questionObj = {
            questionnaireMongoID: this.state.questionnaireMongoID,
            questionText: this.state.questionTextInModal,
        }

        API.saveQuestion(questionObj)
            .then(response => {

                if (!response.data.error) {

                    questionObj.mongoID = response.data.questionDoc._id;
                    questionObj.newMongoID = response.data.questionDoc._id;
                    questionObj.id = this.state.currentQuestionIndex;
                    questionObj.isCompleted = response.data.isCompleted;

                    this.setState({ showModal: false });
                    this.state.questionData.push(questionObj);
                    this.forceUpdate();
                } else {
                    this.setState({ errorResponse: response })
                }
            })
    }

    getQuestionsFromDB() {
        console.log("I'm in getQuestions from DB  --- " + this.state.questinnaireMongoID);
        API.getAllQuestions(this.state.questionnaireMongoID)
            .then(response => {
                if (!response.data.error) {
                    var questions = [];
                    var questionArrayFromDB = response.data.questionnaireDoc.questions;
                    //Loop through question data received from the server.
                    for (var i = 0; i < questionArrayFromDB.length; i++) {
                        questions.push({
                            mongoID: questionArrayFromDB[i]._id,
                            id: this.state.currentQuestionIndex,
                            questionText: questionArrayFromDB[i].questionText,
                        })

                        this.setState({ currentQuestionIndex: this.state.currentQuestionIndex + 1 });

                    }

                    this.setState({ questionData: questions });
                    this.forceUpdate();

                    //At default, we want to show all questions in the table
                    this.putAllQuestionsIntoFilteredArray();
                    this.forceUpdate();
                } else {
                    this.setState({ errorResponse: response })
                }
            }).catch(err => console.log(err));

    }

    closeModal = () => {
        this.setState({
            showModal: false, questionTextInModal: "", currentQuestionCommentInModal: "",
            questionStatusInModal: "", questionUserAssignedInModal: "", formErrors: { questionDescription: "" }
        });
    }
    //*********************** END OF MODAL BUTTON CLICK METHODS ****************************


    // ******************** THESE METHODS ARE CALLED WHEN CREATE/EDIT BUTTONS ARE FIRST CLICKED ******************
    editQuestionButton(questionClickedOn) {
        this.adjustQuestionDataOrder()
        this.setState({
            showModal: true,
            currentModalTitle: "Edit Question",
            currentQuestionIndex: questionClickedOn.id,
            questionTextInModal: questionClickedOn.questionText,
            isNewQuestion: false,
            selectedQuestion: questionClickedOn
        });
    }
    deleteQuestionButton(questionClickedOn) {
        this.deleteQuestionInDB(questionClickedOn);
    }

    createNewQuestionButton = () => {
        this.setState({ showModal: true, currentModalTitle: "Create Question", isNewQuestion: true, questionTextInModal: "" });
    }
    handleLogoutButtonClick = () => {
        window.location.reload(false);
    }
    // ******************** END OF INITIAL BUTTON CLICK METHODS ******************



    //CALLS THIS WHEN THE COMPONENT MOUNTS, basically "on page load"
    componentDidMount() {
        this.setState({
            questionnaireMongoID: this.props.location.state.questionnaireMongoID, questionnaireNameInTitle: this.props.location.state.questionnaireName,
            userFirstName: this.props.location.state.userFirstName, userLastName: this.props.location.state.userLastName
        }, () => {
            this.getQuestionsFromDB();
        });


    }

    putAllQuestionsIntoFilteredArray() {
        this.setState({ filteredQuestionData: [] });
        this.state.questionData.map(question => {
            return this.state.filteredQuestionData.push(question);
        });
    }
    adjustQuestionDataOrder() {
        //Update the current page's id of the question for UI purposes
        for (var i = 0; i < this.state.questionData.length; i++) {
            this.state.questionData[i].id = i;
        }
    }

    //If you click "Show Completed Questions" or "Hide Completed Questions", this will show or hide.
    swapRenderCompletedQuestions = () => {
        if (this.state.showCompletedQuestions) {
            this.setState({ showCompletedQuestions: false })
        } else {
            this.setState({ showCompletedQuestions: true })
        }

    }
    //If you click "Show Active Questions" or "Hide Active Questions", this will show or hide.
    swapRenderActiveQuestions = () => {
        if (this.state.showActiveQuestions) {
            this.setState({ showActiveQuestions: false })
        } else {
            this.setState({ showActiveQuestions: true })
        }
    }

    //Flip the value of "isCompleted" for the question
    completedCheck(question) {
        if (question.isCompleted) {
            question.isCompleted = false;
        } else {
            question.isCompleted = true;
        }

        this.setState({ selectedQuestion: question }, () => {
            this.updateQuestionInDB();
            this.forceUpdate();
        });

    }
    
    render() {


        return (
            <Container id="containerViewQuestions" fluid="true">
                <Link to={{ pathname: "/landing-page", state: { userFirstName: this.state.userFirstName, userLastName: this.state.userLastName } }} className="logoutButton"><Button id="logoutButton" onClick={this.handleLogoutButtonClick.bind(this)}>Logout</Button> </Link>
                <Row id="mainRow">
                    <Col size="sm-12">
                        <div className="jumbotron jumbotron-fluid">
                            <Container id="container" fluid="true">
                                <h1 className="display-4 QuestiontrackerTitle" id="questionnaireTitle">{this.state.questionnaireNameInTitle}</h1>
                                <h2 className="display-4 QuestionTrackerTitle">View Questions</h2>
                            </Container>
                        </div>
                        <br />
                        <br />
                        <Row>
                            <Col size="sm-2">
                                <Link to="/profile" className="log" ><Button>View Profile</Button></Link>
                            </Col>

                        </Row>

                        {this.state.showActiveQuestions ?
                            <div>
                                <h1 className="activeQuestionsTitle">Active Questions</h1>
                                {this.state.questionData.length ? (
                                    <table id="questionViewTable_Table" className="table table-hover questionViewTable_Table">
                                        <thead id="questionViewTable_head" className="thead-dark">
                                            <tr>
                                                <th className="questionViewTable_th" scope="col">Question</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this.state.filteredQuestionData.map(question => {
                                                return (
                                                    <tr className="questionViewTable_tr" key={question.mongoID}>
                                                        <td id="titleColumn" className="questionViewTable_td">{question.questionText}</td>
                                                    </tr>
                                                )

                                            })}
                                        </tbody>
                                    </table>


                                ) : (<h3 className="noResultsMessage"> No Results to Display </h3>)}
                            </div>



                            :


                            ""
                        }


                        <br />
                        <br />




                        {/* This modal will pop up for editing questions! */}
                        <Modal show={this.state.showModal} animation={false}>
                            <Modal.Header>
                                <Button className='btn btn-danger note-delete xButton' id="questionModalXButton" onClick={() => this.closeModal()}>X</Button>
                                <Modal.Title><h3>{this.state.currentModalTitle}</h3></Modal.Title>
                            </Modal.Header>
                            <Modal.Body>

                                <br />

                                <Input label="Enter your question below:" onBlur={this.formatInput.bind(this)} value={this.state.questionTextInModal} id="questionTextInModal" onChange={this.handleChange.bind(this)} name="questionTextInModal" />




                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="primary" onClick={this.handleFormSubmit}>
                                    Submit
                              </Button>
                            </Modal.Footer>
                        </Modal>




                    </Col>
                </Row>

            </Container>
        );

    }

}

export default ViewQuestionnairePage;
