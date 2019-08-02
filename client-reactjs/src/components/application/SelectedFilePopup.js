import React, { Component } from "react";
import { Icon } from 'antd/lib';
import { connect } from 'react-redux';
import {FileList} from "./FileList";
import { applicationActions } from '../../redux/actions/Application';
import { authHeader, handleError } from "../common/AuthHeader.js"
import $ from 'jquery';

class SelectedFilePopup extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    applicationId:this.props.match.params.applicationId,
    fileId:this.props.match.params.fileId,
    fileError:false
  } 

  componentWillMount(){
    this.ValidateAppIdFileId(this.state.applicationId,this.state.fileId);
    this.GetAppName(this.state.applicationId)
  }
  ValidateAppIdFileId(appId,fileIdValue){
    var _self = this;
    fetch("/api/file/read/CheckFileId?app_id="+appId+"&file_id="+fileIdValue, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then((data) => {
      if(data){
      }
      else{ 
        _self.setState({ fileError: true });    
       }
    })
    .catch(error => {
      console.log(error); 
     
    });
   
  }
  GetAppName(appId) {
    var appTitle='';       
      fetch("/api/app/read/app?app_id="+appId, {
        method: 'get',
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
        if(data){
        appTitle=data.title;   
        this.setState({ selected: appTitle }); 
        this.props.dispatch(applicationActions.applicationSelected(appId,appTitle)); 
        $('[data-toggle="popover"]').popover('disable');  
        }
      })
      .catch(error => {
        console.log(error);
      });          
  }
  render() {    
    if(this.state.fileError)
    {
      const styles = {
        border:'1px solid red',
        padding:'2px',
        width:'300px',
        paddingbottom:'5px'
      };
      return(
        <div>
          <div align="center" style={{paddingTop:"80px"}}>
        <div  style={styles} ><table><tr><td style={{paddingBottom:'5px',color:'red'}}>
          <Icon type="close-circle" /></td>
          <td style={{paddingLeft:'2px'}}><b> URL Application Id/File Id is invalid</b></td></tr></table></div>
        </div>
        </div>
      )
    }
    else 
    return (
      <div>
         <FileList fileId={this.state.fileId}/>
      </div>
  )
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
const connectedPopup = connect(mapStateToProps)(SelectedFilePopup);
export { connectedPopup as SelectedFilePopup };