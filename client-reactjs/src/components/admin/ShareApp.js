import React, { Component } from "react";
import { Table,message,Spin,Modal,Tabs, AutoComplete, Form, Input, Icon, Button } from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js";  
const { confirm } = Modal;
const TabPane = Tabs.TabPane;
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
      autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />,
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

    getSharedAppUserList(appId) {
     if(appId){
      var userId=(this.props.user)?this.props.user.username:"";
      fetch("/api/user/"+appId+"/sharedAppUser", {
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

    searchUsers(searchString) {
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
          autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />
        });
      }).catch(error => {
        console.log(error)
        message.config({top:150})
        message.error("Error occured while searching for users.");

      });
    }

    onUserSelected = (selectedUser) => {
      this.setState({
        ...this.state,
        shareButtonEnabled: true,
        selectedUser: selectedUser
      });
    }

    saveDetails() {          
      var _self=this;
      fetch('/api/app/read/saveUserApp', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({users : [{'user_id': _self.state.selectedUser, 'application_id':_self.state.applicationId}]})
      }).then(function(response) {
        if(response.ok) {             
          _self.getUserList(_self.state.applicationId );   
          _self.getSharedAppUserList(_self.state.applicationId );         
          message.config({top:150})
          message.success("Application shared successfully");
          _self.setState({
            visible: false
          });
          _self.props.onClose();
        }
      }).then(function(data) {
        console.log('Saved..');
      });
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
        title: 'Shared Users',
        dataIndex: 'name',
        render: (text, row) => <a >{row.firstName+' '+row.lastName}</a>
      }];
      return (
        <div>
          <Modal
            title={'Share "'+this.state.applicationTitle+'" Application'}
            visible={true}
            onCancel={this.handleCancel}
            destroyOnClose={true}
            bodyStyle={{height:"460px"}}
            okText="Share"
            footer={[
            <Button key="cancel" onClick={this.handleCancel}>
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
              size="large"
              style={{ width: '60%', paddingRight:"5px" }}
              dataSource={userSuggestions}
              onChange={(value) => this.searchUsers(value)}
              onSelect={(value) => this.onUserSelected(value)}
              placeholder="Search users"
              optionLabelProp="value"
            >
              <Input id="autocomplete_field" suffix={this.state.autoCompleteSuffix} autoComplete="off"/>
            </AutoComplete>
            <Button type="primary" disabled={!shareButtonEnabled} onClick={this.saveSharedDetails}>Share Application</Button>
          </div>  
          <div >          
            <Table
              columns={sharedUsersColumns}
              rowKey={record => record.id}
              dataSource={sharedAppUsers}
              pagination={{ pageSize: 5 }}
            />
          </div>

          </Modal>
       </div>
      );
    }
}
export default ShareApp;