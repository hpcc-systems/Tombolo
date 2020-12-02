import { userActions } from '../../redux/actions/User';
import { store } from '../../redux/store/Store';
import { message } from 'antd/lib';
export function authHeader() {
    // return authorization header with jwt token
    let user = JSON.parse(localStorage.getItem('user'));

    if (user && user.token) {
        return {
            'Authorization': 'Bearer ' + user.token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    } else {
        return {};
    }
}

export function handleError(response) {
    if(response.status == 401) {
      //token expired
      localStorage.removeItem('user');
      store.dispatch(userActions.logout());
    } else if(response.status == 422) {
      response.json().then(data => {
        //message.config({top:130})
        //message.error("Error occured")
      });
    }
    else {
      response.json().then((responseData) => {
        message.config({top:130})
        if(responseData.message) {
          message.error(responseData.message);
        } else {
          message.error("Error Occured: "+response.statusText);
        }
      })

    }
}