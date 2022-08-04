/* eslint-disable eqeqeq */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import {withRouter} from 'react-router';
import { userActions } from '../../redux/actions/User';
import { connect } from 'react-redux';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button,  Form, Input , message, Tooltip } from 'antd';

import { Constants } from '../../components/common/Constants';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

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

  componentWillReceiveProps(nextProps){
    this.setState({ submitted: false });
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
          this.props.history.push('/');
        }
      }
    }

    if(nextProps.newUserRegistering && nextProps.userRegistrationSuccess != undefined && !nextProps.userRegistrationSuccess) {
      message.error("User Registration Failed: "+nextProps.userRegistrationError);
      return;
    }

    if(!nextProps.newUserRegistering && nextProps.userRegistrationSuccess != undefined && nextProps.userRegistrationSuccess) {
      if(nextProps.status == 201) {
        message.info("Registration Successful. Please login using the account you just created")
      } else if(nextProps.status == 202) {
        message.info("It looks like an account already exists for you. If you already registered for RealBI application, please login to Tombolo using your RealBI account.")
      }
      setTimeout(() => {
        this.handleBack();
      }, 3000);
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
    this.props.history.push('/forgot-password');
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
      this.setState({ submitted: true });
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
      const { username, password, firstName, lastName, email, newUsername, newPassword, confirmNewPassword, loginView , submitted} = this.state;
      const { userRegistrationSuccess, userRegistrationError,} = this.props
      return (
        <>
          {loginView ?
            <Form className="login-form">
              <h2 className="login-logo">Tombolo</h2>
              <Form.Item name="username" rules={[ { required: true, message: 'Please provide your Username!', }, ]} >
                <Input value={username} name="username" onChange={this.handleChange} prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Username" />
              </Form.Item>

              <Form.Item name="password" rules={[ { required: true, message: 'Please provide your Password!', }, ]} >
                <Input.Password value={password} name="password" onChange={this.handleChange} prefix={<LockOutlined className="site-form-item-icon" />} type="password" placeholder="Password" />
              </Form.Item>

              <Form.Item>
                <Link to={'/forgot-password'} className="login-form-forgot"> Forgot password ?</Link >
              </Form.Item>

              <Form.Item>
                <Button loading={submitted} onClick={this.handleSubmit} type="primary" block className="login-form-button">
                  Log in
                </Button>
               
              </Form.Item>
              
              <Form.Item>
                Or <a onClick={this.handleRegister} >register now!</a>
              </Form.Item>
            </Form>
        : 
            <Form className="login-form" labelAlign='left' {...formItemLayout}>
              <a href="#" onClick={this.handleBack}><Tooltip placement="right" title={"Back to Login"}><ArrowLeftOutlined /></Tooltip></a>
              <h2 className="login-logo">Tombolo</h2>

              <Form.Item label="First name" name="firstName" rules={[ { required: true, message: 'Please provide your first name!', }, ]} >
                <Input value={firstName} name="firstName" onChange={this.handleChange} placeholder="First name" />
              </Form.Item>

              <Form.Item label="Last Name" name="lastName" rules={[ { required: true, message: 'Please provide your last name!', }, ]} >
                <Input value={lastName} name="lastName" onChange={this.handleChange} placeholder="Last name" />
              </Form.Item>
 
              <Form.Item label="Email" name="email" rules={[ { required: true, message: 'Please provide your email!', },{ type: 'email', message: 'The input is not valid E-mail!'}]} >
                <Input type='email' name="email" value={email} onChange={this.handleChange} placeholder="Email" />
              </Form.Item>

              <Form.Item label="Username" name="newUsername" rules={[ { required: true, message: 'Please provide your username!', }]} >
                <Input value={newUsername} name="newUsername" onChange={this.handleChange} placeholder="Username" />
              </Form.Item> 

              <Form.Item label="Password" name="newPassword" rules={[ { required: true, message: 'Please provide your Password!', }, ]} >
                <Input.Password value={newPassword} name="newPassword" onChange={this.handleChange} type="password" placeholder="Password" />
              </Form.Item>

              <Form.Item label="Confirm" name="confirmNewPassword" rules={[ { required: true, message: 'Please confirm your Password!', }, ]} >
                <Input.Password value={confirmNewPassword} name="confirmNewPassword" onChange={this.handleChange} type="password" placeholder="Confirm Password" />
              </Form.Item>

              <Form.Item {...tailFormItemLayout}>
                <Button loading={submitted} onClick={this.handleSubmitRegistration} type="primary" block className="login-form-button">
                  Register
                </Button>
              </Form.Item>
              
              {userRegistrationSuccess && 
              <Form.Item>
                <Alert
                  message="Success"
                  description="You will be redirected to login page shortly"
                  type="success"
                  showIcon
                  />
              </Form.Item>
            }

            {userRegistrationError && 
              <Form.Item>
                <Alert
                  message="Error"
                  description="Failed to register user."
                  type="error"
                  showIcon
                  />
              </Form.Item>
            }
              <Form.Item {...tailFormItemLayout}>
                Or <a onClick={this.handleBack}>login now!</a>
              </Form.Item>
            </Form>
         }
          </>
      );
  }
}

function mapStateToProps(state) {
  const { loggingIn, loggedIn, loginFailed, userRegistrationSuccess, newUserRegistering, userRegistrationError, status } = state.authenticationReducer;
  return {
      loggingIn,
      loggedIn,
      loginFailed,
      newUserRegistering,
      userRegistrationSuccess,
      userRegistrationError,
      status
  };
}

const connectedLoginPage = connect(mapStateToProps)(withRouter(LoginPage));
export { connectedLoginPage as LoginPage };
//export default withRouter(LoginPage);


const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 18,
      offset: 5,
    },
  },
};


const formItemLayout = {
  labelCol: {
    xs: {
      span: 24,
    },
    sm: {
      span: 5,
    },
  },
  wrapperCol: {
    xs: {
      span: 24,
    },
    sm: {
      span: 18,
    },
  },
};