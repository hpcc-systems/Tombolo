import React, { Component } from "react";
import { Table,message,Spin,Modal,Tabs } from 'antd/lib';
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
        sharedAppUsers:[]
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
          var userId=(this.props.user)?this.props.user.id:"";
          fetch("/api/user/"+userId+"/"+appId+"/sharedAppUser", {
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
        if(this.state.selectedRowKeys && this.state.selectedRowKeys.length==0)
        {message.config({top:150})
        message.error("Please select the user(s)");}
        else{   
        var _self=this;
        confirm({
          content: 'Are you sure you want to share an application?',
          onOk() {
            _self.SaveDetails();
          }
        }); 
      }       
    }
     SaveDetails() {          
      var _self=this;
        var userAppList=[];
        var appId=this.state.applicationId;
        (this.state.selectedRowKeys).forEach(function (item, idx) {
          userAppList.push({"user_id":item, "application_id":appId});
        });
      fetch('/api/app/read/saveUserApp', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({users : userAppList})
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
        {console.log("ShareApp render")}
        const{availableUsers,selectedRowKeys,sharedAppUsers}=this.state;
        const rowSelection = {
          selectedRowKeys,
            onChange:this.onSelectedRowUsersChange.bind(this) 
          };
          const usersColumns = [{
            title: 'Available Users',
            dataIndex: 'name',
            render: (text, row) => <a >{row.firstName+', '+row.lastName}</a>
          }];
          const sharedUsersColumns = [{
            title: 'Shared Users',
            dataIndex: 'name',
            render: (text, row) => <a >{row.firstName+', '+row.lastName}</a>
          }];
        return (
        <div>
          <Modal
	          title={'Share "'+this.state.applicationTitle+'" Application'}
	          visible={true}
            onOk={this.handleOk.bind(this)} 
            onCancel={this.handleCancel}
            destroyOnClose={true}
            bodyStyle={{height:"460px"}}
            okText="Share"
	        >  
          <Tabs
          defaultActiveKey="1">
          <TabPane tab="Available Users" key="1">       
          <div >
           <div className="loader">
           <Spin spinning={this.state.initialDataLoading} size="large" />
           </div>
                <Table
                  rowSelection={rowSelection}
                  columns={usersColumns}
                  rowKey={record => record.id}
                  dataSource={availableUsers}
                  pagination={{ pageSize: 5 }}
                />
              </div>
              </TabPane>
              <TabPane tab="Shared Users" key="2">  
              <div >          
                <Table
                  columns={sharedUsersColumns}
                  rowKey={record => record.id}
                  dataSource={sharedAppUsers}
                  pagination={{ pageSize: 5 }}
                />
              </div>
              </TabPane>
              </Tabs>
          </Modal>
       </div>
        );
      }
}
export default ShareApp;