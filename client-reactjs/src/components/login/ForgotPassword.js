import React from 'react';
import {withRouter} from 'react-router';
import { userActions } from '../../redux/actions/User';
import { connect } from 'react-redux';
import {message, Row, Col, Icon, Tooltip} from 'antd/lib';
import { Constants } from '../../components/common/Constants';


class ForgotPassword extends React.Component {
  constructor(props) {
    super(props);
	  this.state = {
	    email: '',
	    submitted: false
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
		this.setState({ submitted: true });
		if(this.state.email) {
      console.log("<<<< E-mail sent from UI ", this.state.email)
	  	fetch('/api/user/forgot-password', {
	      method: 'post',
	      headers: {
	        'Accept': 'application/json',
	        'Content-Type': 'application/json'
	      },
	      body: JSON.stringify({ email: this.state.email })
	    }).then(response => {
	    	console.log("<<<< Response from server: " , response)
				message.config({top:110})
				if(response.ok) {
					response.text().then(text => {
            console.log("message: "+text);
            //message.error(JSON.parse(text).errors[0]);    
            setTimeout(() => {
			        window.location = JSON.parse(text).resetUrl;
			      }, 1000);
          })
		    	
		    } else {
		    	message.error("There was a problem sending the password reset instructions")
		    }
	    }).catch(error => {

	    });
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
                <input type="text" className="form-control" name="email" value={email} placeholder={"Enter User Name to reset password"} onChange={this.handleChange} ref={(input) => { this.email = input; }}/>
                {submitted && !email &&
                    <div className="help-block">E-mail is required</div>
                }
              </div>

              <div className="form-group">
                <button className="btn btn-primary btn-block">Next</button>
              </div>
            </form>
          </div>
        </React.Fragment>      
        )
  }
}
export default ForgotPassword;