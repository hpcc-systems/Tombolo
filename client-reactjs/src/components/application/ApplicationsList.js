import React, { Component } from "react";
import { Select, Tooltip, Menu, Button, Icon, Dropdown } from 'antd/lib';
import { withRouter } from 'react-router-dom';
import '@trendmicro/react-dropdown/dist/react-dropdown.css';
import '@trendmicro/react-buttons/dist/react-buttons.css';
import 'font-awesome/css/font-awesome.min.css';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { connect } from 'react-redux';
import { applicationActions } from '../../redux/actions/Application';

const Option = Select.Option;

class ApplicationsList extends Component {

  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    applications: [],
    //selected:this.props.applicationId ? this.props.applicationId.applicationId : (this.props.history.location.pathname.split("/").length > 2 ? this.props.history.location.pathname.split("/")[1] : "")
    selected:'Select an Application'
  }

 componentDidMount() {
    fetch("/api/app/read/app_list", {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      let applications = data.map(application => { return {value: application.id, display: application.title} })
      this.setState({ applications });
    }).catch(error => {
      console.log(error);
    });
  }

  handleChange(event) {
    //this.props.onAppicationSelect(value);
    this.props.dispatch(applicationActions.applicationSelected(event.key, event.item.props.children));
    this.setState({ selected: event.item.props.children });
    this.props.history.push('/'+event.key+'/workflow')
  }

  render() {
    const { selected } = this.state;
    const Menus = (
      <Menu onClick={this.handleChange} selectedKeys={[this.state.selected]}>
        {this.state.applications.map((application, index) => (
          <Menu.Item key={application.value}>{application.display}</Menu.Item>
        ))}
      </Menu>
    );
    return (

      <div style={{display:'inline-block'}}>
          <Tooltip placement="right" title={"Select an application"} mouseLeaveDelay={0}>
            <Dropdown overlay={Menus}>
              <Button style={{ marginLeft: 8 }}>{this.state.selected}<Icon type="down" />
              </Button>
            </Dropdown>
          </Tooltip>
        </div>
    )
  }
}

function mapStateToProps(state) {
  const { application, selectedTopNav } = state.applicationReducer;
  return {
    application,
    selectedTopNav
  };
}

//export default ApplicationsList;
const connectedApplicationList = connect(mapStateToProps)(withRouter(ApplicationsList));
export default connectedApplicationList;
