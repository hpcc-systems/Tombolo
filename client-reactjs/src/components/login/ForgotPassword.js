import React from 'react';

import { Alert, Button, Form, Input, message } from 'antd';
import { Link } from 'react-router-dom';

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
          this.setState({sendingEmail: false, success: true})
        }else if(response.status === 422){
          message.error("Invalid Email")
          this.setState({sendingEmail: false, submitted: false})
        }else if(response.status === 500){
          message.error("Unable to send Password reset instructions")
          this.setState({sendingEmail: false, submitted: false})
        } else{
          this.setState({sendingEmail: false, submitted: false})
          message.error("Unable to send Password reset instructions")
        }
      })     
	  }
  }

  render() {
    const { email } = this.state;
    return (
      <Form className="login-form" layout='vertical'>
        <h2 className="login-logo">Tombolo</h2>

        <Form.Item label="Enter email to reset password" name="email" rules={[ { required: true, message: 'Please provide your email!', },{ type: 'email', message: 'The input is not valid E-mail!'}]} >
          <Input value={email} name='email' onChange={this.handleChange} placeholder="Email" />
        </Form.Item>

        {this.state.success ? (
          <Form.Item>
            <Alert
              message="Success"
              description="Password reset instructions has been sent to your email. "
              type="success"
              showIcon
              />
          </Form.Item>
          ) : null
        }

        <Form.Item>
          <Button loading={this.state.sendingEmail} onClick={this.handleSubmit} type="primary" block className="login-form-button">
            {this.state.sendingEmail ? 'Sending reset instructions': 'Submit'}
          </Button>
        </Form.Item>

        <Form.Item>
          <Link to='/login'>return to login</Link>
        </Form.Item>
      </Form>
    )
  }
}
export default ForgotPassword;