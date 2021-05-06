import React from 'react';
import {withRouter} from 'react-router';
import { userActions } from '../../redux/actions/User';
import { connect } from 'react-redux';
import {message, Row, Col, Icon, Tooltip} from 'antd/lib';
import { CheckCircleTwoTone } from '@ant-design/icons';
import { Constants } from '../../components/common/Constants';

class ForgotPassword extends React.Component {
  constructor(props) {
    super(props);
	  this.state = {
	    email: '',
	    submitted: false,
      success: false,
      sendingEmail: false
	  }
  }

  componentDidMount() {
   this.email.focus();
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  handleSubmit = (e) => {
  	e.preventDefault();
   if(!this.state.email){
     return message.error("E-mail required")
   }
		this.setState({ submitted: true });
		if(this.state.email) {
      this.setState({sendingEmail: true})
	  	fetch('/api/user/forgot-password', {
	      method: 'post',
	      headers: {
	        'Accept': 'application/json',
	        'Content-Type': 'application/json'
	      },
	      body: JSON.stringify({ email: this.state.email })
	    }).then(response =>{
        message.config({top:110})
        if(response.ok){
          console.log("email sent sucess >>>>" , response )
          this.setState({sendingEmail: false, success: true})
        }else if(response.status === 422){
          console.log("error >>>>", response)
          message.error("Invalid Email")
          this.setState({sendingEmail: false, submitted: false})
        }else if(response.status === 500){
          message.error("Unable to send Password reset instructions")
          this.setState({sendingEmail: false, submitted: false})
        } else{
          this.setState({sendingEmail: false, submitted: false})
          message.error("Unable to send Password reset instructions")
        }
      }
        )
        
	  }
  }

  render() {
    const { email, submitted } = this.state;
    return (
        <React.Fragment>        
          <div className="forgot-form shadow-lg p-3 mb-5 bg-white rounded">
            <form name="form" onSubmit={this.handleSubmit}>
            	<h2 className="text-center login-logo">Tombolo</h2>                    
              <div className={'form-group' + (submitted && !email ? ' has-error' : '')}>
                <input type="text" 
                className="form-control" 
                name="email" 
                value={email} 
                placeholder={"Enter E-mail to reset password"} 
                onChange={this.handleChange} 
                ref={(input) => { this.email = input; }}/>
               
                {this.state.success ?
                      <div className="help-block text-success" style={{display: "flex", alignItems: "start", justifyItems: "start", placeItems: "center", paddingTop: "10px"}}> <CheckCircleTwoTone twoToneColor="#52c41a" style={{marginRight: "10px"}}/> 
                      Password reset instructions has been sent to your email. </div> 
                      : null
                }
              </div>
            
              <div className="form-group">
                <button className="btn btn-primary btn-block" disabled={this.state.success || this.state.submitted}> 
                {this.state.sendingEmail ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending reset instructions  </> : "Next"}  
                 </button>
              </div>
            </form>
          </div>
        </React.Fragment>      
        )
  }
}
export default ForgotPassword;