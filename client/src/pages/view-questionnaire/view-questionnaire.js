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
        for (var i = 0; i < localAnswerHistoryQuestionnaire.length; i++) {
            var questionCount = 0;
            for (var j = 0; j < localAnswerHistoryQuestionnaire[i].answersArr.length; j++){
                currentID += (questionCount + localAnswerHistoryQuestionnaire[i].answersArr[j].questionAnswer.substring(0, 1))
                questionCount += 1;
            }

            //Add currentID to ProbabilityData, and then data to grab the next currentID
            if (probabilityData.hasOwnProperty(currentID)) {
                probabilityData[currentID].count += 1;
                currentID = "";
                questionCount = 1;
            } else {
                probabilityData[currentID] = {
                     count: 1,
                }
                currentID = "";
                questionCount = 1;
            }
        }




        //Now that we have counts of all the registration paths taken, we want to loop through the keys and values and add approbability probability for EACH question.

        var probabilityKeys = Object.keys(probabilityData);
        var probabilityValues = Object.values(probabilityData);
        var currentYesCount = 0;

        var currentYesAndNoCount = 0;

        var treeChildrenObjArr = [];
        //Grab the largest path of questions 
        var largestPathTaken = this.getLongestString(probabilityKeys);

        var largestPossibleNumberOfQuestions = largestPathTaken.length/2;
        if(largestPossibleNumberOfQuestions<1){
            largestPossibleNumberOfQuestions = 1;
        }

        //Iterate for EACH qestion will have ATLEAST one node in the tree
        for (var m = 0; m < largestPossibleNumberOfQuestions+1; m++){

            var totalPossiblePathsWithCurrentQuestion = Math.pow(2, m);
            var possiblePathsArr = [];
            var yes = true;
            var howLargeTheStringOfPathsAre = m;
            if (totalPossiblePathsWithCurrentQuestion !== 1) {
            //FOR EACH NODE OF THE SAME QUESTION, N IS THE CURRENT CURRENT PATH
                for(var n=0; n<totalPossiblePathsWithCurrentQuestion; n++){
                    var stringInPossiblePathsArrExists = true;
                    while(stringInPossiblePathsArrExists){
                        var newPathAttempt = "";
                        //ADD EVERY PREVIOUS CHOICE OF CURRENT PATH
                        for (var o = 0; o < howLargeTheStringOfPathsAre; o++) {
                            if (Math.random() < 0.5) {
                                newPathAttempt += o + "Y";
                            } else {
                                newPathAttempt += o + "N";
                            }
                        }
                    if (!possiblePathsArr.includes(newPathAttempt)) {
                        //THIS PATH DOESNT EXIST, SUCCESSFUL CREATION OF PATH
                        possiblePathsArr.push(newPathAttempt);
                        stringInPossiblePathsArrExists = false;
                    }

                    }
                }
            }

               console.log(possiblePathsArr); 
               //NOW WE HAVE EACH POSSIBLE PATH FOR THE CURRENT QUESTION NOW WE COUNT
             //LOOP THROUGH EACH POSSIBLE KEY TO ADD THE YES, NO COUNT FOR CURRENT QUESTION
                var correctPathCount = 0;
                var otherPathCount = 0;
                for(var y=0; y<possiblePathsArr.length; y++){
                    for (var x = 0; x < probabilityKeys.length; x++) {
                        if (probabilityKeys[x].includes(possiblePathsArr[y])) {
                            correctPathCount += probabilityValues[x].count;
                        } else {
                            otherPathCount += probabilityValues[x].count;
                        }
                    } 
                    //NOW THAT WE HAVE ALL THE COUNTS WE WANT TO EDIT THE TREE
                 var newNode = {
                     name: "test",
                    attributes: {
                            ChoseThisPath: correctPathCount,
                            ChoseOtherPath: otherPathCount,
                            Probability: correctPathCount / (correctPathCount + otherPathCount) * 100 + "%",
                        },
                        children: [

                        ],
                    };

                    treeChildrenObjArr.push(newNode); 

                }
                

        }

        //NOW WE WANT TO LOOP THROUGH EVERY CHILD AND ADD THE PROPER CHILD
        var finalTreeData = [
            {
                name: "Test",
                attributes: {
                    },
                children: [
                    ],
            }
        ]

        var currentObj = finalTreeData[0];

        var childrenCount =1;

        var currentObjIndex = 0;
        var numberOfNestedChildren = treeChildrenObjArr.length / 2;
        //var childrenString = "finalTreeData['children']"
        for (var z = 0; z < treeChildrenObjArr.length; z++){
            //finalTreeData['children'] = treeChildrenObjArr[z];
            var arrFromObj = Object.entries(currentObj);
            var result = {};
            var temp = result;
   
            temp = temp["children"] = [treeChildrenObjArr[z]];
            currentObjIndex += 1;


            finalTreeData[0].children = result;


            //newObj.push(treeChildrenObjArr[z])
            //childrenCount += 1;
            // if(childrenCount === 2) {
            //     //arrFromObj[currentObjIndex][1].push(treeChildrenObjArr[z]);
            //     currentObjIndex += 1;
            // } else {
            //     //arrFromObj[currentObjIndex].push(treeChildrenObjArr[z])
            // }
            //HOW MANY CHILDREN THERE ARE IN THIS OBJECT
        }
        console.log(finalTreeData);

        this.setState({
            treeData: finalTreeData
        })


    }

    addNewNode(d, item) {
    item.forEach(function (i) {
        if (d._children)
            d._children.push(i)//will add child to the closed node      
        else
            d.children.push(i)//will add child to expanded node.
    })
}

    nestedLoop(obj) {
    const res = {};
    function recurse(obj, current) {
        for (const key in obj) {
            let value = obj[key];
            if (value != undefined) {
                if (value && typeof value === 'object') {
                    recurse(value, key);
                } else {
                    // Do your stuff here to var value
                    res[key] = value;
                }
            }
        }
    }
    recurse(obj);
    return res;
    }

    setNest(obj, level, val) {
    if (level > 0) {
        this.setNest(obj['children'], level - 1, val);
    }
    else {
        obj.children = val;
    }
    }

   getLongestString(arr) { let longestStringArr = arr.sort((a, b) => a.length - b.length).reverse(); return longestStringArr[0]; }

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

                        <div id="treeWrapper" style={{ width: '100em', height: '50em' }}>

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
