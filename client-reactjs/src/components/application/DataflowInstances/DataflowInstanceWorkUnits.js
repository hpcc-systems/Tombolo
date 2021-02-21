import React, { Component } from "react";
import { Table, Tooltip, Tabs, Spin, Input, Button } from 'antd/lib';
import {Graph} from "../Dataflow/Graph";
import BreadCrumbs from "../../common/BreadCrumbs";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { Constants } from '../../common/Constants';
import { SearchOutlined  } from '@ant-design/icons';
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
    dataflowCluster: '',
    searchText: '',
    searchedColumn: ''
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

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Button
          type="primary"
          onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          icon="search"
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
          Reset
        </Button>
      </div>
    ),

    filterIcon: filtered => (
      <SearchOutlined />
    ),

    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),

    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    },

    render: text =>
     (
        text
      ),

  })

  handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    this.setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex,
    });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: '' });
  };

  render() {

    const workflowTblColumns = [{
        title: 'WorkUnit Id',
        dataIndex: 'wuid',
        width: '20%',
        ...this.getColumnSearchProps('wuid'),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: '15%',
        ...this.getColumnSearchProps('status')
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
        title: 'Job Name',
        dataIndex: 'jobName',
        width: '15%'
      },
      {
        title: 'Owner',
        dataIndex: 'owner',
        width: '15%'
      },
      {
        width: '10%',
        title: 'Action',
        dataJob: '',
        render: (text, record) =>
          <span>
            <a href={this.state.dataflowCluster + "/?Wuid="+record.wuid+"&Widget=WUDetailsWidget"} target="_blank" rel="noopener noreferrer"><Tooltip placement="right" title={"View Details"}>Details</Tooltip></a>
          </span>
      }];
    console.log(this.state.loading);
    return (
      <Spin spinning={this.state.loading}>
      <Table
        columns={workflowTblColumns}
        rowKey={record => record.wuid}
        dataSource={this.state.workunits}
        pagination={{ pageSize: 10 }} scroll={{ y: 190 }}
      />
      </Spin>
    )
  }
}

export default DataflowInstanceWorkUnits;