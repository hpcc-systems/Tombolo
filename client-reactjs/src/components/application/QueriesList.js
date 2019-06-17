import React, { Component } from "react";
import { Button, Tooltip, Radio, Icon } from 'antd/lib';
import QueryDetailsForm from "./QueryDetails";
import QueryTable from "./QueryTable";
import BreadCrumbs from "../common/BreadCrumbs";
import { connect } from 'react-redux';

class QueriesList extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    applicationId: this.props.application ? this.props.application.applicationId : '',
    applicationTitle: this.props.application ? this.props.application.applicationTitle : '',
    openQueryDetailsDialog: false,
    refreshTree: false,
    tableView: true
  }

  componentWillReceiveProps(props) {
    if(props.application) {
      if(this.state.applicationId != props.application.applicationId) {
        this.setState({
          applicationId: props.application.applicationId
        });
        //this.handleRefresh();
      }
    }
  }

  openAddqueryDlg = () => {
    var _self = this;
    this.setState({
      openQueryDetailsDialog: true,
      selectedFile: ''
    });
    setTimeout(() => {
      _self.child.showModal();
    }, 200);
  }

  closeFileDlg = () => {
    this.setState({
      openQueryDetailsDialog: false
    });
  }


  handleRefresh = () => {
    var currentSwitch = !this.state.refreshTree;
    this.setState({ refreshTree: currentSwitch });
  }


  render() {
    if(!this.props.application || !this.props.application.applicationId)
      return null;
    return (
      <div>
        <div className="d-flex justify-content-end" style={{paddingTop:"55px"}}>
          <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle}/>
          <span style={{ marginLeft: "auto"}}>
            <Tooltip placement="bottom" title={"Click to add a new query"}>
              <Button className="btn btn-secondary btn-sm" onClick={() => this.openAddqueryDlg()}><i className="fa fa-plus"></i>Add Query</Button>
            </Tooltip>
          </span>
        </div>
        <div style={{padding:"15px"}}>
          <QueryTable refresh={this.state.refreshTree} applicationId={this.state.applicationId}/>

          {this.state.openQueryDetailsDialog ?
            <QueryDetailsForm
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

const connectedQueriesList = connect(mapStateToProps)(QueriesList);
export { connectedQueriesList as QueriesList };

//export default FileList;