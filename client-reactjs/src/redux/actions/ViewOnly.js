import { Constants } from '../../components/common/Constants';

export const viewOnly = (payload) => {
  return {
    type: Constants.ENABLE_EDIT,
    payload,
  };
};
