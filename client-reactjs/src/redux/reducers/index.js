import { combineReducers } from 'redux';
import { authenticationReducer } from './AuthReducer';
import { applicationReducer } from './ApplicationReducer';
import { dataflowInstancesReducer } from './DataflowInstancesReducer';
import { dataflowReducer } from './DataflowReducer';
import { assetReducer } from './AssetReducer';
import { groupsReducer } from './GroupsReducer';
import { viewOnlyModeReducer} from './ViewOnlyModeReducer'
import {groupsMoveReducer} from './GroupsMoveReducer'
import {directoryTreeReducer} from "./DirectoryTreeReducer"
const rootReducer = combineReducers({
    authenticationReducer,
    applicationReducer,
    dataflowInstancesReducer,
    dataflowReducer,
    assetReducer,
    groupsReducer,
    viewOnlyModeReducer,
    groupsMoveReducer,
    directoryTreeReducer
});

export default rootReducer;