import React from 'react';
import {withRouter} from 'react-router';
import { userActions } from '../../redux/actions/User';
import { connect } from 'react-redux';
import {message} from 'antd/lib';

class LoginPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            submitted: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        this.userName.focus();
    }

    componentWillReceiveProps(newProps){
        if(newProps.loggedIn || newProps.loggingIn){
            var location=this.props.location.state;
            if(location && location.from.pathname.includes('/file/'))
              this.props.history.push(location.from.pathname);
            else
            this.props.history.push('/files');
        }
        else if(newProps.loginFailed) {
            message.error("Login failed. Incorrect user name or password!");
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

    
    render() {
        const { username, password, submitted } = this.state;
        return (
            <div className="login-form shadow-lg p-3 mb-5 bg-white rounded">
                <form name="form" onSubmit={this.handleSubmit}>
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
                    <p className="text-center"><a href="#">Forgot Password?</a></p>
                    </div>
                    {/*<div className="clearfix">
                        <label className="pull-left checkbox-inline"><input type="checkbox"/> Remember me</label>
                        <a href="#" className="pull-right">Forgot Password?</a>
                    </div>        
                    <p className="text-center"><Link to="/register" className="btn btn-link">Register</Link></p>*/}
                </form>
            </div>
        );
    }
}

function mapStateToProps(state) {
    const { loggingIn, loggedIn, loginFailed } = state.authenticationReducer;
    return {
        loggingIn,
        loggedIn,
        loginFailed
    };
}

const connectedLoginPage = connect(mapStateToProps)(withRouter(LoginPage));
export { connectedLoginPage as LoginPage }; 
//export default withRouter(LoginPage); 