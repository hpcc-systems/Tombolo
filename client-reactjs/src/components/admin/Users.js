import React, { Component } from "react";
import { Table, Button, Row, Col, Modal, Form, Input, notification, Spin, Select, Popconfirm, Icon, Tooltip, Divider } from 'antd/lib';
import BreadCrumbs from "../common/BreadCrumbs";
import { authHeader, handleError } from "../common/AuthHeader.js"

const Option = Select.Option;

class Users extends Component {
  state = {
  	users:[],
  	selectedUsers:[],
  	removeDisabled: true,
	  showAddUser: false,
  	confirmLoading: false,
  	showAddUser: false,
    initialDataLoading: false,
    isUserUpdated: false,
  	newUser : {
        id: '',
  	  	firstName: '',
  	  	lastName: '',
        username: '',
        password: '',
        role:''
  	},
    submitted: false
  }

  componentDidMount() {
  	this.getUsers();
  }

  onSelectedRowKeysChange = (selectedRowKeys, selectedRows) => {
    var usersSelected = this.state.selectedusers, removeDisabled = true;
    usersSelected = selectedRows;
    this.setState({
      selectedusers: usersSelected,
    });
    removeDisabled = (selectedRows.length > 0) ? false : true;
	this.setState({
	  removeDisabled: removeDisabled
	});
  }

  getUsers() {
   this.setState({
      initialDataLoading: true
    });
  	fetch("/api/user/", {
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
	    	users: data
	    });
      this.setState({
         initialDataLoading: false
       });

  	})
  	.catch(error => {
    	console.log(error);
  	});
  }

  handleDelete = (id) => {
   fetch("/api/user/"+id, {
    method: 'delete',
    headers: authHeader()
   }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
   })
   .then(suggestions => {
      notification.open({
          message: 'User Removed',
          description: 'The user has been removed.',
          onClick: () => {
            console.log('Closed!');
          },
        });
       this.getUsers();
   }).catch(error => {
     console.log(error);
   });
  }

  handleEditUser(userId) {
    fetch("/api/user/"+userId, {
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
        ...this.state,
        newUser : {
          ...this.state.newUser,
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          role: data.role
        },
        showAddUsers: true,
        isUserUpdated: true
      });
    })
  	.catch(error => {
    	console.log(error);
  	});
  }

  handleAdd = (event) => {
  	this.setState({
      confirmLoading: false,
      submitted: false,
      newUser : {
        ...this.state.newUser,
        firstName: '',
        lastName: '',
        username: '',
        role: ''
      },
      showAddUsers: true
    });
  }

  handleAddUserCancel= (event) => {
  	this.setState({
		  showAddUsers: false
    });
  }

  onChange = (e) => {
    this.setState({...this.state,confirmLoading:false, newUser: {...this.state.newUser, [e.target.name]: e.target.value }});
  }

  handleRoleChange = (value) => {
    this.setState({...this.state, newUser: {...this.state.newUser, role: value }});
  }

  handleAddUserOk = () => {
    this.setState({
      confirmLoading: true,
      submitted: true
    });
    if(this.state.newUser.firstName && this.state.newUser.username && this.state.newUser.password ){
  	let data = JSON.stringify(
      {
        "firstName": this.state.newUser.firstName,
        "lastName" : this.state.newUser.lastName,
        "username" : this.state.newUser.username,
        "password" : this.state.newUser.password,
        "role"     : this.state.newUser.role
      }
    );
    let url = this.state.isUserUpdated ?  '/api/user/'+this.state.newUser.id :  '/api/user/register';
    let method = this.state.isUserUpdated ?  'put' :  'post';
  	fetch(url, {
        method: method,
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
  	  		confirmLoading: false,
          showAddUsers: false,
          isUserUpdated: false,
          submitted:false
  	    });
  	    this.getUsers();
      }).catch(error => {
        console.log(error);
      });
    }
    }

  render() {
  	const { selectedusers, confirmLoading} = this.state;
  	const rowSelection = {
      selectedusers,
      onChange: this.onSelectedRowKeysChange
    };
  	const userColumns = [{
      title: 'First Name',
      dataIndex: 'firstName',
      width: '25%'
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      width: '25%'
    },
    {
      title: 'User Name',
      dataIndex: 'username',
      width: '20%'
    },
    {
      title: 'Role',
      dataIndex: 'role',
      width: '20%'
    },
    {
      width: '30%',
      title: 'Action',
      dataIndex: '',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.handleEditUser(record.id)}><Tooltip placement="right" title={"Edit User"}><Icon type="edit" /></Tooltip></a>
          <Divider type="vertical" />
          <Popconfirm title="Are you sure you want to delete this User?" onConfirm={() => this.handleDelete(record.id)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
            <a href="#"><Tooltip placement="right" title={"Delete User"}><Icon type="delete" /></Tooltip></a>
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
          <Tooltip placement="bottom" title={"Click to add a new User"}>
            <Button className="btn btn-secondary btn-sm" onClick={() => this.handleAdd()}><i className="fa fa-plus"></i> Add User</Button>
          </Tooltip>
        </span>
      </div>
      <div className="loader">
        <Spin spinning={this.state.initialDataLoading} size="large" />
      </div>
      <div style={{padding:"15px"}}>
      	<Table
          columns={userColumns}
          rowKey={record => record.id}
          dataSource={this.state.users}/>
      </div>

      <div>
	      <Modal
	          title="Add User"
	          visible={this.state.showAddUsers}
	          onOk={this.handleAddUserOk}
	          onCancel={this.handleAddUserCancel}
	          confirmLoading={confirmLoading}
	        >
		        <Form layout="vertical">
              <div className={'form-group' + (this.state.submitted && !this.state.newUser.firstName ? ' has-error' : '')}>
		            <Form.Item {...formItemLayout} label="First Name">
						    <Input id="firstName" name="firstName" onChange={this.onChange} placeholder="First Name" value={this.state.newUser.firstName}/>
                {this.state.submitted && !this.state.newUser.firstName &&
                        <div className="help-block">First Name is required</div>
                }
		            </Form.Item>
                </div>
		            <Form.Item {...formItemLayout} label="Last Name">
						<Input id="lastName" name="lastName" onChange={this.onChange} placeholder="Last Name" value={this.state.newUser.lastName}/>
		            </Form.Item>
                <div className={'form-group' + (this.state.submitted && !this.state.newUser.username ? ' has-error' : '')}>
		            <Form.Item {...formItemLayout} label="User Name">                
						<Input id="username" name="username" onChange={this.onChange} placeholder="User Name" value={this.state.newUser.username}/>
                {this.state.submitted && !this.state.newUser.username &&
                        <div className="help-block">User Name is required</div>
                }
		            </Form.Item>
                </div>
                <div className={'form-group' + (this.state.submitted && !this.state.newUser.password ? ' has-error' : '')}>
		            <Form.Item {...formItemLayout} label="Password">
						      <Input.Password id="password" name="password" onChange={this.onChange} value={this.state.newUser.password} placeholder="Password"/>
                  {this.state.submitted && !this.state.newUser.password &&
                        <div className="help-block">Password is required</div>
                }
		            </Form.Item>
                </div>
		            <Form.Item {...formItemLayout} label="Role">
                <Select name="role" id="role" style={{ width: 200 }} onSelect={this.handleRoleChange} value={this.state.newUser.role}>
                <Option value=""></Option>
                  <Option value="admin" >admin</Option>
                  <Option value="user">user</Option>
                </Select>
		            </Form.Item>
	            </Form>
	        </Modal>
     </div>
   </React.Fragment>
    );  }
}

export default Users;