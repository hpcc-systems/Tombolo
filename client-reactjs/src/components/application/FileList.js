import React, { Component } from "react";
import { Button, Tooltip, Radio, Icon, Menu, Dropdown } from 'antd/lib';
import FileTable from "./FileTable";
import FileDetailsForm from "./FileDetails";
import BreadCrumbs from "../common/BreadCrumbs";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { hasEditPermission } from "../common/AuthUtil.js";
import download from "downloadjs"

class FileList extends Component {

  constructor(props) {
    super(props);
  }
  state = {
    applicationId: this.props.application ? this.props.application.applicationId : '',
    applicationTitle: this.props.application ? this.props.application.applicationTitle : '',
    openFileDetailsDialog: false,
    refreshTree: false,
    tableView: true,
    fileId:(this.props.fileId) ? this.props.fileId: ''
  }
  componentWillReceiveProps(props) {
    console.log("file list")
    if(props.application) {
      if(this.state.applicationId != props.application.applicationId) {
        this.setState({
          applicationId: props.application.applicationId,
          applicationTitle: props.application.applicationTitle
        });
        this.handleRefresh();
      }
    }
  }

  openAddFileDlg = () => {
    console.log('openAddFileDlg')
    var _self = this;
    this.setState({
      openFileDetailsDialog: true,
      selectedFile: ''
    });
    setTimeout(() => {
      _self.child.showModal();
    }, 200);
  }

  closeFileDlg = () => {
    this.setState({
      openFileDetailsDialog: false
    });
  }

  handleToggleView = (evt) => {
    this.setState({
      fileId: ''
    });
    console.log(evt.target.value);
    evt.target.value == 'chart' ? this.setState({tableView: false}) : this.setState({tableView: true})
  }

  handleRefresh = () => {
    var currentSwitch = !this.state.refreshTree;
    this.setState({ refreshTree: currentSwitch });
  }

  handleSchemaDownload = (e) => {
    //message.info('Click on menu item.');
    var applicationId = this.state.applicationId;
    fetch("/api/file/read/downloadSchema?app_id="+applicationId+"&type="+e.key, {
      headers: authHeader()
    }).then((response) => {
      if(response.ok) {
        return response.blob();
      }
      handleError(response);
    }).then(blob => {
      download(blob, this.props.application.applicationTitle+'-schema.'+e.key);
    }).catch(error => {
      console.log(error);
    });
  }
  render() {
    const menu = (
      <Menu onClick={this.handleSchemaDownload}>
        <Menu.Item key="ecl">ECL</Menu.Item>
        <Menu.Item key="json">JSON</Menu.Item>
      </Menu>
    );

    const editingAllowed = hasEditPermission(this.props.user);

    if(!this.props.application || !this.props.application.applicationId)
      return null;
    return (
      <div className="site-layout-background">
        <div className="d-flex justify-content-end" style={{paddingTop:"50px", margin:"5px"}}>
          <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle}/>
          {editingAllowed ? 
            <span style={{ marginLeft: "auto", paddingTop:"5px"}}>
              <Tooltip placement="bottom" title={"Click to add a new file"}>
                <Button className="btn btn-secondary btn-sm" onClick={() => this.openAddFileDlg()}><i className="fa fa-plus pr-1"></i>Add</Button>
              </Tooltip>
              <Tooltip placement="left" title={"Click to export the ECL schema for this application"}>
                {/*<Button type="primary" style={{marginLeft: "10px"}} icon="download" onClick={() => this.handleSchemaExport()}> Export Schema</Button>*/}
                <Dropdown overlay={menu}>
                  <Button className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }} >
                    <i className="fa fa-download pr-2"></i>Export Schema
                  </Button>
                </Dropdown>
              </Tooltip>
            </span>
          : null}  
        </div>
        <div>
          <FileTable refresh={this.state.refreshTree} applicationId={this.state.applicationId} user={this.props.user}/> 

          {this.state.openFileDetailsDialog ?
            <FileDetailsForm
              onRef={ref => (this.child = ref)}
              applicationId={this.state.applicationId}
              applicationTitle={this.state.applicationTitle}
              isNew={true}
              onRefresh={this.handleRefresh}
              onClose={this.closeFileDlg}
              user={this.props.user}
              selectedAsset={''}
              /> : null}
        </div>
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

const connectedFileList = connect(mapStateToProps)(FileList);
export { connectedFileList as FileList };

//export default FileList;