import React, { Component } from "react";
import { Table, Button,message,Tooltip, Icon, Popconfirm,Spin,Modal } from 'antd/lib';
import BreadCrumbs from "../common/BreadCrumbs";
import { authHeader, handleError } from "../common/AuthHeader.js";  
import { connect } from 'react-redux';
const { confirm } = Modal;
class ShareApp extends Component {
    constructor(props) {
      super(props);
    }
    state = {
        applicationId: this.props.application ? this.props.application.applicationId : '',
        applicationTitle: this.props.application ? this.props.application.applicationTitle : '',
        availableUsers:[],
        selectedRowKeys:[],
        initialDataLoading: false
    }
    componentDidMount() {
        this.getUserList(this.state.applicationId);
    }    
    componentWillReceiveProps(props) {  
      if(props.application) {
        if(this.state.applicationId != props.application.applicationId) {
          this.setState({
            ...this.state,
            applicationId: props.application.applicationId,
            applicationTitle: props.application.applicationTitle
          });
          this.setState({
            selectedRowKeys: []
          });
          this.getUserList(props.application.applicationId);
        }
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
           _self.setState({
            selectedRowKeys:[]
          });
          message.config({top:150})
          message.success("Application shared successfully");
          }
      }).then(function(data) {
        console.log('Saved..');
      });
    }
    
    render() {
        {console.log("ShareApp render")}
        const{availableUsers,selectedRowKeys}=this.state;
        const hasSelected = this.state.selectedRowKeys.length > 0;
        const rowSelection = {
          selectedRowKeys,
            onChange:this.onSelectedRowUsersChange.bind(this) 
          };
          const usersColumns = [{
            title: 'Available Users',
            dataIndex: 'name',
            render: (text, row) => <a >{row.lastName+', '+row.firstName}</a>
          }];
          if(!this.props.application || !this.props.application.applicationId)
      return null;
        return (
        <React.Fragment>
          <div className="d-flex justify-content-end" style={{paddingTop:"60px"}}>          
            <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle} />  
            <span style={{ marginLeft: "auto" }}>
            </span>          
          
          </div>
          <div style={{padding:"15px"}}>
           <div className="loader">
           <Spin spinning={this.state.initialDataLoading} size="large" />
           </div>
                <Table
                  rowSelection={rowSelection}
                  columns={usersColumns}
                  rowKey={record => record.id}
                  dataSource={availableUsers}
                />
              </div>
              <div align="right">
              <span>
            <Tooltip placement="bottom" title={"Click to share an application"}>            
              <Button type="primary" onClick={this.saveSharedDetails.bind(this)}  disabled={!hasSelected} ><i className="fa fa-share-alt" style={{paddingRight:"4px"}}  disabled={!hasSelected}></i>  Share an Application</Button>
             
            </Tooltip>
          </span>
              </div>
          
       </React.Fragment>
        );
      }
}
function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  const { application, selectedTopNav } = state.applicationReducer;
  return {
      user,
      application,
      selectedTopNav
  };
}

const connectedShareApp = connect(mapStateToProps)(ShareApp);
export { connectedShareApp as ShareApp };
//export default ShareApp;