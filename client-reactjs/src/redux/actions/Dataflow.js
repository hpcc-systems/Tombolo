import { Constants } from '../../components/common/Constants';

export const dataflowAction = {
  dataflowSelected
};

function dataflowSelected(applicationId, applicationTitle, dataflowId, clusterId , user ) {
  return dispatch => {
    dispatch(request({ applicationId, applicationTitle, dataflowId, user , clusterId }));
  };
  function request(selectedDataflow) {
    return {
      type: Constants.DATAFLOW_SELECTED,
      selectedDataflow
    }
  }
}