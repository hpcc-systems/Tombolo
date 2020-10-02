import React from 'react';
import {withRouter} from 'react-router';
import { userActions } from '../../redux/actions/User';
import { connect } from 'react-redux';
import {message, Row, Col, Icon, Tooltip} from 'antd/lib';
import { Constants } from '../../components/common/Constants';

class ResetPassword extends React.Component {
  constructor(props) {
    super(props);
	  this.state = {
      id: '',
	    password: '',
      submitted: false
	  }
  }

  componentDidMount() {
   this.password.focus();

   this.setState({ id: this.props.match.params.id });
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  handleSubmit = (e) => {
  	e.preventDefault();
    this.setState({ submitted: true });
  	if(this.state.id && this.state.password) {
      fetch('/api/user/resetPassword', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: this.state.id, password: this.state.password })
      }).then(response => {
      	console.log(response)
        message.config({top:110})
        if(response.ok) {
        	message.success("Password has been reset succesfully.");
        	setTimeout(() => {
            window.location = '/login';
          }, 2000);
        } else {        
          response.text().then(text => {
            console.log("error message: "+JSON.parse(text));
            message.error(JSON.parse(text).errors[0]);    
          })
              
        }
      }).catch(error => {

      });
    }
  }

  render() {
    const { password, submitted } = this.state;
    return (
        <React.Fragment>        
          <div className="forgot-form shadow-lg p-3 mb-5 bg-white rounded">
            <form name="form" onSubmit={this.handleSubmit}>
            	<h2 className="text-center login-logo">Tombolo</h2>                    
              <div className={'form-group' + (submitted && !password ? ' has-error' : '')}>
                <label htmlFor="password">Password Reset</label>
                <input type="password" className="form-control" name="password" value={password} placeholder={"New Password"} onChange={this.handleChange} ref={(input) => { this.password = input; }}/>
                {submitted && !password &&
                    <div className="help-block">Password is required</div>
                }
              </div>

              <div className="form-group">
                <button className="btn btn-primary btn-block">Reset Password</button>
              </div>
            </form>
          </div>
        </React.Fragment>      
        )
  }
}
export default withRouter(ResetPassword);