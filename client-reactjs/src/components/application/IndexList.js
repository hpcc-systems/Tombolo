import React, { Component } from "react";
import { Button, Tooltip } from 'antd/lib';
import IndexDetailsForm from "./IndexDetails";
import IndexTree from "./IndexTree";
import BreadCrumbs from "../common/BreadCrumbs";
import { connect } from 'react-redux';

const columns = [{
  title: 'Title',
  dataIndex: 'title',
  sorter: true,
  width: '20%',
}];

class IndexList extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    data: [],
    pagination: {},
    loading: false,
    showAddDialog: false,
    applicationId: this.props.application ? this.props.application.applicationId : '',
    applicationTitle: this.props.application ? this.props.application.applicationTitle : '',
    refreshTree: false
  };

  componentWillReceiveProps(props) {
    if(props.application) {
      if(this.state.applicationId != props.application.applicationId) {
        this.setState({
          applicationId: props.application.applicationId
        });
        this.handleRefresh();
      }
    }
  }
  openAddIndexDlg() {
    console.log('openAddIndexDlg');
    this.setState({
      showAddDialog: true
    });
  }

  handleRefresh = () => {
    var currentSwitch = !this.state.refreshTree;
    this.setState({ refreshTree: currentSwitch });
  }

  handleClose = () => {
    this.setState({
      showAddDialog: false
    });
  }

  render() {
    if(!this.props.application || !this.props.application.applicationId)
      return null;

    return (
      <React.Fragment>
      <div className="d-flex justify-content-end" style={{paddingTop:"55px", margin: "5px"}}>
        <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle}/>
        <span style={{ marginLeft: "auto" }}>
          <Tooltip placement="bottom" title={"Click to add a new index"}>
            <Button className="btn btn-secondary btn-sm" onClick={() => this.openAddIndexDlg()}><i className="fa fa-plus"></i>Add</Button>
          </Tooltip>
        </span>

        {this.state.showAddDialog ?
          <IndexDetailsForm
            applicationId={this.state.applicationId}
            isNewFile={true}
            onRefresh={this.handleRefresh}
            onClose={this.handleClose}
            user={this.props.user}
            onRef={ref => (this.child = ref)}
            /> : null}
      </div>

      <div style={{padding:"25px"}}>
          <IndexTree refresh={this.state.refreshTree} applicationId={this.state.applicationId} user={this.props.user} />
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

const connectedFileList = connect(mapStateToProps)(IndexList);
export { connectedFileList as IndexList };

//export default IndexList;