import React, { Component } from "react";
import { Button, Tooltip, Radio, Icon, Menu, Dropdown } from 'antd/lib';
import FileTable from "./FileTable";
import FileDetailsForm from "./FileDetails";
import JSPlumbTree from "./JSPlumbTree";
import BreadCrumbs from "../common/BreadCrumbs";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js"
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
    tableView: false,
    fileId:(this.props.fileId)?this.props.fileId:''
  }
  componentWillReceiveProps(props) {
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

    if(!this.props.application || !this.props.application.applicationId)
      return null;
    return (
      <div>
        <div className="d-flex justify-content-end" style={{paddingTop:"50px"}}>
          <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle}/>
          <span style={{ marginLeft: "auto"}}>
            <Radio.Group defaultValue="chart" buttonStyle="solid" style={{padding: "10px"}} onChange={this.handleToggleView}>
              <Tooltip placement="bottom" title={"Tree View"}><Radio.Button value="chart"><Icon type="cluster" /></Radio.Button></Tooltip>
              <Tooltip placement="bottom" title={"Tabular View"}><Radio.Button value="grid"><Icon type="bars" /></Radio.Button></Tooltip>
            </Radio.Group>
            <Tooltip placement="bottom" title={"Click to add a new file"}>
              <Button className="btn btn-secondary btn-sm" onClick={() => this.openAddFileDlg()}><i className="fa fa-plus"></i>Add File</Button>
            </Tooltip>
            <Tooltip placement="left" title={"Click to export the ECL schema for this application"}>
              {/*<Button type="primary" style={{marginLeft: "10px"}} icon="download" onClick={() => this.handleSchemaExport()}>Export Schema</Button>*/}
              <Dropdown overlay={menu}>
                <Button className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }} >
                  <i className="fa fa-download"></i> Export Schema
                </Button>
              </Dropdown>
            </Tooltip>
          </span>
        </div>
        <div>
          {this.state.tableView ? <FileTable refresh={this.state.refreshTree} applicationId={this.state.applicationId}/> : <JSPlumbTree refresh={this.state.refreshTree} applicationId={this.state.applicationId} fileId={this.state.fileId}  onScroll={this.handleScroll}/>}

          {this.state.openFileDetailsDialog ?
            <FileDetailsForm
              onRef={ref => (this.child = ref)}
              applicationId={this.state.applicationId}
              isNewFile={true}
              onRefresh={this.handleRefresh}
              onClose={this.closeFileDlg}
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