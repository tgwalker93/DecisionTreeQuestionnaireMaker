import React, { Component } from "react";
import { Col, Row, Container } from "../../components/Grid";
import { Input, Button, TextArea } from "../../components/Form";
import API from "../../utils/API";
// import "./create-questionnaire.css";
import { Link } from "react-router-dom";
import Tree from 'react-d3-tree';
import Modal from "react-bootstrap/Modal";

class BinaryTree{
    value;
    left;
    right;

BinaryTree(values){ 
    this(values, 0);
}

BinaryTree(values, index)
{
    Load(this, values, index);
}

Load(tree,values,index)
{
    this.value = values[index];
    if (index * 2 + 1 < values.Length) {
        this.left = new BinaryTree(values, index * 2 + 1);
    }
    if (index * 2 + 2 < values.Length) {
        this.right = new BinaryTree(values, index * 2 + 2);
    }
}
}
export default ViewQuestionnairePage;
