import { combineReducers } from 'redux';
import { authenticationReducer } from './AuthReducer';
import { applicationReducer } from './ApplicationReducer';
import { dataflowInstancesReducer } from './DataflowInstancesReducer';
import { dataflowReducer } from './DataflowReducer';
import { assetReducer } from './AssetReducer';
const rootReducer = combineReducers({
    authenticationReducer,
    applicationReducer,
    dataflowInstancesReducer,
    dataflowReducer,
    assetReducer
});

export default rootReducer;