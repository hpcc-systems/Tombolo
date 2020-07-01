import { Constants } from '../../components/common/Constants';

const initialState = {        
	applicationId: '',
  dataflowId: '',
  workflowId: '',
  instanceId: ''
};

export function dataflowInstancesReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.DATAFLOW_INSTANCE_SELECTED:
      return {
        applicationId: action.selectedDataflowDetails.applicationId,
        dataflowId: action.selectedDataflowDetails.dataflowId,
        workflowId: action.selectedDataflowDetails.workflowId,
        instanceId: action.selectedDataflowDetails.instanceId,
        workflowDetails: action.selectedDataflowDetails.workflowDetails
      };
    default:
      return state
  }
}