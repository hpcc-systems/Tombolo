import { store } from '../../redux/store/Store';
import {Constants} from "../common/Constants";

export const readOnlyMode = () =>  store.dispatch({
    type: Constants.ENABLE_EDIT,
    payload: false
  })

export const editableMode = () =>  store.dispatch({
    type: Constants.ENABLE_EDIT,
    payload: true
  })

export const addingAssetMode = () => store.dispatch({
  type: Constants.ADD_ASSET,
  payload: true
})