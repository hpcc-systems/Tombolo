import React, { Component } from "react";
import {Layout, Menu, Icon, message, Tooltip,Input} from 'antd/lib';
import { NavLink, Switch, Route, withRouter } from 'react-router-dom';
import { userActions } from '../../redux/actions/User';
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { applicationActions } from '../../redux/actions/Application';
import $ from 'jquery';

const { Header, Content } = Layout;
const { Search } = Input;

class AppHeader extends Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleTopNavClick = this.handleTopNavClick.bind(this);
        this.search = this.search.bind(this);
        this.onChangeSearch = this.onChangeSearch.bind(this);
    }

    state = {
        applications: [],
        selected:'Select an Application',
        pathName:'',
        searchText:''
    }
    componentWillReceiveProps(props) {
      if(props.application && props.application.applicationTitle!=''){
      this.setState({ selected: props.application.applicationTitle });
        $('[data-toggle="popover"]').popover('disable');
      }
    }
    componentDidMount(){
      if(this.props.location.pathname.includes('report/')){
        const pathSnippets = this.props.location.pathname.split('/');
        this.setState({
          searchText: pathSnippets[2]
      });
      }
    }
    componentDidUpdate(prevProps, prevState) {
      if(this.state.applications.length == 0) {
        var url="/api/app/read/app_list";
        if(this.props.user && this.props.user.role=='user')
          url="/api/app/read/appListByUserId?user_id="+this.props.user.id;
          fetch(url, {
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
            if(applications && applications.length > 0) {
              this.setState({ applications });
            }
          }).catch(error => {
            console.log(error);
          });
      }
    }

    handleTopNavClick(event) {
      console.log("handleTopNavClick")
      var nav = event.target.getAttribute("data-nav");
      if(nav == '/logout')
          return;
      nav = (nav == '/' ? ('/'+this.props.applicationId.applicationId+'/files') : nav)
      this.setState({
          selectedTopNav: nav
      });
      this.props.dispatch(applicationActions.topNavChanged(nav));
      if(this.props.applicationId) {
          this.props.dispatch(applicationActions.applicationSelected(this.props.applicationId.applicationId));
      }
      this.props.history.push(nav);
    }

    handleLogOut = (e) => {
        localStorage.removeItem('user');
        this.setState({
            applicationId: '',
            selected: 'Select an Application'
        });
        this.props.dispatch(applicationActions.applicationSelected('', ''));

        this.props.dispatch(userActions.logout());

        this.props.history.push('/login');
        message.success('You have been successfully logged out. ');
    }

    handleChange(event) {
      console.log("handleChange: "+event.target.getAttribute("data-value"))
      //this.props.onAppicationSelect(value);
      this.props.dispatch(applicationActions.applicationSelected(event.target.getAttribute("data-value"), event.target.getAttribute("data-display")));
      this.setState({ selected: event.target.getAttribute("data-display") });
      this.props.history.push('/'+event.target.getAttribute("data-value")+'/jobs');
      $('[data-toggle="popover"]').popover('disable');
    }
    search(value){
      this.props.history.push('/report/'+value);
    }

    onChangeSearch=(e)=> {
      this.setState({searchText: e.target.value });
    }
  render() {
    const hasAdminRole = (this.props.user && this.props.user.role == 'admin');
    const applicationId = this.props.application ? this.props.application.applicationId : '';
    const selectedTopNav = (window.location.pathname.indexOf("/admin") != -1) ? "/admin/applications" : (applicationId != '' ? "/" + applicationId + "/files" : "/files")
    const appNav = (applicationId != '' ? "/" + applicationId + "/files" : "/files");

    if(!this.props.user || !this.props.user.token)
        return null;
    return (
        <nav className="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
          <a className="home-logo navbar-brand" href="/">Tombolo</a>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarsExampleDefault">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="applicationSelect" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{this.state.selected}</a>
                <div className="dropdown-menu" aria-labelledby="dropdown01">
                    {this.state.applications.map((application, index) => (
                        <a className="dropdown-item" key={application.value} onClick={this.handleChange} data-value={application.value} data-display={application.display}>{application.display}</a>
                    ))}
                </div>
              </li>
              {/*<li className="nav-item">
                <a className="nav-link" href="#"><i className="fa fa-lg fa-plus-circle"></i></a>
              </li>*/}

            </ul>
            <ul className="ml-md-auto navbar-nav">
            <li className="nav-item">
              <Search
                value={this.state.searchText}
                name="searchText"
                placeholder="Search"
                onSearch={this.search}
                onChange={this.onChangeSearch}
                style={{ width: 200 }} />
              </li>
              {/*
              <li className="nav-item">
                <a className="nav-link" data-nav="/admin/applications" onClick={this.handleTopNavClick} disabled={!hasAdminRole}><i className="fa fa-lg fa-cog"></i> Settings</a>
              </li>*/}
              <li className="nav-item">
                <a className="nav-link" onClick={this.handleLogOut}><i className="fa fa-sign-out"></i> Logout</a>
              </li>
            </ul>
          </div>
        </nav>
    )
  }
}

function mapStateToProps(state) {
    const { loggingIn, user } = state.authenticationReducer;
    const { application, selectedTopNav } = state.applicationReducer;
    return {
        loggingIn,
        user,
        application,
        selectedTopNav
    };
}

//export default withRouter(AppHeader);
const connectedAppHeader = connect(mapStateToProps)(withRouter(AppHeader));
export { connectedAppHeader as AppHeader };



