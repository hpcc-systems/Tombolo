import {Treant} from 'treant-js/Treant.js';
//import 'treant-js/vendor/raphael.min.js';
import { Table, Divider, message, Popconfirm, Icon, Tooltip } from 'antd/lib';
import React, { Component } from "react";
import QueryDetailsForm from "./QueryDetails";
import { authHeader, handleError } from "../common/AuthHeader.js"
import { hasEditPermission } from "../common/AuthUtil.js";

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
      title: 'Title',
      dataIndex: 'title',
      width: '30%',
      render: (text, record) => <a href='#' onClick={(row) => this.handleEdit(record.id)}>{text}</a>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: '30%',
    },
    {
      width: '30%',
      title: 'Type',
      dataIndex: 'type'
    },
    {
      width: '30%',
      title: 'Action',
      className: editingAllowed ? 'show-column' : 'hide-column',
      dataIndex: '',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.handleEdit(record.id)}><Tooltip placement="right" title={"Edit Query"}><Icon type="edit" /></Tooltip></a>
          <Divider type="vertical" />
          <Popconfirm title="Are you sure you want to delete this Query?" onConfirm={() => this.handleDelete(record.id)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
            <a href="#"><Tooltip placement="right" title={"Delete Query"}><Icon type="delete" /></Tooltip></a>
          </Popconfirm>
        </span>
    }];
    return (
      <div>
        <Table
            columns={queryColumns}
            rowKey={record => record.id}
            dataSource={this.state.queries}
            pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
          />
        {this.state.openQueryDetailsDialog ?
          <QueryDetailsForm
            onRef={ref => (this.child = ref)}
            selectedQuery={this.state.selectedQuery}
            applicationId={this.props.applicationId}
            onRefresh={this.handleRefreshTree}
            onClose={this.handleClose} 
            user={this.props.user}/>: null}
      </div>
    )
  }
}

export default QueryTable;