import React from 'react';
import {withRouter} from 'react-router';
import { userActions } from '../../redux/actions/User';
import { connect } from 'react-redux';
import {message, Row, Col, Tooltip} from 'antd/lib';
import { Constants } from '../../components/common/Constants';
import { ArrowLeftOutlined } from '@ant-design/icons';

class LoginPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      submitted: false,
      loginView: true,
      registrationView: false,
      firstName: '',
      lastName:'',
      email:'',
      newUsername:'',
      newPassword:'',
      confirmNewPassword:''
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
     this.userName.focus();
  }

  componentWillReceiveProps(nextProps){
    if(nextProps.loginFailed) {
      message.error("Login failed. Incorrect user name or password!");
      return;
    }
    if(nextProps.loggingIn != this.props.loggingIn) {
      if(nextProps.loggedIn){
        var state=this.props.location.state;
        if(state && state.from.pathname) {
          this.props.history.push(state.from.pathname);
        }
        else {
          this.props.history.push('/dataflow');
        }
      }
    }

    if(nextProps.newUserRegistering && nextProps.userRegistrationSuccess != undefined && !nextProps.userRegistrationSuccess) {
      message.error("User Registration Failed: "+nextProps.userRegistrationError);
      return;
    }

    if(!nextProps.newUserRegistering && nextProps.userRegistrationSuccess != undefined && nextProps.userRegistrationSuccess) {
      if(nextProps.status == 201) {
        message.info("Registration Succesful. Please login using the account you just created")
      } else if(nextProps.status == 202) {
        message.info("It looks like an account already exists for you. If you already registered for RealBI application, please login to Tombolo using your RealBI account.")
      }
      setTimeout(() => {
        window.location = '/login';
      }, 2000);

    }
  }

  handleChange(e) {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.setState({ submitted: true });
    const { username, password } = this.state;
    if (username && password) {
      this.props.dispatch(userActions.login(username, password));
    }
  }

  handleRegister = (e) => {
    this.props.dispatch({type: Constants.REGISTER_USER_REQUEST});
    this.setState({
      loginView: false,
      registrationView: true,
      submitted: false
    });
  }

  handleForgotPassword = () => {
    window.location = '/forgot-password';
  }

  handleBack = (e) => {
    this.setState({
      loginView: true,
      registrationView: false,
      submitted: false
    });
  }

  handleSubmitRegistration = (e) => {
    this.setState({ submitted: true });
    if(this.state.newPassword != this.state.confirmNewPassword) {
      message.error("Passwords does not match.");
      return;
    }
    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})");
    if(!strongRegex.test(this.state.newPassword)) {
      message.error("Weak Password. To make passwords stronger, it must be minimum 8 characters long, contain upper and lower case letters, numbers, and special characters.")
      return;
    }
    if(this.isRegistrationFormFieldsValid()) {
      this.props.dispatch(userActions.registerNewUser({
        firstName: this.state.firstName,
        lastName: this.state.lastName,
        email: this.state.email,
        username: this.state.newUsername,
        password: this.state.newPassword,
        confirmPassword: this.state.confirmNewPassword
      }));
    }
  }

  isRegistrationFormFieldsValid = () => {
    if(this.state.firstName != '' &&
        this.state.lastName != '' &&
        this.state.email != '' &&
        this.state.newUsername != '' &&
        this.state.newPassword != '' &&
        this.state.confirmNewPassword != ''
        ) {
      return true;
    } else {
      return false;
    }
  }

  render() {
      const { username, password, submitted, firstName, lastName, email, newUsername, newPassword, confirmNewPassword, loginView } = this.state;
      const { id } = this.props.match.params;
      return (
        <React.Fragment>
          {loginView ?
          <React.Fragment>
            <div className="login-form shadow-lg p-3 mb-5 bg-white rounded">
              <form name="form" onSubmit={this.handleSubmit} method="post">
                <h2 className="text-center login-logo">Tombolo</h2>
                <div className={'form-group' + (submitted && !username ? ' has-error' : '')}>
                  <label htmlFor="username">Username</label>
                  <input type="text" className="form-control" name="username" value={username} onChange={this.handleChange} ref={(input) => { this.userName = input; }}/>
                  {submitted && !username &&
                      <div className="help-block">Username is required</div>
                  }
                </div>
                <div className={'form-group' + (submitted && !password ? ' has-error' : '')}>
                  <label htmlFor="password">Password</label>
                  <input type="password" className="form-control" name="password" value={password} onChange={this.handleChange} />
                  {submitted && !password &&
                      <div className="help-block">Password is required</div>
                  }
                </div>
                <div className="form-group">
                    <button className="btn btn-primary btn-block">Login</button>
                </div>
                <div className="clearfix">
                  <p className="text-center"><a href="#" onClick={this.handleForgotPassword}>Forgot Password?</a></p>
                </div>

                <div className="form-group">
                  <p className="text-center"><a href="#" onClick={this.handleRegister}>Register</a></p>
                </div>
              </form>
            </div>
          </React.Fragment>
        : <React.Fragment>
            <div className="login-form-registration shadow-lg p-3 mb-5 bg-white rounded">
              <a href="#" onClick={this.handleBack}><Tooltip placement="right" title={"Back to Login"}><ArrowLeftOutlined /></Tooltip></a>
              <h2 className="text-center login-logo">Tombolo</h2>
              <Row type="flex" justify="space-between">
                <Col span={12} style={{"paddingRight":"5px"}}>
                  <div className={'form-group' + (submitted && !username ? ' has-error' : '')}>
                    <label htmlFor="username">First Name</label>
                    <input type="text" className="form-control" name="firstName" value={firstName} onChange={this.handleChange}/>
                    {submitted && !firstName &&
                        <div className="help-block">First Name is required</div>
                    }
                  </div>
                </Col>
                <Col span={12}>
                  <div className={'form-group' + (submitted && !password ? ' has-error' : '')}>
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" className="form-control" name="lastName" value={lastName} onChange={this.handleChange} />
                    {submitted && !lastName &&
                        <div className="help-block">Last Name is required</div>
                    }
                  </div>
                </Col>
              </Row>

              <Row type="flex" justify="space-between">
                <Col span={24} style={{"paddingRight":"5px"}}>
                  <div className={'form-group' + (submitted && !email ? ' has-error' : '')}>
                    <label htmlFor="email">Email</label>
                    <input type="text" className="form-control" name="email" value={email} onChange={this.handleChange}/>
                    {submitted && !email &&
                        <div className="help-block">Email is required</div>
                    }
                  </div>
                </Col>
              </Row>
              <Row type="flex" justify="space-between">
                <Col span={24}>
                  <div className={'form-group' + (submitted && !newUsername ? ' has-error' : '')}>
                    <label htmlFor="newUsername">User Name</label>
                    <input type="text" className="form-control" name="newUsername" value={newUsername} onChange={this.handleChange} />
                    {submitted && !newUsername &&
                        <div className="help-block">User Name is required</div>
                    }
                  </div>
                </Col>
              </Row>

              <Row type="flex" justify="space-between">
                <Col span={12} style={{"paddingRight":"5px"}}>
                  <div className={'form-group' + (submitted && !newPassword ? ' has-error' : '')}>
                    <label htmlFor="newPassword">Password</label>
                    <input type="password" className="form-control" name="newPassword" value={newPassword} onChange={this.handleChange}/>
                    {submitted && !newPassword &&
                        <div className="help-block">Password is required</div>
                    }
                  </div>
                </Col>
                <Col span={12}>
                  <div className={'form-group' + (submitted && !confirmNewPassword ? ' has-error' : '')}>
                    <label htmlFor="confirmNewPassword">Confirm Password</label>
                    <input type="password" className="form-control" name="confirmNewPassword" value={confirmNewPassword} onChange={this.handleChange} />
                    {submitted && !confirmNewPassword &&
                        <div className="help-block">Confirm Password</div>
                    }
                  </div>
                </Col>
              </Row>
              <Row type="flex" justify="center">
                <Col span={12}>
                  <button className="btn btn-primary btn-block" onClick={this.handleSubmitRegistration}>Register</button>
                </Col>
              </Row>

            </div>
          </React.Fragment>}
          </React.Fragment>
      );
  }
}

function mapStateToProps(state) {
  const { loggingIn, loggedIn, loginFailed, userRegistrationSuccess, newUserRegistering, userRegistrationError, status } = state.authenticationReducer;
  return {
      loggingIn,
      loggedIn,
      loginFailed,
      userRegistrationSuccess,
      newUserRegistering,
      userRegistrationError,
      status
  };
}

const connectedLoginPage = connect(mapStateToProps)(withRouter(LoginPage));
export { connectedLoginPage as LoginPage };
//export default withRouter(LoginPage);