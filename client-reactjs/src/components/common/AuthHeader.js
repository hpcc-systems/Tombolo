import { userActions } from '../../redux/actions/User';
import { store } from '../../redux/store/Store';
import { message } from 'antd/lib';

const { fetch: originalFetch } = window;

window.fetch = async (...args) => {  
  let [resource, config ] = args;  
  // request interceptor here
  if(resource.startsWith("/api")) {
    resource = process.env.REACT_APP_PROXY_URL + resource;
  }
  const response = await originalFetch(resource, config);
  // response interceptor here
  return response;
};

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
  message.config({ top: 130 });

  switch (response.status) {
    case 401:
      localStorage.removeItem('user');
      store.dispatch(userActions.logout());
      break;
    case 422:
      throw new Error('Error ocurred while saving the data. Please check the form data');
    default:
      throw response.json().then((result) => new Error(result.message || 'Unknown error'));
  }
}
