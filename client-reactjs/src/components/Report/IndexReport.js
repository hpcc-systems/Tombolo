import { Table,Row, Col,Spin} from 'antd/lib';
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
    selectedIndexTitle:"",
    selectedIndexId:"",
    initialDataLoading: false
  }

  componentDidMount() {    
    if(this.props.indexList && this.props.indexList.length>0)
        this.getIndexDetails(this.props.indexList[0]); 
      else{
      this.setState({
        openIndexDetails:false
        });      
      }
  }

  componentWillReceiveProps(props) {
    this.setState({
        indexList: props.indexList
      });
      if(props.indexList && props.indexList.length>0)
        this.getIndexDetails(props.indexList[0]); 
      else{
      this.setState({
        openIndexDetails:false
        });      
      }
  }

  getIndexDetails(record) {
    this.setState({
      selectedIndexId:record.id,
      selectedIndexTitle:record.title,
      openIndexDetails: true,
      initialDataLoading: true
      });
      fetch("/api/report/read/indexKeyPayload?index_id="+record.id, {
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
    this.getIndexDetails(record);
  }
  setRowClassName = (record) => {
    return record.id === this.state.selectedIndexId ? 'clickRowStyl' : '';
  }
  render() {
    const indexColumns = [{
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
      className="rebortTable"
      columns={indexColumns}
      rowKey={record => record.id}
      dataSource={this.state.indexList}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1000 }}
      size="middle"
      onRowClick={this.onClickRow} 
      rowClassName={this.setRowClassName}
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
      className="rebortTable"
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
      className="rebortTable"
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
        <div style={{"textAlign":"center"}}>
        <Spin spinning={this.state.initialDataLoading} size="large" />  
        </div>  
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