import React, { Component } from "react";
import { Button, Table, Divider, message, Icon, Tooltip, Row, Col, Tabs } from 'antd/lib';
import {Graph} from "../Dataflow/Graph";
import BreadCrumbs from "../../common/BreadCrumbs";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { Constants } from '../../common/Constants';
const { TabPane } = Tabs;

class DataflowInstanceWorkUnits extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    applicationId: this.props.applicationId,
    workflow_id: this.props.selectedWorkflow,
    instance_id: this.props.instanceId,
    workunits: []
  }
  
  componentDidMount() {
    console.log('componentDidMount - DataflowInstanceWorkUnits')
    this.fetchDataflowWorkUnits();
  }  

  componentWillReceiveProps(props) {
    this.setState({
      applicationId: props.applicationId,
      workflow_id: props.selectedWorkflow,
      instance_id: props.instanceId
    }, () => {
      this.fetchDataflowWorkUnits();
    });
   
  }

  fetchDataflowWorkUnits() {
    this.setState({
      workunits : []
    })
    if(this.props.applicationId) {
      fetch("/api/workflows/workunits?application_id="+this.state.applicationId+"&workflow_id="+this.state.workflow_id+"&instance_id="+this.state.instance_id, {
         headers: authHeader()
      })
      .then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(data => {
        console.log(data);
        this.setState({
          workunits : data,
        })

      }).catch(error => {
        console.log(error);
      });
    }
  }

  render() {    
    const workflowTblColumns = [{
        title: 'WorkUnit Id',
        dataIndex: 'wuid',
        width: '20%'
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: '15%'
      },  
      {
        title: 'Duration',
        dataIndex: 'totalClusterTime',
        width: '30%'
      },  
      {
        width: '10%',
        title: 'Action',
        dataJob: '',
        render: (text, record) =>
          <span>
            <a href="#"><Tooltip placement="right" title={"View Details"}>Details</Tooltip></a>
          </span>
      }];
    if(!this.state.workunits || !this.state.workunits.length > 0) {
      return null;
    }  
    return (
      <Table
        columns={workflowTblColumns}
        rowKey={record => record.wuid}
        dataSource={this.state.workunits}
        pagination={{ pageSize: 20 }} scroll={{ y: 460 }}
      />
    )
  }
}

export default DataflowInstanceWorkUnits;