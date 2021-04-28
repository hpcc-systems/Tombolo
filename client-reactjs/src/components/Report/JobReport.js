import { Spin, Table} from 'antd/lib';
import React, { Component } from "react";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import { assetsActions } from "../../redux/actions/Assets";
import {
  withRouter,
} from "react-router-dom";

class JobReport extends Component {
  state = {
    jobList:this.props.jobList,
    openJobDetails:false,
    jobFields:[],
    selectedJobTitle:"",
    selectedJobId:"",
    initialDataLoading: false
  }

  handleAssetClick = (id) => {
    console.log('handleAssetClick: '+id+', '+this.props.application.applicationId)
    this.props.dispatch(assetsActions.assetSelected(
      id,
      this.props.application.applicationId,
      ''
    ));
    this.props.history.push('/' + this.props.application.applicationId + '/assets/job/' + id);
  }

  render() {
    const jobColumns = [{
      title: 'Title',
      dataIndex: 'name',
      render: (text, record) => (
        <span className="asset-name"><a href='#' onClick={(row) => this.handleAssetClick(record.id)}>{text}</a></span>
      )
    },
    {
      title: 'Author',
      dataIndex: 'author'
    },
    {
      title: 'Description',
      dataIndex: 'description'
    },
    {
      title: 'Type',
      dataIndex: 'jobType'
    }];


    return (
      <div style={{"paddingLeft":"5px"}}>
        <Table
          columns={jobColumns}
          rowKey={record => record.id}
          dataSource={this.props.jobList}
          pagination={{ pageSize: 50 }}/>

      </div>
    )
  }
}

function mapStateToProps(state) {
  const { application } = state.applicationReducer;
  return {
    application
  };
}

const connectedJobReport = connect(mapStateToProps)(withRouter(JobReport));
export { connectedJobReport as JobReport };