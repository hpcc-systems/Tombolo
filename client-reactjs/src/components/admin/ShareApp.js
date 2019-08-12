import React, { Component } from "react";
import { Table,message,Spin,Modal } from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js";  
const { confirm } = Modal;
class ShareApp extends Component {
    constructor(props) {
      super(props);
    }
    state = {
        applicationId: this.props.appId?this.props.appId : '',
        applicationTitle: this.props.appTitle ? this.props.appTitle : '',
        availableUsers:[],
        selectedRowKeys:[],
        initialDataLoading: false
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
      }  
    }
    getUserList(appId) {
      var val=[];
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
        const{availableUsers,selectedRowKeys}=this.state;
        const rowSelection = {
          selectedRowKeys,
            onChange:this.onSelectedRowUsersChange.bind(this) 
          };
          const usersColumns = [{
            title: 'Available Users',
            dataIndex: 'name',
            render: (text, row) => <a >{row.lastName+', '+row.firstName}</a>
          }];
        return (
        <div>
          <Modal
	          title={'Share "'+this.state.applicationTitle+'" Application'}
	          visible={true}
            onOk={this.handleOk.bind(this)} 
            onCancel={this.handleCancel}
            destroyOnClose={true}
            bodyStyle={{height:"410px"}}
            okText="Share"
	        >         
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
          </Modal>
       </div>
        );
      }
}
export default ShareApp;