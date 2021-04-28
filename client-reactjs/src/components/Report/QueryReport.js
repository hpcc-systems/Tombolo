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

class QueryReport extends Component {

  handleAssetClick = (id) => {
    this.props.dispatch(assetsActions.assetSelected(
      id,
      this.props.application.applicationId,
      ''
    ));
    this.props.history.push('/' + this.props.application.applicationId + '/assets/query/' + id);
  }

  render() {
    const queryColumns = [{
      title: 'Title',
      dataIndex: 'title',
      render: (text, record) => (
        <span className="asset-name"><a href='#' onClick={(row) => this.handleAssetClick(record.id)}>{text}</a></span>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description'
    },
    {
      title: 'Type',
      dataIndex: 'type'
    }];

    return (
      <div style={{"paddingLeft":"5px"}}>
        <Table
          columns={queryColumns}
          rowKey={record => record.id}
          dataSource={this.props.queryList}
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

const connectedQueryReport = connect(mapStateToProps)(withRouter(QueryReport));
export { connectedQueryReport as QueryReport };