import React, { Component } from "react";
import { Col, Row, Container } from "../../components/Grid";
import { Input, Button } from "../../components/Form";
import API from "../../utils/API";
import "./profile.css";
import Modal from "react-bootstrap/Modal";
import { Link } from "react-router-dom";
import { withRouter } from 'react-router';
// import "bootstrap/dist/css/bootstrap.min.css";

class Profile extends Component {
    constructor(props) {
        super(props)
        this.state = {
            firstName:"",
            loggedIn: this.props.loggedIn,
            redirectTo: null,
            setPasswordFieldsActiveInModal: false,
            setCreateQuestionnaireFieldsActiveInModal: false,
            setJoinQuestionnaireFieldsActiveInModal: false,
            setEditQuestionnaireFieldsActiveInModal: false,
            setConfirmationBoxActiveInModal: false,
            formErrors: { oldPassword: "", newPassword1and2:"", questionnaireName:"", questionnaireID:"" },
            oldPassword: "",
            newPassword1: "",
            newPassword2: "",
            questionnaireNameInModal: "",
            questionnaireIDInModal: "",
            questionnaireMongoIDInModal: "",
            oldPasswordValid: true,
            newPassword1And2Valid: false,
            questionnaireNameValid: false,
            questionnaireIDValid: false,
            showModal: false,
            formSubmitButtonText: "Submit",
            successMessage: "",
            serverErrorMessage:"",
            currentModalTitle: "",
            userFirstName: "",
            userLastName: "",
            userData: [],
            questionnaires: []
        };
    }

    componentDidMount() {
        this.setState({ userFirstName: this.props.firstName, userLastName: this.props.lastName});
        this.getQuestionnairesOfUserInDB();
        
    }

    //This is used onBlur in order to trim the values. 
    formatInput = (event) => {
        const attribute = event.target.getAttribute('name')
        this.setState({ [attribute]: event.target.value.trim() })
    }

    //Standard method for constantly updating input, since UI is constantly refreshing
    handleChange(e) {
        this.setState({ [e.target.id]: e.target.value });
    }

    errorClass(error) {
        return (error.length === 0 ? "" : "has-error");
    }

    validateFields() {
        let fieldValidationErrors = this.state.formErrors;
        let newPassword1And2Valid = this.state.newPassword1And2Valid;
        let questionnaireNameValid =  this.state.questionnaireNameValid;
        let questionnaireIDValid = this.state.questionnaireIDValid;

        //Validating between the new password field and "confirm password" field that they match and are greather than or equal to 6 characters
        newPassword1And2Valid = (this.state.newPassword1 === this.state.newPassword2) && this.state.newPassword1.length >= 6;
        fieldValidationErrors.newPassword1and2 = "New password doesn't match or your password is less than 8 characters long.";

        //Validating that questionnaire is greater than 3 characters
        questionnaireNameValid = this.state.questionnaireNameInModal.length >= 3;
        fieldValidationErrors.questionnaireName = "Questionnaire Name must have atleast three characters.";

        //Validating that questionnaire ID is greater than 6 characters
        questionnaireIDValid = this.state.questionnaireIDInModal.length >= 6;
        fieldValidationErrors.questionnaireID = "Questionnaire ID must have atleast six characters.";

        this.setState({
            formErrors: fieldValidationErrors,
            newPassword1And2Valid: newPassword1And2Valid,
            questionnaireIDValid: questionnaireIDValid,
            questionnaireNameValid: questionnaireNameValid
        }, () => {
                if (this.state.setJoinQuestionnaireFieldsActiveInModal) {
                    //for JOIN questionnaire
                    if (questionnaireIDValid){
                     this.attachUserToQuestionnaireInDB();
                    }
                } else if (this.state.setCreateQuestionnaireFieldsActiveInModal) {
                    //For CREATE questionnaire
                    if(questionnaireNameValid && questionnaireIDValid){
                        this.saveQuestionnaireInDB();
                    }
                } else if (this.state.setEditQuestionnaireFieldsActiveInModal) {
                    //For UPDATE Questionnaire
                    if(questionnaireNameValid && questionnaireIDValid){

                        this.updateQuestionnaireInDB();
                    }
                } else if (this.state.setPasswordFieldsActiveInModal) {
                    //For UPDATE password
                    if (newPassword1And2Valid){     
                        this.updatePasswordInDB();
                    }
                }
        });
    }

    
    handleChangePasswordButtonClick = event => {
        this.setState({
            showModal: true,
            currentModalTitle: "Change Password",
            setPasswordFieldsActiveInModal: true
        });


    }


    //************************THESE METHODS ARE CALLED FROM BUTTONS WITHIN THE MODAL*********************
    updatePasswordInDB = () => {

        let userObj = {
            password: this.state.oldPassword,
            newPassword: this.state.newPassword1,
            username: this.props.username,
            mongoID: this.props.mongoID
        }
        API.updateUserInDB(userObj)
            .then(response => {

                if (!response.data.error) {
                    this.setState({ successMessage: "Successfully updated password."})
                    this.closeModal();

                } else {
                    this.setState({ serverErrorMessage: response.data.error, formErrors: { oldPassword: "", newPassword1and2: "", questionnaireName: "", questionnaireID: "", serverErrorMessage: "" }})
                }
            })
        
    }
    closeModal = () => {
        //Reset all the fields so they don't show up again when you try to open the modal again.
        this.setState({ showModal: false, questionnaireIDValid: true,
        questionnaireNameValid: true, oldPasswordValid: true, newPassword1Valid: true, newPassword2Valid: true,
            questionnaireNameInModal: "", questionnaireIDInModal: "", oldPassword: "", newPassword: "", newPassword2: "", serverErrorMessage:"",
            formErrors: { oldPassword: "", newPassword1and2: "", questionnaireName: "", questionnaireID: "", serverErrorMessage: "", formSubmitButtonText: "Submit" } });
    }
    //*********************** END OF MODAL BUTTON CLICK METHODS ****************************

    //*************************METHODS BELOW RELATED TO ORGANIZATION BUTTON CLICKS ******************/
    handleEditQuestionnaireButtonClick(questionnaireClickedOn) {
        //event.preventDefault();

        this.setState({
            showModal: true,
            currentModalTitle: "Edit Questionnaire",
            setCreateQuestionnaireFieldsActiveInModal: false,
            setEditQuestionnaireFieldsActiveInModal: true,
            setJoinQuestionnaireFieldsActiveInModal: false,
            setPasswordFieldsActiveInModal: false,
            setConfirmationBoxActiveInModal: false,
            successMessage: "",
            questionnaireMongoIDInModal: questionnaireClickedOn._id,
            questionnaireNameInModal: questionnaireClickedOn.name,
            questionnaireIDInModal: questionnaireClickedOn.questionnaireID
        });
    }

    handleCreateQuestionnaireButtonClick = event => {
        this.setState({
            showModal: true,
            currentModalTitle: "Create Questionnaire",
            setPasswordFieldsActiveInModal: false,
            setCreateQuestionnaireFieldsActiveInModal: true,
            setJoinQuestionnaireFieldsActiveInModal: false,
            setConfirmationBoxActiveInModal: false,
            successMessage: "",
            questionnaireIDInModal: "",
            questionnaireNameInModal: ""
        });

    }

    handleJoinQuestionnaireButtonClick = event => {
        this.setState({
            showModal: true,
            currentModalTitle: "Join Questionnaire",
            setPasswordFieldsActiveInModal: false,
            setCreateQuestionnaireFieldsActiveInModal: false,
            setConfirmationBoxActiveInModal: false,
            successMessage: "",
            setJoinQuestionnaireFieldsActiveInModal: true
        })

    }
    handleDeleteOrLeaveButtonClick(questionnaire) {
        this.setState({ setConfirmationBoxActiveInModal: true, showModal: true, currentQuestionnaire: questionnaire,
            currentModalTitle: "",
            setPasswordFieldsActiveInModal: false,
            setCreateQuestionnaireFieldsActiveInModal: false,
            setJoinQuestionnaireFieldsActiveInModal: false,
            formSubmitButtonText: "Confirm",
            successMessage: "",
            questionnaireIDInModal: "",
            questionnaireNameInModal: ""    
        });
    }

    //*** METHODS BELOW RELATED TO DB WITH ORGANIZATIONS */ */
    saveQuestionnaireInDB() {
        let userObj = {
            password: this.state.oldPassword,
            newPassword: this.state.newPassword1,
            username: this.props.username,
            mongoID: this.props.mongoID,
            questionnaireName: this.state.questionnaireNameInModal,
            questionnaireID: this.state.questionnaireIDInModal,
            userFirstName: this.props.firstName,
            userLastName: this.props.lastName
        }

        API.saveQuestionnaireInDB(userObj)
            .then(response => {

                if (!response.data.error) {
                    this.closeModal();
                    this.getQuestionnairesOfUserInDB();
                    this.forceUpdate();

                } else {
                    //Now we set the error message in the modal.
                    this.setState({serverErrorMessage: response.data.error})
                }
            })
            .catch(err => console.log(err));

    }

    getQuestionnairesOfUserInDB() {
        let userObj = {
            password: this.state.oldPassword,
            newPassword: this.state.newPassword1,
            username: this.props.username,
            mongoID: this.props.mongoID
        }

        API.getQuestionnairesOfUserInDB(userObj)
            .then(response => {

                if (!response.data.error) {
                    //If we find no error, then we successful got the user's list of questionnaires. Update state with questionnaires.
                    console.log("I got questionnaires back from DB!");
                    console.log(response);
                    this.setState({
                        questionnaires: response.data.questionnaires,
                    })

                }
            })
            .catch(err => console.log(err));
    }

    attachUserToQuestionnaireInDB() {
        let userObj = {
            password: this.state.oldPassword,
            newPassword: this.state.newPassword1,
            username: this.props.username,
            mongoID: this.props.mongoID,
            questionnaireID: this.state.questionnaireIDInModal,
            userFirstName: this.props.firstName,
            userLastName: this.props.lastName
        }
        API.attachUserToQuestionnaireInDB(userObj)
            .then(response => {

                if (!response.data.error) {
                    //If we find no error, then we successful got the user's list of questionnaires. Update state with questionnaires.
                    this.setState({
                        questionnaires: response.data.questionnaires,
                        successMessage: "You successfully joined the questionnaire!"
                    })
                    this.closeModal();
                    this.getQuestionnairesOfUserInDB();
                    this.forceUpdate();

                } else {
                    //Now we set the error message in the modal.
                    this.setState({ serverErrorMessage: response.data.error });
                }
            })
            .catch(err => console.log(err));
    }

    handleDeleteQuestionnaireInDB(questionnaireClickedOn) {
        var isUserQuestionnaireOwner = false;
        if (this.props.mongoID === questionnaireClickedOn.userWhoCreatedOrgMongoID){
            isUserQuestionnaireOwner = true;
        }
        var questionnaireObj = {
            questionnaireMongoID: questionnaireClickedOn._id,
            userMongoID: this.props.mongoID,
            questionnaireData: questionnaireClickedOn,
            isUserQuestionnaireOwner: isUserQuestionnaireOwner,
            userFirstName: this.state.userFirstName,
            userLastName: this.state.userLastName
        }
        API.deleteQuestionnaireInDB(questionnaireObj)
            .then(res => {
                this.setState({currentQuestionnaire: ""});
                this.getQuestionnairesOfUserInDB();
                this.forceUpdate();
            })
            .catch(err => console.log(err));
    }

    updateQuestionnaireInDB() {
        let userObj = {
            password: this.state.oldPassword,
            newPassword: this.state.newPassword1,
            username: this.props.username,
            mongoID: this.props.mongoID,
            questionnaireMongoID: this.state.questionnaireMongoIDInModal,
            questionnaireName: this.state.questionnaireNameInModal,
            questionnaireID: this.state.questionnaireIDInModal,
            userFirstName: this.props.firstName,
            userLastName: this.props.lastName
        }

        API.updateQuestionnaireInDB(userObj)
            .then(response => {
                //If not error from server
                if (!response.data.error) {
                    this.closeModal();
                    this.getQuestionnairesOfUserInDB();
                    this.forceUpdate();

                }
            })
            .catch(err => console.log(err));
    }

    handleSubmitButtonInModalClick = () => {
        if(this.state.setConfirmationBoxActiveInModal){
            //In this case we are confirming to delete or leave an questionnaire.
            this.setState({setConfirmationBoxActiveInModal: false, showModal: false}, () => {
                    this.handleDeleteQuestionnaireInDB(this.state.currentQuestionnaire);
            }
            )
        }else {
            this.validateFields();
        }
    }

    handleLogoutButtonClick = () => {
        window.location.reload(false);
    }
    
    
    render() {
        return (
            <Container id="containerViewQuestions" fluid="true">

                <Link to={{ pathname: "/landing-page", state: { userFirstName: this.state.userFirstName, userLastName: this.state.userLastName } }} className="logoutButton"><Button id="logoutButton" onClick={this.handleLogoutButtonClick.bind(this)}>Logout</Button> </Link>
                <Row id="mainRow">
                    <Col size="sm-12">
                        <div className="jumbotron jumbotron-fluid">
                            <Container id="container" fluid="true">
                                <h1 className="display-4 QuestionTrackerTitle">Welcome, {this.props.firstName}!</h1>
                                <h2 className="display-4 QuestionTrackerTitle" id="successMessage">{this.state.successMessage}</h2>
                            </Container>
                        </div>
                        <Button onClick={this.handleChangePasswordButtonClick.bind(this)}>Change Password</Button>
                        <Button onClick={this.handleCreateQuestionnaireButtonClick.bind(this)}>Create Questionnaire</Button>
                        <Button onClick={this.handleJoinQuestionnaireButtonClick.bind(this)}>Answer Questionnaire</Button>
                        <br />
                        <br />
                        {this.state.questionnaires.length > 0 ? (
                            <table id="questionnaireTable_Table" className="table table-hover questionViewTable_Table">
                                <thead id="questionnaireTable_head" className="thead-dark">
                                    <tr>
                                        <th className="questionnaireTable_th" scope="col">Name</th>
                                        <th className="questionnaireTable_th" scope="col">Questionnaire ID</th>
                                        <th className="questionnaireTable_th" scope="col"></th>
                                        <th className="questionnaireTable_th" scope="col"></th>
                                        <th className="questionnaireTable_th" scope="col"></th>
                                        <th className="questionnaireTable_th" scope="col"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.questionnaires.map(questionnaire => {
                                        return (
                                            <tr className="questionnaireTable_tr" key={questionnaire._id}>
                                                <td id="questionnaireNameColumn" className="questionnaireTable_td">{questionnaire.name}</td>
                                                <td id="questionnaireIDColumn" className="questionnaireTable_td">{questionnaire.questionnaireID}</td>
                                                <td id="viewQuestionColumn" className="questionnaireTable_td">
                                                    
                                                    <Link to={{pathname: "/create-questionnaire", state: {questionnaireMongoID: questionnaire._id, questionnaireName: questionnaire.name, questionnaireUsers: questionnaire.users, userFirstName: this.state.userFirstName, userLastName: this.state.userLastName}}} className="log" ><Button>Edit Questions</Button></Link>
                                                    </td>
                                                <td id="viewQuestionColumn" className="questionnaireTable_td">

                                                    <Link to={{ pathname: "/view-questionnaire", state: { questionnaireMongoID: questionnaire._id, questionnaireName: questionnaire.name, questionnaireUsers: questionnaire.users, userFirstName: this.state.userFirstName, userLastName: this.state.userLastName } }} className="log" ><Button>View Questionnaire Decision Tree</Button></Link>
                                                </td>
                                                <td id="editColumn" className="questionnaireTable_td">
                                                    {this.props.mongoID === questionnaire.userWhoCreatedOrgMongoID ?
                                                        <Button variant="primary" onClick={() => this.handleEditQuestionnaireButtonClick(questionnaire)}>
                                                            Edit Questionnaire
                                                        </Button> : ""

                                                    }
                                                </td>
                                                <td id="deleteColumn" className="questionnaireTable_td">
                                                    {this.props.mongoID === questionnaire.userWhoCreatedOrgMongoID ?

                                                        < Button variant="primary" onClick={() => this.handleDeleteOrLeaveButtonClick(questionnaire)}>Delete</Button> 
                                                        : 
                                                        <Button variant="primary" onClick={() => this.handleDeleteOrLeaveButtonClick(questionnaire)}>Leave</Button> 
                                                    }
                                                     </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>


                        ) : (<h3 id="noResultsHeader"> No Results to Display </h3>)}
                        <br />
                        <br />

                        {/* This modal will pop up for changing password! */}
                        <Modal show={this.state.showModal} animation={false}>
                            <Modal.Header>
                                <Modal.Title><h3>{this.state.currentModalTitle}</h3></Modal.Title>
                            </Modal.Header>
                            <Modal.Body>

                                {this.state.setConfirmationBoxActiveInModal ?
                                    <h1 id="confirmationHeader">Are you sure?</h1>   
                                :
                                    <div>
                                        {this.state.setPasswordFieldsActiveInModal ?
                                            <div>
                                                <Input type="password" label="Old Password" onBlur={this.formatInput.bind(this)}
                                                    isvalid={this.state.oldPasswordValid.toString()}
                                                    fielderror={this.state.formErrors.oldPassword}
                                                    formgroupclass={`form-group ${this.errorClass(this.state.formErrors.oldPassword)}`}
                                                    value={this.state.oldPassword}
                                                    id="oldPassword"
                                                    onChange={this.handleChange.bind(this)}
                                                    name="oldPassword"></Input>

                                                <Input type="password" label="New Password" onBlur={this.formatInput.bind(this)}
                                                    isvalid={this.state.newPassword1And2Valid.toString()}
                                                    fielderror={this.state.formErrors.newPassword1and2}
                                                    formgroupclass={`form-group ${this.errorClass(this.state.formErrors.newPassword1and2)}`}
                                                    value={this.state.newPassword1and2}
                                                    id="newPassword1" onChange={this.handleChange.bind(this)}
                                                    name="newPassword1"></Input>

                                                <Input type="password" label="Confirm New Password" onBlur={this.formatInput.bind(this)} isvalid={this.state.newPassword1And2Valid.toString()}
                                                    fielderror={this.state.formErrors.newPassword1and2}
                                                    formgroupclass={`form-group ${this.errorClass(this.state.formErrors.newPassword1and2)}`}
                                                    value={this.state.newPassword2}
                                                    id="newPassword2"
                                                    onChange={this.handleChange.bind(this)}
                                                    name="newPassword2"></Input>

                                            </div>
                                            :
                                            <div>
                                                {this.state.setJoinQuestionnaireFieldsActiveInModal ?
                                                    <div>
                                                        <Input label="Please enter the Questionnaire ID of the questionnaire you wish to join:" onBlur={this.formatInput.bind(this)}
                                                            isvalid={this.state.questionnaireIDValid.toString()}
                                                            fielderror={this.state.formErrors.questionnaireID}
                                                            formgroupclass={`form-group ${this.errorClass(this.state.formErrors.questionnaireID)}`}
                                                            value={this.state.questionnaireIDInModal}
                                                            id="questionnaireIDInModal" onChange={this.handleChange.bind(this)}
                                                            name="questionnaireIDInModal"></Input>

                                                    </div>
                                                    :
                                                    <div>
                                                        <Input label="Questionnaire Name" onBlur={this.formatInput.bind(this)}
                                                            isvalid={this.state.questionnaireNameValid.toString()}
                                                            fielderror={this.state.formErrors.questionnaireName}
                                                            formgroupclass={`form-group ${this.errorClass(this.state.formErrors.questionnaireName)}`}
                                                            value={this.state.questionnaireNameInModal}
                                                            id="questionnaireNameInModal"
                                                            onChange={this.handleChange.bind(this)}
                                                            name="questionnaireNameInModal"></Input>

                                                        <Input label="Questionnaire ID (Use this ID to invite people)" onBlur={this.formatInput.bind(this)}
                                                            isvalid={this.state.questionnaireIDValid.toString()}
                                                            fielderror={this.state.formErrors.questionnaireID}
                                                            formgroupclass={`form-group ${this.errorClass(this.state.formErrors.questionnaireID)}`}
                                                            value={this.state.questionnaireIDInModal}
                                                            id="questionnaireIDInModal" onChange={this.handleChange.bind(this)}
                                                            name="questionnaireIDInModal"></Input>
                                                    </div>

                                                }

                                            </div>

                                        }

                                    </div>
                                }
                        
                                <span className="help-block serverErrorMessage">{this.state.serverErrorMessage}</span>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={this.closeModal}>
                                    Cancel
                                  </Button>
                                <Button variant="primary" onClick={this.handleSubmitButtonInModalClick.bind(this)}>
                                {this.state.formSubmitButtonText}
                                </Button>

                            </Modal.Footer>
                        </Modal>






                    </Col>
                </Row>

            </Container>
        );

    
}
}

// export default Profile;
export default withRouter(Profile);