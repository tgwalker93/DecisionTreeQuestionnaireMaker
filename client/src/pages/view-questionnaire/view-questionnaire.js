import React, { Component } from "react";
import { Col, Row, Container } from "../../components/Grid";
import { Input, Button, TextArea } from "../../components/Form";
import API from "../../utils/API";
// import "./create-questionnaire.css";
import { Link } from "react-router-dom";
import Tree from 'react-d3-tree';
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
            isCurrentQuestionCompleted: false,
            treeData: [
                {
                    name: 'Top Level',
                    attributes: {
                        keyA: 'val A',
                        keyB: 'val B',
                        keyC: 'val C',
                    },
                    children: [
                        {
                            name: 'Level 2: A',
                            attributes: {
                                keyA: 'val A',
                                keyB: 'val B',
                                keyC: 'val C',
                            },
                            children: [{
                                name: 'Level 3: A',
                                attributes: {
                                    keyA: 'val A',
                                    keyB: 'val B',
                                    keyC: 'val C',
                                }
                            },
                             {
                                    name: 'Level 3: A',
                                    attributes: {
                                        keyA: 'val A',
                                        keyB: 'val B',
                                        keyC: 'val C',
                                    }
                            },
                        ]
                        },
                        {
                            name: 'Level 2: B',
                            attributes: {
                                keyA: 'val A',
                                keyB: 'val B',
                                keyC: 'val C',
                            },
                        },
                    ],
                },
            ]
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

    getQuestionsFromDB() {
        console.log("I'm in getQuestions from DB  --- " + this.state.questinnaireMongoID);
        API.getAllQuestions(this.state.questionnaireMongoID)
            .then(response => {
                if (!response.data.error) {
                    var questions = [];
                    var questionArrayFromDB = response.data.questionnaireDoc.questions;
                    console.log("QUESTIONS CAME IN!");
                    console.log(questionArrayFromDB);
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

                    //Lastly, we create our decision tree!
                    this.createDecisionTree(response.data.questionnaireDoc.answerHistoryQuestionnaire);

                } else {
                    this.setState({ errorResponse: response })
                }
            }).catch(err => console.log(err));

    }

    createDecisionTree(localAnswerHistoryQuestionnaire) {

    
    var newTreeData = [
             {
            //     name: 'Top Level',
            //     attributes: {
            //         keyA: 'val A',
            //         keyB: 'val B',
            //         keyC: 'val C',
            //     },
            //     children: [
            //         {
            //             name: 'Level 2: A',
            //             attributes: {
            //                 keyA: 'val A',
            //                 keyB: 'val B',
            //                 keyC: 'val C',
            //             },
            //         },
            //         {
            //             name: 'Level 2: B',
            //         },
            //     ],
             }
        ]

      if(!localAnswerHistoryQuestionnaire){
          return;
      }
      var probabilityData = {};
        var currentID = "";
        var questionCount = 1;
        for (var i = 0; i < localAnswerHistoryQuestionnaire.length; i++) {
            for (var j = 0; j < localAnswerHistoryQuestionnaire[i].answersArr.length; j++){
                currentID += (questionCount + localAnswerHistoryQuestionnaire[i].answersArr[j].questionAnswer)
            }
            if (probabilityData.hasOwnProperty(currentID)) {
                probabilityData[currentID].count += 1;
            } else {
                probabilityData[currentID] = {
                     count: 1,
                }
            }
        }


        var probabilityKeys = Object.keys(probabilityData);
        var probabilityValues = Object.values(probabilityData);
        var currentYesCount = 0;
        var currentNoCount = 0;
        var current1YesString = "1Yes";
        var current1NoString = "1No";

        for (var x = 0; x < probabilityKeys.length; x++){
            if (probabilityKeys[x].includes(current1YesString)) {
                currentYesCount += 1;
            }
            if (probabilityKeys[x].includes(current1NoString)){
                currentNoCount += 1;
            }
        }

        if (localAnswerHistoryQuestionnaire){
            newTreeData[0] = {
                name: localAnswerHistoryQuestionnaire[0].answersArr[0].questionText,
                attributes: {
                    Yes: currentYesCount,
                    No: currentNoCount,
                    // YesProbability: currentYesCount / (localAnswerHistoryQuestionnaire[0].answersArr.length)*100+"%",
                    // NoProbability: currentNoCount / (localAnswerHistoryQuestionnaire[0].answersArr.length)*100+"%",
                },
                children: [

                ],
            };
        }

        var treeDepth = 1;
        var currentDataTree = newTreeData[0];
        var howManyQuestionsThereAre = localAnswerHistoryQuestionnaire[0].answersArr.length;
        var currentCount = 1;
        var currentIDString = "";
        var currentChild = "newTreeData[0].children";
        for (var k = 1; k < howManyQuestionsThereAre; k++) {
            treeDepth = treeDepth * 2;
            for (var l = 0; l < treeDepth; l++) {
                currentIDString += currentCount + localAnswerHistoryQuestionnaire[k].answersArr[l].questionAnswer;

            }

            if (probabilityKeys.includes(currentIDString)) {

                var totalCount = 0;
                var totalStringCount = currentIDString.length;
                for (var x = 0; x < probabilityKeys.length; x++) {
                    if (probabilityKeys[x].length <= totalStringCount) {
                        totalCount += 1;
                    }
                    
                }
                
                eval(currentChild).push({
                    name: localAnswerHistoryQuestionnaire[0].answersArr[0].questionText,
                    attributes: {
                        Yes: 0,
                        No: 0,
                        probability: probabilityValues[probabilityKeys.indexOf[currentIDString]].count / (totalCount) * 100 + "%",
                    },
                    children: [

                    ],
                })

               currentChild += "["+l+"].currentChild";
                
            }
        }


        this.setState({
            treeData: newTreeData
        })



    //   for (var i = 0; i < questions.length; i++) {
    //       probabilityData[i].push({
    //           questionText: questions[i].questionText,
    //           yesCount: 0,
    //           noCount: 0          
    //         });
    //         for(var j=0; j< questions[i].answerHistory.length; j++){
    //             if (questions[i].answerHistory[j] = "Yes"){
    //                 probabilityData[i].yesCount += 1;
    //             } 
    //             if(questions[i].answerHistory[j] = "No"){
    //                 probabilityData[i].noCount += 1;
    //             }
    //         }
    //     }

    }

    calculateYesCount(){

    }

    closeModal = () => {
        this.setState({
            showModal: false, questionTextInModal: "", currentQuestionCommentInModal: "",
            questionStatusInModal: "", questionUserAssignedInModal: "", formErrors: { questionDescription: "" }
        });
    }
    //*********************** END OF MODAL BUTTON CLICK METHODS ****************************


    // ******************** THESE METHODS ARE CALLED WHEN CREATE/EDIT BUTTONS ARE FIRST CLICKED ******************
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

                        <div id="treeWrapper" style={{ width: '50em', height: '50em' }}>

                            <Tree data={this.state.treeData} orientation="vertical"/>

                        </div>

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

                    </Col>
                </Row>

            </Container>
        );

    }

}

export default ViewQuestionnairePage;
