import { combineReducers } from 'redux';
import { authenticationReducer } from './AuthReducer';
import { applicationReducer } from './ApplicationReducer';
import { dataflowInstancesReducer } from './DataflowInstancesReducer';
import { dataflowReducer } from './DataflowReducer';
import { assetReducer } from './AssetReducer';
import { groupsReducer } from './GroupsReducer';
import { viewOnlyModeReducer} from './ViewOnlyModeReducer'
import {groupsMoveReducer} from './GroupsMoveReducer'
const rootReducer = combineReducers({
    authenticationReducer,
    applicationReducer,
    dataflowInstancesReducer,
    dataflowReducer,
    assetReducer,
    groupsReducer,
    viewOnlyModeReducer,
    groupsMoveReducer
});

export default rootReducer;