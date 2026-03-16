import React from 'react';
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, Modal, Popconfirm, Select, Spin, Table, Tooltip } from 'antd';

import { handleError, handleSuccess } from '../common/handleResponse';
import BreadCrumbs from '../common/BreadCrumbs';
import Text from '../common/Text';
import usersService from '@/services/users.service';

const { Option } = Select;

interface UserRecord {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  role?: string;
}

interface State {
  users: UserRecord[];
  selectedUsers: any[];
  removeDisabled: boolean;
  showAddUser: boolean;
  confirmLoading: boolean;
  initialDataLoading: boolean;
  isUserUpdated: boolean;
  newUser: UserRecord & { submitted?: boolean };
  submitted: boolean;
}

class Users extends React.Component<{}, State> {
  state: State = {
    users: [],
    selectedUsers: [],
    removeDisabled: true,
    showAddUser: false,
    confirmLoading: false,
    initialDataLoading: false,
    isUserUpdated: false,
    newUser: { id: '', firstName: '', lastName: '', username: '', password: '', role: '' },
    submitted: false,
  };

  componentDidMount() {
    this.getUsers();
  }

  onSelectedRowKeysChange = (_selectedRowKeys: any, selectedRows: any) => {
    let usersSelected = selectedRows;
    let removeDisabled = selectedRows.length > 0 ? false : true;
    this.setState({ selectedUsers: usersSelected, removeDisabled });
  };

  async getUsers() {
    try {
      this.setState({ initialDataLoading: true });

      const response: any = await usersService.getAll();

      this.setState({ users: response.data || response, initialDataLoading: false });
    } catch (error: any) {
      handleError(error);
      this.setState({ initialDataLoading: false });
    }
  }

  handleDelete = async (id?: string | number) => {
    try {
      if (id === undefined) return;
      await usersService.delete({ id: String(id) });
      handleSuccess('The user has been removed.');
      await this.getUsers();
    } catch (error: any) {
      handleError(error);
    }
  };

  async handleEditUser(userId?: string | number) {
    try {
      if (userId === undefined) return;
      const response: any = await usersService.getOne({ id: String(userId) });
      const data = response.data || response;

      this.setState({
        newUser: {
          ...this.state.newUser,
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          role: data.role,
        },
        showAddUser: true,
        isUserUpdated: true,
      });
    } catch (error: any) {
      handleError(error);
    }
  }

  handleAdd = (_event?: any) => {
    this.setState({
      confirmLoading: false,
      submitted: false,
      newUser: { ...this.state.newUser, firstName: '', lastName: '', username: '', role: '' },
      showAddUser: true,
    });
  };

  handleAddUserCancel = (_event?: any) => {
    this.setState({ showAddUser: false });
  };

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      confirmLoading: false,
      newUser: { ...this.state.newUser, [e.target.name]: e.target.value } as any,
    });
  };

  handleRoleChange = (value: string) => {
    this.setState({ newUser: { ...this.state.newUser, role: value } as any });
  };

  handleAddUserOk = async () => {
    this.setState({ confirmLoading: true, submitted: true });

    if (this.state.newUser.firstName && this.state.newUser.username && this.state.newUser.password) {
      try {
        const userData = {
          firstName: this.state.newUser.firstName,
          lastName: this.state.newUser.lastName,
          username: this.state.newUser.username,
          password: this.state.newUser.password,
          role: this.state.newUser.role,
        };

        if (this.state.isUserUpdated) {
          await usersService.update({ userId: String(this.state.newUser.id), userData });
        } else {
          await usersService.create(userData);
        }

        this.setState({ confirmLoading: false, showAddUser: false, isUserUpdated: false, submitted: false });
        await this.getUsers();
      } catch (error: any) {
        handleError(error);
        this.setState({ confirmLoading: false });
      }
    }
  };

  render() {
    const { confirmLoading } = this.state;
    const userColumns = [
      { title: 'First Name', dataIndex: 'firstName', width: '25%' },
      { title: 'Last Name', dataIndex: 'lastName', width: '25%' },
      { title: 'User Name', dataIndex: 'username', width: '20%' },
      { title: 'Role', dataIndex: 'role', width: '20%' },
      {
        width: '30%',
        title: 'Action',
        dataIndex: '',
        render: (_text: any, record: any) => (
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
      <>
        <BreadCrumbs
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
          <Table columns={userColumns} rowKey={(record: any) => record.id} dataSource={this.state.users} />
        </div>

        <Modal
          title="Add User"
          open={this.state.showAddUser}
          onOk={this.handleAddUserOk}
          onCancel={this.handleAddUserCancel}
          confirmLoading={confirmLoading}>
          <Form layout="vertical">
            <Form.Item
              label={<Text text="First Name" />}
              name="firstName"
              rules={[{ required: true, message: 'First Name is required' }]}>
              <Input
                id="firstName"
                name="firstName"
                onChange={this.onChange}
                placeholder={'First Name'}
                value={this.state.newUser.firstName}
              />
            </Form.Item>

            <Form.Item
              label={<Text text="Last Name" />}
              name="lastName"
              rules={[{ required: true, message: 'Last Name is required' }]}>
              <Input
                id="lastName"
                name="lastName"
                onChange={this.onChange}
                placeholder={'Last Name'}
                value={this.state.newUser.lastName}
              />
            </Form.Item>

            <Form.Item
              label={<Text text="User Name" />}
              name="username"
              rules={[{ required: true, message: 'User Name is required' }]}>
              <Input
                id="username"
                name="username"
                onChange={this.onChange}
                placeholder={'User Name'}
                value={this.state.newUser.username}
              />
            </Form.Item>

            <Form.Item
              label={<Text text="Password" />}
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}>
              <Input.Password
                id="password"
                name="password"
                onChange={this.onChange}
                value={this.state.newUser.password}
                placeholder={'Password'}
              />
            </Form.Item>

            <Form.Item label={<Text text="Role" />} name="role">
              <Select onSelect={this.handleRoleChange} value={this.state.newUser.role}>
                <Option value="">{''}</Option>
                <Option value="admin">admin</Option>
                <Option value="user">user</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  }
}

export default Users;
