import { Constants } from '../../components/common/Constants';

const initialState = {
  id: '',
  title: '',
  version: '', // TODO: currently version is not in use
  clusterId: '',
};

export function dataflowReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.DATAFLOW_SELECTED:
      return { ...action.payload };
    case Constants.DATAFLOW_RESET:
      return { ...initialState };
    default:
      return state;
  }
}
