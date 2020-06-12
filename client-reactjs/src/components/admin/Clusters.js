import React, { Component } from "react";
import { Table, Button, Row, Col, Modal, Form, Input, notification, Spin, Tooltip, Icon, Popconfirm, Divider, message, Select } from 'antd/lib';
import BreadCrumbs from "../common/BreadCrumbs";
import { authHeader, handleError } from "../common/AuthHeader.js"
const Option = Select.Option;

class Clusters extends Component {
  state = {
  	clusters:[],
  	selectedCluster:'',
  	removeDisabled: true,
	  showAddClusters: false,
  	confirmLoading: false,
  	showAddClusters: false,
    initialDataLoading: false,
    clusterWhitelist: [],
  	newCluster : {
  	  	id: '',
  	  	name: '',
  	  	thorHost: '',
        thorPort: '',
        roxieHost: '',
        roxiePort: '',
        username: '',
        password: '',
        submitted: false
  	}
  }

  componentDidMount() {
  	this.getClusters();
  }  

  getClusters() {
   this.setState({
      initialDataLoading: true
    });
    fetch("/api/hpcc/read/getClusters", {
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
  	    	clusters: data,
          initialDataLoading: false
  	    });
    }).
    then((data) => {
      this.getClusterWhitelist();
    })
  	.catch(error => {
    	console.log(error);
  	});
  }

  getClusterWhitelist() {
    fetch("/api/hpcc/read/getClusterWhitelist", {
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
          clusterWhitelist: data
        });
    })
    .catch(error => {
      console.log(error);
    });
  }

  handleRemove = (clusterId) => {
   	var data = JSON.stringify({clusterIdsToDelete:clusterId});
   	console.log(data);
     fetch("/api/hpcc/read/removecluster", {
       method: 'post',
       headers: authHeader(),
       body: data
     }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
     })
     .then(suggestions => {
   		notification.open({
   		    message: 'Cluster Removed',
   		    description: 'The cluster has been removed.',
   		    onClick: () => {
   		      console.log('Closed!');
   		    },
   		  });
         this.getClusters();
       }).catch(error => {
         console.log(error);
       });
  }

  handleAdd = (event) => {
  	this.setState({
      ...this.state,
      newCluster: {
        ...this.state.newCluster,
        id: '',
        name: '',
        thorHost: '',
        thorPort: '',
        roxieHost: '',
        roxiePort: '',
        username: '',
        submitted: false
      },
      showAddClusters: true
    });
  }

  handleAddClusterCancel= (event) => {
  	this.setState({
      showAddClusters: false,
      submitted: false
    });
  }

  handleEditCluster(clusterId) {
    fetch("/api/hpcc/read/getCluster?cluster_id="+clusterId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
	  .then(data => {
      console.log(JSON.stringify(data))
      this.setState({        
        ...this.state,
        selectedCluster: data.name,        
        newCluster: {
          ...this.state.newCluster,
          id: data.id,
          name: data.name,
          thorHost: data.thor_host,
          thorPort: data.thor_port,
          roxieHost: data.roxie_host,
          roxiePort: data.roxie_port,
          username: data.username,
          submitted: false
        }
      }, function() {
        this.setState({
          showAddClusters: true          
        });
      });

    })
  	.catch(error => {
    	console.log(error);
  	});
  }

  onChange = (e) => {
    this.setState({...this.state,confirmLoading:false, newCluster: {...this.state.newCluster, [e.target.name]: e.target.value }});
  }

  onClusterSelection = (value) => {
    let selectedCluster = this.state.clusterWhitelist.filter((cluster) => cluster.name == value)[0];

    this.setState({        
      ...this.state,
      selectedCluster: value,        
      newCluster: {
        ...this.state.newCluster,
        name: selectedCluster.name,
        thorHost: selectedCluster.thor,
        thorPort: selectedCluster.thor_port,
        roxieHost: selectedCluster.roxie,
        roxiePort: selectedCluster.roxie_port,
      }
    })  
  }

  handleAddClusterOk = () => {
   
    this.setState({
      confirmLoading: true,
      submitted: true
    });

    let data = JSON.stringify({
      "id":this.state.newCluster.id,
      "name": this.state.newCluster.name,
      "thor_host" : this.state.newCluster.thorHost,
      "thor_port" : this.state.newCluster.thorPort,
      "roxie_host" : this.state.newCluster.roxieHost,
      "roxie_port" : this.state.newCluster.roxiePort,
      "username" : this.state.newCluster.username,
      "password" : this.state.newCluster.password
    });

    fetch("/api/hpcc/read/newcluster", {
        method: 'post',
        headers: authHeader(),
        body: data
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
     throw new Error("There was an error adding the Cluster. Please check if the cluster is accessible. ");
    })
    .then(suggestions => {
      this.setState({
        confirmLoading: false,
        showAddClusters: false,
        submitted: false
      });
      this.getClusters();
    }).catch(error => {
      message.config({top:50});
      message.error(error.message);
      this.setState({
        confirmLoading: false
      });
    });
   
  }


  render() {
    const { confirmLoading, submitted, clusterWhitelist} = this.state;
  	const clusterColumns = [{
      title: 'Name',
      dataIndex: 'name',
      width: '20%',
    },
    {
      width: '20%',
      title: 'Thor Host',
      dataIndex: 'thor_host'
    },
    {
      width: '15%',
      title: 'Thor Port',
      dataIndex: 'thor_port'
    },
    {
      width: '20%',
      title: 'Roxie Host',
      dataIndex: 'roxie_host'
    },
    {
      width: '15%',
      title: 'Roxie Port',
      dataIndex: 'roxie_port'
    },
    {
      width: '10%',
      title: 'Action',
      dataIndex: '',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.handleEditCluster(record.id)}><Tooltip placement="right" title={"Edit Cluster"}><Icon type="edit" /></Tooltip></a>
          <Divider type="vertical" />
          <Popconfirm title="Are you sure you want to delete this Cluster?" onConfirm={() => this.handleRemove(record.id)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
            <a href="#"><Tooltip placement="right" title={"Delete Cluster"}><Icon type="delete" /></Tooltip></a>
          </Popconfirm>
        </span>
    }];
    const formItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 4 },
      },
      wrapperCol: {
        xs: { span: 2 },
        sm: { span: 10 },
      },
    };
    const formHostLayout = {
      labelCol: {
        xs: { span: 1 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 1 },
        sm: { span: 16 },
      },
    };
    const formPortLayout = {
      labelCol: {
        xs: { span: 1 },
        sm: { span: 5 },
      },
      wrapperCol: {
        xs: { span: 1 },
        sm: { span: 16 },
      },
    };
    return (
    <React.Fragment>
      <div className="d-flex justify-content-end" style={{paddingTop:"60px"}}>
        <BreadCrumbs applicationId={this.state.applicationId}/>
        <span style={{ marginLeft: "auto" }}>
            <Tooltip placement="bottom" title={"Click to add a new Cluster"}>
              <Button className="btn btn-secondary btn-sm" onClick={() => this.handleAdd()}><i className="fa fa-plus"></i> Add Cluster</Button>
            </Tooltip>
          </span>

      </div>
      <div className="loader">
        <Spin spinning={this.state.initialDataLoading} size="large" />
      </div>
      <div style={{padding:"15px"}}>
      	<Table
          columns={clusterColumns}
          rowKey={record => record.id}
          dataSource={this.state.clusters}/>
      </div>
      <div>
	      <Modal
	          title="Add Cluster"
	          visible={this.state.showAddClusters}
	          onOk={this.handleAddClusterOk}
	          onCancel={this.handleAddClusterCancel}
	          confirmLoading={confirmLoading}
	        >
		        <Form layout="vertical">
                {/* <Form.Item label="Thor:"></Form.Item> */}
                <Row gutter={23}>
                  <Col span={13}>
                  <div className={'form-group'}>
                    <Form.Item {...formHostLayout} label="Host">
        						<Select placeholder="Select a Cluster" onChange={this.onClusterSelection} style={{ width: 290 }} value={this.state.newCluster.name ? this.state.newCluster.name + ' - ' + this.state.newCluster.thorHost + ':' + this.state.newCluster.thorPort : ''}>
                      {clusterWhitelist.map(cluster => <Option key={cluster.name}>{cluster.name + " - " + cluster.thor + ":" + cluster.thor_port}</Option>)}
                    </Select>
  		            </Form.Item>
                  </div>
                  </Col>                
                </Row>
 		            <Form.Item {...formItemLayout} label="User Name">
      						<Input id="username" name="username" onChange={this.onChange} placeholder="User Name" value={this.state.newCluster.username}/>
		            </Form.Item>
		            <Form.Item {...formItemLayout} label="Password">
                  <input type="password" className="form-control" name="password" onChange={this.onChange} placeholder="Password"/>
		            </Form.Item>
	            </Form>
	        </Modal>
     </div>
   </React.Fragment>
    );
  }

}

export default Clusters;