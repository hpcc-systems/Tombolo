import { Constants } from '../../components/common/Constants';

export const dataflowAction = {
  dataflowSelected: (dataflow) => ({ type: Constants.DATAFLOW_SELECTED, payload: dataflow }),
  dataflowReset: () => ({ type: Constants.DATAFLOW_RESET }),
};
