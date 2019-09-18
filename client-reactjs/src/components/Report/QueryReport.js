import { Table,Row, Col,Spin} from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js"

class QueryReport extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    queryList:this.props.queryList,
    openQueryDetails:false,
    queryFields:[],
    selectedQueryTitle:"",
    selectedQueryId:"",
    initialDataLoading: false
  }

  componentDidMount() {
    if(this.props.queryList && this.props.queryList.length>0)
        this.getQueryDetails(this.props.queryList[0]);
      else{
      this.setState({
        openQueryDetails:false
        });
      }
  }

  componentWillReceiveProps(props) {
    this.setState({
        queryList: props.queryList
      });
      if(props.queryList && props.queryList.length>0)
        this.getQueryDetails(props.queryList[0]);
      else{
      this.setState({
        openQueryDetails:false
        });
      }
  }

  querySelect = (id,title) => {
    this.setState({
      selectedQueryTitle:title,
      openQueryDetails: true
      });
      this.getQueryDetails(id);
  }
  getQueryDetails(record) {
    this.setState({
      selectedQueryTitle:record.title,
      selectedQueryId:record.id,
      openQueryDetails: true,
      initialDataLoading: true
      });
      fetch("/api/report/read/query_Fields?query_id="+record.id, {
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
            queryFields: data.query_fields,
            openQueryDetails:true
          });
          setTimeout(() => {
            this.setState({
              initialDataLoading: false
            });
          }, 200);
        })
      .catch(error => {
        console.log(error);
      });
  }
  onClickRow = (record) => {
    this.getQueryDetails(record);
  }
  setRowClassName = (record) => {
    return record.id === this.state.selectedQueryId ? 'clickRowStyl' : '';
  }
  render() {
    const queryColumns = [{
      title: 'Title',
      dataIndex: 'title',
      width: '20%'
    },
    {
      width: '20%',
      title: 'Application',
      dataIndex: 'application.title'
    },
    {
        width: '20%',
        title: 'description',
        dataIndex: 'description'
      },
      {
        width: '20%',
        title: 'gitRepo',
        dataIndex: 'gitRepo'
      },
    {
        width: '20%',
        title: 'Backup Service',
        dataIndex: 'backupService'
      },
    {
      width: '20%',
      title: 'Primary Service',
      dataIndex: 'primaryService'
    },
    {
        width: '10%',
        title: 'Type',
        dataIndex: 'type'
    }];


    let table = null;
      table = <Table
      className="rebortTable"
      columns={queryColumns}
      rowKey={record => record.id}
      dataSource={this.state.queryList}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1000 }}
      size="middle"
      onRowClick={this.onClickRow}
      rowClassName={this.setRowClassName}
    />
    const queryFieldsColumn = [{
      title: 'Field Type',
      dataIndex: 'field_type',
      width: '20%'
    },
    {
      width: '20%',
      title: 'Name',
      dataIndex: 'field'
    },
    {
        width: '20%',
        title: 'Type',
        dataIndex: 'type'
      }];
      let queryFieldTable = null;
      queryFieldTable = <Table
      className="rebortTable"
      columns={queryFieldsColumn}
      rowKey={record => record.id}
      dataSource={this.state.queryFields}
      pagination={{ pageSize: 10 }}
      size="middle"
    />
    const title="Query ("+this.state.selectedQueryTitle+") - Fields"
    return (
      <div style={{"paddingLeft":"5px"}}>
        {table}

        {this.state.openQueryDetails ?
        <div><h6>{title}</h6>
        <Spin spinning={this.state.initialDataLoading} size="large" >
          {queryFieldTable}
          </Spin>
         </div>:null}
      </div>
    )
  }
}
export default QueryReport;