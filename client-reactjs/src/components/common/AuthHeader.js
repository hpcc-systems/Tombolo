import { userActions } from '../../redux/actions/User';
import { store } from '../../redux/store/Store';
import { message } from 'antd/lib';
export function authHeader(action) {
    // return authorization header with jwt token
    let user = JSON.parse(localStorage.getItem('user'));

    if( user && user.token && action){
      return {
        'Authorization': 'Bearer ' + user.token
    };
    }
    else if (user && user.token) {
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
  message.config({top:130})
  
  if(response.status == 401) {
    //token expired
    localStorage.removeItem('user');
    store.dispatch(userActions.logout());
  } else if(response.status == 422) {
    throw Error("Error ocurred while saving the data. Please check the form data");
  } else {
    let errorMessage = '';
    response.json().then((responseData) => {
      errorMessage = responseData.message;
      throw  Error(errorMessage);
    })
  }
}
