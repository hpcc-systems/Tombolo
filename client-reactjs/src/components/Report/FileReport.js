import { Spin,Tabs,Row, Col, Table} from 'antd/lib';
import React, { Component } from "react";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js";
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponent from 'react-plotly.js/factory';
import { assetsActions } from "../../redux/actions/Assets";
import {
  withRouter,
} from "react-router-dom";
const Plot = createPlotlyComponent(Plotly);

class FileReport extends Component {
  constructor(props) {
    super(props);
  }

  handleAssetClick = (id) => {
    this.props.dispatch(assetsActions.assetSelected(
      id,
      this.props.application.applicationId,
      ''
    ));
    this.props.history.push('/' + this.props.application.applicationId + '/assets/file/' + id);
  }

  render() {
    const indexColumns = [{
      title: 'Title',
      width: '35%',
      dataIndex: 'title',
      render: (text, record) => (
        <span className="asset-name"><a href='#' onClick={(row) => this.handleAssetClick(record.id)}>{text}</a></span>
      )
    },
    {
      title: 'Name',
      width: '35%',
      dataIndex: 'name'
    },
    {
      title: 'Description',
      width: '35%',
      dataIndex: 'description'
    }
    ];

    return (
      <div style={{"paddingLeft":"5px","backgroundColor":"#FFFFFF"}}>
        <Table
          columns={indexColumns}
          rowKey={record => record.id}
          dataSource={this.props.fileList}
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

const connectedFileReport = connect(mapStateToProps)(withRouter(FileReport));
export { connectedFileReport as FileReport };