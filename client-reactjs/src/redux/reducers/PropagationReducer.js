import { Constants } from '../../components/common/Constants';

const initialState = {
  changes: { error: '', loading: false },
  current: { error: '', loading: false },
  reports: [],
};

export function propagationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.PROPAGATIONS_CHANGES_INITIATE:
      return { ...state, changes: { error: '', loading: true } };
    case Constants.PROPAGATIONS_CHANGES_SUCCESS:
      return { ...state, changes: { loading: false }, reports: [action.payload, ...state.reports] };
    case Constants.PROPAGATIONS_CHANGES_ERROR:
      return { ...state, changes: { error: action.payload, loading: false } };

    case Constants.PROPAGATIONS_CURRENT_INITIATE:
      return { ...state, current: { error: '', loading: true } };
    case Constants.PROPAGATIONS_CURRENT_SUCCESS:
      return { ...state, current: { loading: false }, reports: [action.payload, ...state.reports] };
    case Constants.PROPAGATIONS_CURRENT_ERROR:
      return { ...state, current: { error: action.payload, loading: false } };

    case Constants.UPDATE_REPORTS:
      return { ...state, loading: false, reports: action.payload };
    default:
      return state;
  }
}
