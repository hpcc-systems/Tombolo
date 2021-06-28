import { Constants } from '../../components/common/Constants';

export const updateDirectoryTree = (payload) => {
    return {
        type: Constants.DIRECTORY_TREE,
        payload
    }
}