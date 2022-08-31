import { Constants } from '../../components/common/Constants';

const initialState = {
  error: '',
  loading: false,
  reports: [],
};

export function propagationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.PROPAGATIONS_INITIATE:
      return { ...state, error: '', loading: true };
    case Constants.PROPAGATIONS_SUCCESS:
      return { ...state, loading: false, reports: [action.payload, ...state.reports] };
    case Constants.PROPAGATIONS_UPDATE_REPORTS:
      return { ...state, loading: false, reports: action.payload };
    case Constants.PROPAGATIONS_ERROR:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}