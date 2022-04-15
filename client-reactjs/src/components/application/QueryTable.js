import { Table, Divider, message, Popconfirm, Tooltip } from 'antd/lib';
import React, { Component } from "react";
import QueryDetailsForm from "./QueryDetails";
import { authHeader, handleError } from "../common/AuthHeader.js"
import { hasEditPermission } from "../common/AuthUtil.js";
import { Constants } from '../common/Constants';
import ReactMarkdown from 'react-markdown';
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined, ShareAltOutlined  } from '@ant-design/icons';

class QueryTable extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    applications: [],
    openQueryDetailsDialog: false,
    selectedQuery: "",
    applicationId: this.props.applicationId,
    queries: []

  }

 componentDidMount() {
   //this.props.onRef(this);
   this.fetchDataAndRenderTable();
  }

  componentWillReceiveProps(props) {
    this.setState({
        applicationId: props.applicationId
      });
    const { refresh } = this.props;
    if (props.refresh !== refresh) {
      setTimeout(() => {
        this.fetchDataAndRenderTable();
      }, 200);

    }
  }

  fetchDataAndRenderTable() {
    var _self=this;
    fetch("/api/query/query_list?app_id="+this.state.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      this.setState({
        queries: data
      });
    }).catch(error => {
      console.log(error);
    });
    //this._setupListeners();
  }

  handleEdit(fileId) {
    this.setState({
      openQueryDetailsDialog: true,
      selectedQuery: fileId
    });
    //this.child.showModal();
  }

  handleDelete(queryId) {
    var data = JSON.stringify({queryId: queryId, application_id: this.state.applicationId});
    fetch("/api/query/delete", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(result => {
      this.fetchDataAndRenderTable();
      message.success("Query deleted sucessfully");
    }).catch(error => {
      console.log(error);
      message.error("There was an error deleting the Query");
    });
  }

  handleClose = () => {
    console.log('handleClose')
    this.setState({
      openQueryDetailsDialog: false
    });
  }

  handleRefreshTree = () => this.fetchDataAndRenderTable();

  render() {
    const editingAllowed = hasEditPermission(this.props.user);
    const queryColumns = [{
      title: 'Name',
      dataIndex: 'name',
      width: '35%',
      render: (text, record) => <a href='#' onClick={(row) => this.handleEdit(record.id)}>{record.name != '' ? record.name : record.title}</a>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      className: 'overflow-hidden',
      ellipsis: true,
      width: '15%',
      render: (text, record) => <ReactMarkdown children={text} />
    },
    {
      width: '10%',
      title: 'Type',
      dataIndex: 'type'
    },
    {
      width: '25%',
      title: 'Created',
      dataIndex: 'createdAt',
      render: (text, record) => {
        let createdAt = new Date(text);
        return createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ createdAt.toLocaleTimeString('en-US')
      }
    },
    {
      width: '15%',
      title: 'Action',
      className: editingAllowed ? 'show-column' : 'hide-column',
      dataIndex: '',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.handleEdit(record.id)}><Tooltip placement="right" title={"Edit Query"}><EditOutlined /></Tooltip></a>
          <Divider type="vertical" />
          <Popconfirm title="Are you sure you want to delete this Query?" onConfirm={() => this.handleDelete(record.id)} icon={<QuestionCircleOutlined />}>
            <a href="#"><Tooltip placement="right" title={"Delete Query"}><DeleteOutlined /></Tooltip></a>
          </Popconfirm>
        </span>
    }];
    return (
      <div>
        <Table
            columns={queryColumns}
            rowKey={record => record.id}
            dataSource={this.state.queries}
            pagination={{ pageSize: 10 }}
            scroll={{ y: '70vh' }}
          />
        {this.state.openQueryDetailsDialog ?
          <QueryDetailsForm
            onRef={ref => (this.child = ref)}
            selectedAsset={this.state.selectedQuery}
            applicationId={this.props.applicationId}
            onRefresh={this.handleRefreshTree}
            onClose={this.handleClose}
            isNew={false}
            user={this.props.user}/>: null}
      </div>
    )
  }
}

export default QueryTable;