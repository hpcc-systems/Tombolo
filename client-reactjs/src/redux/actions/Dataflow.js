import { Constants } from '../../components/common/Constants';

export const dataflowAction = {
  dataflowSelected
};

function dataflowSelected(applicationId, applicationTitle, dataflowId, user) {
  console.log('dataflowId: '+applicationId)
  return dispatch => {
    dispatch(request({ applicationId, applicationTitle, dataflowId, user }));
  };
  function request(selectedDataflow) {
    return {
      type: Constants.DATAFLOW_SELECTED,
      selectedDataflow
    }
  }
}
