import React from 'react';
import { Table } from 'antd';
import { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { authHeader, handleError } from '../../common/AuthHeader.js';
import BreadCrumbs from '../../common/BreadCrumbs';
import { Constants } from '../../common/Constants';
import Text from '../../common/Text';
import { dataflowSelected } from '@/redux/slices/DataflowSlice';

class DataflowInstances extends Component {
  state = {
    dataflows: [],
  };

  componentDidMount() {
    if (this.props.applicationId) this.fetchDataflows();
  }

  fetchDataflows = () => {
    fetch('/api/dataflow?application_id=' + this.props.applicationId, { headers: authHeader() })
      .then((response) => (response.ok ? response.json() : handleError(response)))
      .then((data) => this.setState({ dataflows: data }))
      .catch(console.log);
  };

  handleViewDetails = (record) => {
    const { id, title, clusterId } = record;
    const { dispatch, history, applicationId } = this.props;
    dispatch(dataflowSelected({ id, title, clusterId }));
    history.push(`/${applicationId}/dataflowinstances/dataflowInstanceDetails/${id}`);
  };

  render() {
    if (!this.props.applicationId) return null;

    const dataflowCols = [
      {
        title: <Text text="Name" />,
        dataIndex: 'title',
        width: '30%',
        render: (text, record) => <a onClick={() => this.handleViewDetails(record)}>{text}</a>,
      },
      {
        title: <Text text="Description" />,
        dataIndex: 'description',
        className: 'overflow-hidden',
        ellipsis: true,
        width: '30%',
        render: (text) => (
          <span className="description-text">
            <ReactMarkdown children={text} />
          </span>
        ),
      },
      {
        title: <Text text="Created" />,
        dataIndex: 'createdAt',
        width: '30%',
        render: (text) => {
          let createdAt = new Date(text);
          return (
            createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
            ' @ ' +
            createdAt.toLocaleTimeString('en-US')
          );
        },
      },
    ];
    return (
      <div>
        <BreadCrumbs />
        <div>
          <Table
            columns={dataflowCols}
            rowKey={(record) => record.id}
            dataSource={this.state.dataflows}
            pagination={this.state.dataflows > 10 ? { pageSize: 10 } : false}
            scroll={{ y: 380 }}
          />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { applicationTitle, applicationId } = state.application.application;
  return { applicationTitle, applicationId };
}

let connectedWorkflows = connect(mapStateToProps)(withRouter(DataflowInstances));

export default connectedWorkflows;
