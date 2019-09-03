import { Table,Row, Col} from 'antd/lib';
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
    selectedQueryTitle:""
  }

  componentDidMount() {    
    
  }

  componentWillReceiveProps(props) {
    this.setState({
        queryList: props.queryList
      });
      if(props.refresh){
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
  getQueryDetails(id) {
      fetch("/api/report/read/query_Fields?query_id="+id, {
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
        })
      .catch(error => {
        console.log(error);
      });
  }
  render() {
    const queryColumns = [{
      title: 'Title',
      dataIndex: 'title',
      width: '20%',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.querySelect(record.id,record.title)}>{text}</a>
        </span>
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
      columns={queryColumns}
      rowKey={record => record.id}
      dataSource={this.state.queryList}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1000 }}
      size="middle"
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
      columns={queryFieldsColumn}
      rowKey={record => record.id}
      dataSource={this.state.queryFields}
      pagination={{ pageSize: 10 }}
      size="middle"
    />
    const title="Query ("+this.state.selectedQueryTitle+") - Fields"
    return (
      <div>        
        {table}   
         
        {this.state.openQueryDetails ?
        <div><h6>{title}</h6>         
          {queryFieldTable}
         </div>:null}
      </div>
    )
  }
}
export default QueryReport;