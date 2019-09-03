import { Table,Row, Col} from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js"

class IndexReport extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    indexList:this.props.indexList,
    openIndexDetails:false,
    indexKey:[],
    indexPayload:[],
    selectedIndexTitle:""
  }

  componentDidMount() {    
    
  }

  componentWillReceiveProps(props) {
    this.setState({
        indexList: props.indexList
      });
      if(props.refresh){
        this.setState({
          openIndexDetails:false
          });
      }
  }

  indexSelect = (id,title) => {
    this.setState({
      selectedIndexTitle:title,
      openIndexDetails: true
      });
      this.getIndexDetails(id);
  }
  getIndexDetails(id) {
      fetch("/api/report/read/indexKeyPayload?index_id="+id, {
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
            indexKey: data.basic.index_keys,
            indexPayload: data.basic.index_payloads,
            openIndexDetails:true
          });
        })
      .catch(error => {
        console.log(error);
      });
  }
  render() {
    const indexColumns = [{
      title: 'Title',
      dataIndex: 'title',
      width: '20%',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.indexSelect(record.id,record.title)}>{text}</a>
        </span>
    },    
    {
      width: '20%',
      title: 'Application',
      dataIndex: 'application.title'
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
        title: 'Qualified Path',
        dataIndex: 'qualifiedPath'
    }];

   
    let table = null;    
      table = <Table 
      columns={indexColumns}
      rowKey={record => record.id}
      dataSource={this.state.indexList}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1000 }}
      size="middle"
    />
    const indexKeyColumn = [{
      title: 'Name',
      dataIndex: 'ColumnLabel',
      width: '20%'
    },    
    {
      width: '20%',
      title: 'Type',
      dataIndex: 'ColumnType'
    },
    {
        width: '20%',
        title: 'Ecl Type',
        dataIndex: 'ColumnEclType'
      }];
      let keyTable = null;    
      keyTable = <Table 
      columns={indexKeyColumn}
      rowKey={record => record.id}
      dataSource={this.state.indexKey}
      pagination={{ pageSize: 10 }}
      size="middle"
    />
    const indexPayloadColumn = [{
      title: 'Name',
      dataIndex: 'ColumnLabel',
      width: '20%'
    },    
    {
      width: '20%',
      title: 'Type',
      dataIndex: 'ColumnType'
    },
    {
        width: '20%',
        title: 'Ecl Type',
        dataIndex: 'ColumnEclType'
      }];
      let payloadTable = null;    
      payloadTable = <Table 
      columns={indexPayloadColumn}
      rowKey={record => record.id}
      dataSource={this.state.indexPayload}
      pagination={{ pageSize: 10 }}
      size="middle"
    />
    const title="Index ("+this.state.selectedIndexTitle+")"
    return (
      <div>        
        {table}   
         
        {this.state.openIndexDetails ?
        <div><h6>{title}</h6> 
        <Row gutter={24}>
          <Col span={12}>
          <h6>Key</h6>
          {keyTable}
          </Col>
          <Col span={12}>
          <h6>Payload</h6>
          {payloadTable}
          </Col>
        </Row></div>:null}
      </div>
    )
  }
}
export default IndexReport;