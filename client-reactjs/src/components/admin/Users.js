import { DeleteOutlined, EditOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, Modal, notification, Popconfirm, Select, Spin, Table, Tooltip } from 'antd';
import React, { Component } from 'react';
import { authHeader, handleError } from '../common/AuthHeader.js';
import BreadCrumbs from '../common/BreadCrumbs';

const Option = Select.Option;

class Users extends Component {
  state = {
    users: [],
    selectedUsers: [],
    removeDisabled: true,
    showAddUser: false,
    confirmLoading: false,
    initialDataLoading: false,
    isUserUpdated: false,
    newUser: {
      id: '',
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      role: '',
    },
    submitted: false,
  };

  componentDidMount() {
    this.getUsers();
  }

  onSelectedRowKeysChange = (selectedRowKeys, selectedRows) => {
    var usersSelected = this.state.selectedusers,
      removeDisabled = true;
    usersSelected = selectedRows;
    this.setState({
      selectedusers: usersSelected,
    });
    removeDisabled = selectedRows.length > 0 ? false : true;
    this.setState({
      removeDisabled: removeDisabled,
    });
  };

  getUsers() {
    this.setState({
      initialDataLoading: true,
    });
    fetch('/api/user/', {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        this.setState({
          users: data,
        });
        this.setState({
          initialDataLoading: false,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleDelete = (id) => {
    fetch('/api/user/' + id, {
      method: 'delete',
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((_suggestions) => {
        notification.open({
          message: 'User Removed',
          description: 'The user has been removed.',
          onClick: () => {
            console.log('Closed!');
          },
        });
        this.getUsers();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  handleEditUser(userId) {
    fetch('/api/user/' + userId, {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        this.setState({
          ...this.state,
          newUser: {
            ...this.state.newUser,
            id: data.id,
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            role: data.role,
          },
          showAddUsers: true,
          isUserUpdated: true,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleAdd = (_event) => {
    this.setState({
      confirmLoading: false,
      submitted: false,
      newUser: {
        ...this.state.newUser,
        firstName: '',
        lastName: '',
        username: '',
        role: '',
      },
      showAddUsers: true,
    });
  };

  handleAddUserCancel = (_event) => {
    this.setState({
      showAddUsers: false,
    });
  };

  onChange = (e) => {
    this.setState({
      ...this.state,
      confirmLoading: false,
      newUser: { ...this.state.newUser, [e.target.name]: e.target.value },
    });
  };

  handleRoleChange = (value) => {
    this.setState({ ...this.state, newUser: { ...this.state.newUser, role: value } });
  };

  handleAddUserOk = () => {
    this.setState({
      confirmLoading: true,
      submitted: true,
    });
    if (this.state.newUser.firstName && this.state.newUser.username && this.state.newUser.password) {
      let data = JSON.stringify({
        firstName: this.state.newUser.firstName,
        lastName: this.state.newUser.lastName,
        username: this.state.newUser.username,
        password: this.state.newUser.password,
        role: this.state.newUser.role,
      });
      let url = this.state.isUserUpdated ? '/api/user/' + this.state.newUser.id : '/api/user/register';
      let method = this.state.isUserUpdated ? 'put' : 'post';
      fetch(url, {
        method: method,
        headers: authHeader(),
        body: data,
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then((_suggestions) => {
          this.setState({
            confirmLoading: false,
            showAddUsers: false,
            isUserUpdated: false,
            submitted: false,
          });
          this.getUsers();
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  render() {
    const { confirmLoading } = this.state;
    const userColumns = [
      {
        title: 'First Name',
        dataIndex: 'firstName',
        width: '25%',
      },
      {
        title: 'Last Name',
        dataIndex: 'lastName',
        width: '25%',
      },
      {
        title: 'User Name',
        dataIndex: 'username',
        width: '20%',
      },
      {
        title: 'Role',
        dataIndex: 'role',
        width: '20%',
      },
      {
        width: '30%',
        title: 'Action',
        dataIndex: '',
        render: (text, record) => (
          <span>
            <a href="#" onClick={() => this.handleEditUser(record.id)}>
              <Tooltip placement="right" title={'Edit User'}>
                <EditOutlined />
              </Tooltip>
            </a>
            <Divider type="vertical" />
            <Popconfirm
              title="Are you sure you want to delete this User?"
              onConfirm={() => this.handleDelete(record.id)}
              icon={<QuestionCircleOutlined />}>
              <a href="#">
                <Tooltip placement="right" title={'Delete User'}>
                  <DeleteOutlined />
                </Tooltip>
              </a>
            </Popconfirm>
          </span>
        ),
      },
    ];

    return (
      <React.Fragment>
        <BreadCrumbs
          applicationId={this.state.applicationId}
          extraContent={
            <Tooltip placement="bottom" title={'Click to add a new User'}>
              <Button type="primary" onClick={() => this.handleAdd()}>
                Add User
              </Button>
            </Tooltip>
          }
        />

        <div className="loader">
          <Spin spinning={this.state.initialDataLoading} size="large" />
        </div>
        <div style={{ padding: '15px' }}>
          <Table columns={userColumns} rowKey={(record) => record.id} dataSource={this.state.users} />
        </div>

        <div>
          <Modal
            title="Add User"
            visible={this.state.showAddUsers}
            onOk={this.handleAddUserOk}
            onCancel={this.handleAddUserCancel}
            confirmLoading={confirmLoading}>
            <Form layout="vertical">
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: 'First Name is required' }]}>
                <Input
                  id="firstName"
                  name="firstName"
                  onChange={this.onChange}
                  placeholder="First Name"
                  value={this.state.newUser.firstName}
                />
              </Form.Item>

              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: 'Last Name is required' }]}>
                <Input
                  id="lastName"
                  name="lastName"
                  onChange={this.onChange}
                  placeholder="Last Name"
                  value={this.state.newUser.lastName}
                />
              </Form.Item>

              <Form.Item
                label="User Name"
                name="username"
                rules={[{ required: true, message: 'User Name is required' }]}>
                <Input
                  id="username"
                  name="username"
                  onChange={this.onChange}
                  placeholder="User Name"
                  value={this.state.newUser.username}
                />
              </Form.Item>

              <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Password is required' }]}>
                <Input.Password
                  id="password"
                  name="password"
                  onChange={this.onChange}
                  value={this.state.newUser.password}
                  placeholder="Password"
                />
              </Form.Item>

              <Form.Item label="Role" name="role">
                <Select name="role" id="role" onSelect={this.handleRoleChange} value={this.state.newUser.role}>
                  <Option value=""></Option>
                  <Option value="admin">admin</Option>
                  <Option value="user">user</Option>
                </Select>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}

export default Users;
