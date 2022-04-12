import React, { Component } from "react";
import { Table,message,Spin,Modal, AutoComplete, Select, Button, Popconfirm, Tooltip } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js";
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined, SearchOutlined  } from '@ant-design/icons';
import debounce from 'lodash/debounce';
const { confirm } = Modal;
const { Option } = Select;
class ShareApp extends Component {
    constructor(props) {
      super(props);
    }
    state = {
      applicationId: this.props.appId?this.props.appId : '',
      applicationTitle: this.props.appTitle ? this.props.appTitle : '',
      availableUsers:[],
      selectedRowKeys:[],
      initialDataLoading: false,
      sharedAppUsers:[],
      autoCompleteSuffix: <SearchOutlined />,
      userSuggestions: [],
      shareButtonEnabled: false,
      selectedUser: ''
    }

    componentDidMount(){
      if(this.props.appId) {
        this.setState({
          ...this.state,
          applicationId: this.props.appId,
         applicationTitle: this.props.appTitle
        });
        this.setState({
          selectedRowKeys: []
        });
        this.getUserList(this.props.appId);
        this.getSharedAppUserList(this.props.appId);
      }
    }

    // GET USERS 
    getUserList(appId) {
     if(appId){
      this.setState({
        initialDataLoading: true
      });
      var userId=(this.props.user)?this.props.user.id:"";
      fetch("/api/user/"+userId+"/"+appId, {
        method: 'get',
        headers: authHeader()
      }).then((response) => {
          if(response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then(data => {
          this.setState({
            ...this.state,
            availableUsers: data,
            initialDataLoading: false
          });
        }).catch(error => {
          console.log(error);
        });
      }
    }

    // GROUP USERS E-MAIL AND NAME SHOW IT DISPLAYS RIGHT WAY IN AUTOCOMPLETE
    groupUserDetails = (user) =>{
    return (
        <div style={{padding: '5px', borderBottom: '1px dotted lightgray'}}>
            <p style={{marginBottom : '-5px', fontWeight: '600'}}>{user.text}</p>
            <p style={{ marginBottom : '0px', color: 'gray'}}>{user.email}</p>
        </div>
    )
}

    getSharedAppUserList(appId) {
     if(appId){
      var username=(this.props.user)?this.props.user.username:"";
      fetch(`/api/user/${appId}/sharedAppUser/${username}`, {
        method: 'get',
        headers: authHeader()
      }).then((response) => {
          if(response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then(data => {
          this.setState({
            ...this.state,
            sharedAppUsers: data
          });
        }).catch(error => {
          console.log(error);
        });
      }
    }

    onSelectedRowUsersChange = (selectedRowKeys) => {
      this.setState({
        selectedRowKeys
      });
    }

    saveSharedDetails= () => {
      var _self=this;
      if(_self.state.sharedAppUsers.filter(user => user.username == _self.state.selectedUser).length > 0) {
        message.config({top:150})
        message.error("This application has already been shared with user '"+_self.state.selectedUser+"'. Please select a different user.");
        return;
      }
      confirm({
        content: 'Are you sure you want to share an application?',
        onOk() {
          _self.saveDetails();
        }
      });
    }

    searchUsers = debounce((searchString) =>{
      let _self=this;
      if(searchString.length <= 3) {
        this.setState({
          ...this.state,
          shareButtonEnabled: false
        });
        return;
      }
      _self.setState({
        ...this.state,
        autoCompleteSuffix : <Spin/>
      });

      fetch("/api/user/searchuser?searchTerm="+searchString, {
        method: 'get',
        headers: authHeader()
      }).then((response) => {
        if(response.ok) {
          return response.json();
        } else {
          throw response;
        }
      }).then(suggestions => {
        _self.setState({
          ..._self.state,
          userSuggestions: suggestions,
          autoCompleteSuffix: <SearchOutlined />
        });
      }).catch(error => {
        console.log(error)
        message.config({top:150})
        message.error("Error occurred while searching for users.");

      });
    }, 400);

    onUserSelected = (selectedUser, user) => {
      this.setState({
        ...this.state,
        shareButtonEnabled: true,
        selectedUser: user.key
      });
    }

    // SAVE APPLICATION SHARE DETAILS
    saveDetails() {
      var _self=this;
      fetch('/api/app/read/shareApplication', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({data : {'user_id': _self.state.selectedUser, 'application_id':_self.state.applicationId, 'appTitle' : _self.state.applicationTitle}})
      }).then(function(response) {
        if(!response.ok) {
         throw Error('Failed to share application')
        }
         _self.getUserList(_self.state.applicationId );
          _self.getSharedAppUserList(_self.state.applicationId );
          message.config({top:150})
          message.success("Application shared successfully");
          _self.props.onClose();
      }).catch((err) =>{
          message.error(err.message)
      })
    }

    handleOk = () => {
      this.saveSharedDetails();
    }

    handleCancel = () => {
      this.setState({
        visible: false
      });
      this.props.onClose();
    }

    // STOP APPLICATION SHARE 
    handleStopApplicationShare = async (record) => {
      try{
        await fetch('/api/app/read/stopApplicationShare', {
          method: 'post',
          headers: authHeader(),
          body: JSON.stringify({'application_id': this.props.appId, 'username': record.username})
        })
        message.success(`${this.state.applicationTitle} is no longer shared with ${record.firstName} ${record.lastName}`)
        this.setState({sharedAppUsers : this.state.sharedAppUsers.filter(user => user.username !== record.username)})
      }catch(err){
        message.error('Failed to stop stop application share')
      }
    }

    render() {
      const{availableUsers, selectedRowKeys, sharedAppUsers, userSuggestions, shareButtonEnabled} = this.state;
      const formItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 3 },
      },
      wrapperCol: {
        xs: { span: 2 },
        sm: { span: 10 },
      },
    };

    const rowSelection = {
      selectedRowKeys,
        onChange:this.onSelectedRowUsersChange.bind(this)
      };
      const usersColumns = [{
        title: 'Name',
        dataIndex: 'name',
        render: (text, row) => <a >{row.firstName+' '+row.lastName}</a>
      },{
        title: 'User Name',
        dataIndex: 'username'
      }];
      const sharedUsersColumns = [{
        title: 'Shared User',
        width: '80%',
        dataIndex: 'name',
        render: (text, row) => <a >{row.firstName+' '+row.lastName}</a>
      },{
      title: 'Action',
      dataIndex: '',
      render: (text, record) =>
        <span>
          <Popconfirm title={`Are you sure you want to stop sharing this application with ${record.firstName} ${record.lastName}?`} onConfirm={() => this.handleStopApplicationShare(record)} icon={<QuestionCircleOutlined />}>
            <a href="#"><Tooltip placement="right" title={"Stop Sharing"}><DeleteOutlined /></Tooltip></a>
          </Popconfirm>
        </span>
    }];
      return (
        <div>
          <Modal
            title={'Share "'+this.state.applicationTitle+'" Application'}
            visible={true}
            bodyStyle = {{maxHeight : '400px', minHeight: '300px', overflow: 'auto'}}
            onCancel={this.handleCancel}
            destroyOnClose={true}
            okText="Share"
            footer={[
            <Button key="cancel" onClick={this.handleCancel} type='primary'>
              Close
            </Button>
          ]}
          >
          <div style={{ paddingBottom:"5px" }}>
            <AutoComplete
              className="certain-category-search"
              dropdownClassName="certain-category-search-dropdown"
              dropdownMatchSelectWidth={false}
              dropdownStyle={{ width: 300 }}
              style={{ width: '70%', paddingRight:"5px" }}
              onSearch={(value) => this.searchUsers(value)}
              onSelect={(value, user) => this.onUserSelected(value,user)}
              placeholder="Search users"
            >
              {userSuggestions.map((user) => {
                return <Option key={user.value} value={user.text}>{this.groupUserDetails(user)}</Option>;
              })}
            </AutoComplete>
            <Button type="primary" disabled={!shareButtonEnabled} onClick={this.saveSharedDetails}>Share Application</Button>
          </div>
          <div  style={{marginTop: '15px'}}>
            <Table
              columns={sharedUsersColumns}
              rowKey={record => record.id}
              dataSource={sharedAppUsers}
              pagination={false}
              size = 'small'
              bordered= {true}
            />
          </div>

          </Modal>
       </div>
      );
    }
}
export default ShareApp;