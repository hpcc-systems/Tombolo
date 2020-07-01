import React, { Component } from "react";
import { Table, Icon, Tooltip, Tabs, Spin } from 'antd/lib';
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
    workunits: [],
    loading: true,
    dataflowCluster: ''
  }
  
  componentDidMount() {
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
        this.setState({
          workunits : data.workunits,
          dataflowCluster: data.cluster,
          loading: false
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
        title: 'Start Time',
        dataIndex: 'start',
        width: '15%'
      },  
      {
        title: 'End Time',
        dataIndex: 'end',
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
            <a href={this.state.dataflowCluster + "/?Wuid="+record.wuid+"&Widget=WUDetailsWidget"} target="_blank"><Tooltip placement="right" title={"View Details"}>Details</Tooltip></a>
          </span>
      }];
    console.log(this.state.loading);  
    return (
      <Spin spinning={this.state.loading}>
      <Table
        columns={workflowTblColumns}
        rowKey={record => record.wuid}
        dataSource={this.state.workunits}
        pagination={{ pageSize: 20 }} scroll={{ y: 460 }}
      />      
      </Spin>
    )
  }
}

export default DataflowInstanceWorkUnits;