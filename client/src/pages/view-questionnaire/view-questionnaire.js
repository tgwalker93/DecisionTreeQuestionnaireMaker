import React, { Component } from "react";
import { Col, Row, Container } from "../../components/Grid";
import { Input, Button, TextArea } from "../../components/Form";
import API from "../../utils/API";
// import "./create-questionnaire.css";
import { Link } from "react-router-dom";
import Tree from 'react-d3-tree';
import Modal from "react-bootstrap/Modal";

class BinaryTree {
    constructor(value) {
        this.root = value;
        this.left = null;
        this.right = null;
    }

    insert(value) {
        var queue = [];
        queue.push(this); //push the root
        while (true) {
            var node = queue.pop();
            if (node.left === null) {
                node.left = new BinaryTree(value);
                return;
            } else {
                queue.unshift(node.left)
            }

            if (node.right === null) {
                node.right = new BinaryTree(value);
                return;
            } else {
                queue.unshift(node.right)
            }
        }
    }
}

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
                    name: 'Question 1',
                    attributes: {
                        TotalAnswers: 20
                    },
                    children: [
                        {
                            name: 'Question 2: No to 1',
                            attributes: {
                                probability: '50%',
                                count: 10

                            },
                            children: [{
                                name: 'Leaf: No to 2',
                                attributes: {
                                    probability: '25%',
                                    count: 5
                                }
                            },
                            {
                                name: 'Leaf: Yes to 2',
                                attributes: {
                                    probability: '25%',
                                    count: 5
                                }
                            },
                            ]
                        },
                        {
                            name: 'Question 2: Yes to 1',
                            attributes: {
                                probability: '50%',
                                count: 10
                            },
                            children: [{
                                name: 'Leaf: No to 2',
                                attributes: {
                                    probability: '25%',
                                    count: 5
                                }
                            },
                            {
                                name: 'Leaf: Yes to 2',
                                attributes: {
                                    probability: '25%',
                                    count: 5
                                }
                            },
                            ]
                        },
                    ],
                },
            ],
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

        var treeChildrenObjArr = [];
        var finalTreeData = 
            {
                name: this.state.questionnaireNameInTitle,
                "ID": "0",
                "level": "0",
                attributes: {
                    TotalAnswers: localAnswerHistoryQuestionnaire.length
                },
                children: [
                ],
            }
        var currentParentID = 0;
        treeChildrenObjArr.push(finalTreeData);
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
                for(var y=0; y<possiblePathsArr.length; y++){
                    var correctPathCount = 0;
                    var otherPathCount = 0;
                    for (var x = 0; x < probabilityKeys.length; x++) {
                        if (probabilityKeys[x].includes(possiblePathsArr[y])) {
                            correctPathCount += probabilityValues[x].count;
                        } else {
                            otherPathCount += probabilityValues[x].count;
                        }
                    } 

                    currentParentID = possiblePathsArr[y];
                    currentID = possiblePathsArr[y];
                    if(possiblePathsArr[y].length > 2){
                        currentParentID = possiblePathsArr[y].substring(0, possiblePathsArr[y].length - 2);
                    }
                    if(m===1){
                        currentParentID = possiblePathsArr[y].substring(0, possiblePathsArr[y].length - 1)
                    }
                    
                    var currentAnswer = possiblePathsArr[y].substring(possiblePathsArr[y].length - 1, possiblePathsArr[y].length);
                    if (currentAnswer ==="Y") {
                        currentAnswer = "Yes";
                    }
                    if(currentAnswer === "N"){
                        currentAnswer = "No";
                    }
                    //NOW THAT WE HAVE ALL THE COUNTS WE WANT TO EDIT THE TREE
                 var newNode = {
                     name: "Question" + m + " - " + currentAnswer,
                     "ID": currentID,
                     "parentID": currentParentID,
                     "level": m.toString(),
                    attributes: {
                            ChoseThisPath: correctPathCount,
                            ChoseOtherPath: otherPathCount,
                            Answer: currentAnswer,
                            Probability: "~ " + Math.trunc(correctPathCount / (correctPathCount + otherPathCount) * 100) + "%",
                        },
                        children: null,
                    };

                    treeChildrenObjArr.push(newNode); 

                }
                

        }

        var finalTreeChildren = this.createDataTree(treeChildrenObjArr);

        this.setState({
            treeData: finalTreeChildren
        })



        

    }

    createDataTree = dataset => {
        let hashTable = Object.create(null)
        dataset.forEach(aData => hashTable[aData.ID] = { ...aData, children: [] })
        let dataTree = []
        // dataset.forEach(aData => {
        //     if (aData.parentID) hashTable[aData.parentID].children.push(hashTable[aData.ID])
        //     else dataTree.push(hashTable[aData.ID])
        // })
        for(var i=0; i<dataset.length; i++){
            if (dataset[i].parentID) {
                if(hashTable[dataset[i].parentID]){
                    hashTable[dataset[i].parentID].children.push(hashTable[dataset[i].ID]);
                }
            } else {
                dataTree.push(hashTable[dataset[i].ID]);
            }
        }
        return dataTree
    }

    list_to_tree(list) {
    var map = {}, node, roots = [], i;

    for (i = 0; i < list.length; i += 1) {
        map[list[i].id] = i; // initialize the map
        list[i].children = []; // initialize the children
    }

    for (i = 0; i < list.length; i += 1) {
        node = list[i];
        if (node.parentId !== "0") {
            // if you have dangling branches check that map[node.parentId] exists
            list[map[node.parentId]].children.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots;
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
