import { Constants } from '../../components/common/Constants';

const initialState = {
	applicationId: '',
  dataflowId: '',
  workflowId: '',
  instanceId: ''
};

export function dataflowReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.DATAFLOW_SELECTED:
      return {
        applicationId: action.selectedDataflow.applicationId,
        applicationTitle: action.selectedDataflow.applicationTitle,
        dataflowId: action.selectedDataflow.dataflowId,
        user: action.selectedDataflow.user
      };
    default:
      return state
  }
}