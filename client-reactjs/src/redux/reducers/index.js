import { combineReducers } from 'redux';
import { authenticationReducer } from './AuthReducer';
import { applicationReducer } from './ApplicationReducer';
const rootReducer = combineReducers({
    authenticationReducer,
    applicationReducer
});

export default rootReducer;