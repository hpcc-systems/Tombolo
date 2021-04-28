import { Row, Col,Spin, Table} from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js"
import { assetsActions } from "../../redux/actions/Assets";
import { connect } from 'react-redux';
import {
  withRouter,
} from "react-router-dom";

class IndexReport extends Component {
  constructor(props) {
    super(props);
  }

  handleAssetClick = (id) => {
    console.log('handleAssetClick: '+id+', '+this.props.application.applicationId)
    this.props.dispatch(assetsActions.assetSelected(
      id,
      this.props.application.applicationId,
      ''
    ));
    this.props.history.push('/' + this.props.application.applicationId + '/assets/index/' + id);
  }

  render() {
    const indexColumns = [{
      title: 'Title',
      dataIndex: 'title',
      render: (text, record) => (
        <span className="asset-name"><a href='#' onClick={(row) => this.handleAssetClick(record.id)}>{text}</a></span>
      )
      },
      {
        title: 'Name',
        dataIndex: 'name'
      },
      {
        title: 'Description',
        dataIndex: 'description'
    }];


    return (
      <div style={{"paddingLeft":"5px"}}>
        <Table
          columns={indexColumns}
          rowKey={record => record.id}
          dataSource={this.props.indexList}
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

const connectedIndexReport = connect(mapStateToProps)(withRouter(IndexReport));
export { connectedIndexReport as IndexReport };