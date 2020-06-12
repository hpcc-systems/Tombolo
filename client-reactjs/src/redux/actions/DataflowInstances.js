import { Constants } from '../../components/common/Constants';

export const dataflowInstancesAction = {
  dataflowInstanceSelected
};

function dataflowInstanceSelected(applicationId, dataflowId, workflowId, instanceId, workflowDetails) {
  console.log('dataflowInstanceSelected: '+applicationId)
  return dispatch => {
    dispatch(request({ applicationId, dataflowId, workflowId, instanceId, workflowDetails }));
  };
  function request(selectedDataflowDetails) {
    return {
      type: Constants.DATAFLOW_INSTANCE_SELECTED,
      selectedDataflowDetails
    }
  }
}
