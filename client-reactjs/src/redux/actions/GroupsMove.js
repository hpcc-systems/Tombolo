import { Constants } from '../../components/common/Constants';

export const moveGroup = (payload) => {
  return {
    type: Constants.MOVE_GROUP,
    payload,
  };
};
