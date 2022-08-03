import { Table } from 'antd/lib';
import { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { dataflowAction } from '../../../redux/actions/Dataflow';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import BreadCrumbs from '../../common/BreadCrumbs';
import { Constants } from '../../common/Constants';
class DataflowInstances extends Component {
  state = {
    applicationId: this.props.application ? this.props.application.applicationId : '',
    applicationTitle: this.props.application ? this.props.application.applicationTitle : '',
    dataflows: [],
  };

  componentDidMount() {
    this.fetchDataflows();
  }

  fetchDataflows = () => {
    let _self = this;
    if (this.state.applicationId) {
      fetch('/api/dataflow?application_id=' + this.state.applicationId, {
        headers: authHeader(),
      })
        .then(function (response) {
          if (response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then(function (data) {
          _self.setState({
            dataflows: data,
          });
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  handleViewDetails = (record) => {
    this.props.dispatch(
      dataflowAction.dataflowSelected(
        this.state.applicationId,
        this.props.application.applicationTitle,
        record.id,
        record.clusterId,
        this.props.user
      )
    );
    this.props.history.push(
      `/${this.state.applicationId}/dataflowinstances/dataflowInstanceDetails/${record.id}`
    );
  };

  render() {
    if (!this.props.application || !this.props.application.applicationId) return null;
    const dataflowCols = [
      {
        title: 'Name',
        dataIndex: 'title',
        width: '30%',
        render: (text, record) => <a onClick={(row) => this.handleViewDetails(record)}>{text}</a>,
      },
      {
        title: 'Description',
        dataIndex: 'description',
        className: 'overflow-hidden',
        ellipsis: true,
        width: '30%',
        // render: (text, record) => <ReactMarkdown children={text} />
        render: (text, record) => (
          <span className="description-text">
            <ReactMarkdown children={text} />
          </span>
        ),
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        width: '30%',
        render: (text, record) => {
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
        <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle} />
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
  const { user } = state.authenticationReducer;
  const { application, selectedTopNav } = state.applicationReducer;
  return {
    user,
    application,
    selectedTopNav,
  };
}

const connectedWorkflows = connect(mapStateToProps)(withRouter(DataflowInstances));
export { connectedWorkflows as DataflowInstances };

//export default FileList;
