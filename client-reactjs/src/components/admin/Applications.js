import React, { Component } from "react";
import { Table, Button, Row, Col, Modal, Form, Input, notification, Tooltip, Icon, Popconfirm, Divider } from 'antd/lib';
import BreadCrumbs from "../common/BreadCrumbs";
import { authHeader, handleError } from "../common/AuthHeader.js"

class Applications extends Component {
  state = {
  	applications:[],
  	selectedApplication:'',
  	removeDisabled: true,
  	showAddApp: false,
  	confirmLoading: false,
  	newApp : {
	  	id: '',
	  	title: '',
      description:''
	}
  }

  componentDidMount() {
  	this.getApplications();
  }

  onSelectedRowKeysChange = (selectedRowKeys, selectedRows) => {
    var appsSelected = this.state.selectedApplications, removeDisabled = true;
    appsSelected = selectedRows;
    this.setState({
      selectedApplications: appsSelected,
    });
    removeDisabled = (selectedRows.length > 0) ? false : true;
	this.setState({
	  removeDisabled: removeDisabled
	});

  }

  getApplications() {
  	fetch("/api/app/read/app_list", {
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
	    	applications: data
	    });
  	})
  	.catch(error => {
    	console.log(error);
  	});
  }

  handleEditApplication(app_id) {
    fetch("/api/app/read/app?app_id="+app_id, {
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
        newApp: {
          ...this.state.newApp,
          id : data.id,
          title: data.title,
          description: data.description
        }
      });
      this.setState({
        showAddApp: true
      });

    })
  	.catch(error => {
    	console.log(error);
  	});
  }

  handleRemove = (app_id) => {
  	var data = JSON.stringify({appIdsToDelete:app_id});
  	console.log(data);
    fetch("/api/app/read/removeapp", {
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
          message: 'Application Removed',
          description: 'The application has been removed.',
          onClick: () => {
            console.log('Closed!');
          },
        });
        this.getApplications();
      }).catch(error => {
        console.log(error);
      });
  }

  handleAdd = (event) => {
  	this.setState({
    	showAddApp: true
    });
  }

  handleAddAppCancel= (event) => {
  	this.setState({
      ...this.state,
        newApp: {
          ...this.state.newApp,
          id : '',
          title: '',
          description:''
        },
        showAddApp: false
    });
  }

  onChange = (e) => {
    this.setState({...this.state, newApp: {...this.state.newApp, [e.target.name]: e.target.value }});
  }

  handleAddAppOk = () => {
    this.setState({
      confirmLoading: true,
    });

  	let data = JSON.stringify({"id": this.state.newApp.id, "title" : this.state.newApp.title, "description" : this.state.newApp.description});
	  fetch("/api/app/read/newapp", {
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
	  	this.setState({
      ...this.state,
        newApp: {
          ...this.state.newApp,
          id : '',
          title: '',
          description:''
        },
        showAddApp: false,
        confirmLoading: false
      });

	    this.getApplications();
    }).catch(error => {
      console.log(error);
    });
  }

  render() {
    {console.log("Applications render")}
  	const { confirmLoading} = this.state;
  	const applicationColumns = [
    {
      width: '30%',
      title: 'Title',
      dataIndex: 'title'
    },
    {
      width: '60%',
      title: 'Description',
      dataIndex: 'description'
    },{
      width: '30%',
      title: 'Action',
      dataIndex: '',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.handleEditApplication(record.id)}><Tooltip placement="right" title={"Edit Application"}><Icon type="edit" /></Tooltip></a>
          <Divider type="vertical" />
          <Popconfirm title="Are you sure you want to delete this Application?" onConfirm={() => this.handleRemove(record.id)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
            <a href="#"><Tooltip placement="right" title={"Delete Application"}><Icon type="delete" /></Tooltip></a>
          </Popconfirm>
        </span>
    }];
    const formItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 5 },
      },
      wrapperCol: {
        xs: { span: 2 },
        sm: { span: 10 },
      },
    };

    return (
    <React.Fragment>
      <div className="d-flex justify-content-end" style={{paddingTop:"60px"}}>
        <BreadCrumbs applicationId={this.state.applicationId}/>
        <span style={{ marginLeft: "auto" }}>
            <Tooltip placement="bottom" title={"Click to add a new Application"}>
              <Button className="btn btn-secondary btn-sm" onClick={() => this.handleAdd()}><i className="fa fa-plus"></i> Add Application</Button>
            </Tooltip>
          </span>
      </div>
      <div style={{padding:"15px"}}>
      	<Table
          columns={applicationColumns}
          rowKey={record => record.id}
          dataSource={this.state.applications}/>
      </div>

      <div>
	      <Modal
	          title="Add Application"
	          visible={this.state.showAddApp}
	          onOk={this.handleAddAppOk}
	          onCancel={this.handleAddAppCancel}
	          confirmLoading={confirmLoading}
	        >
		        <Form layout="vertical">
		            {/*<Form.Item {...formItemLayout} label="ID">
						<Input id="app_id" name="id" onChange={this.onChange} placeholder="ID" value={this.state.newApp.id}/>
		            </Form.Item>*/}
		            <Form.Item {...formItemLayout} label="Title">
						<Input id="app_title" name="title" onChange={this.onChange} placeholder="Title" value={this.state.newApp.title}/>
		            </Form.Item>
                <Form.Item {...formItemLayout} label="Description">
            <Input id="app_description" name="description" onChange={this.onChange} placeholder="Description" value={this.state.newApp.description}/>
                </Form.Item>
	            </Form>
	        </Modal>
     </div>
   </React.Fragment>
    );
  }
}

export default Applications;