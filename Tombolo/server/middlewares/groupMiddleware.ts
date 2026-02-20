import { check, oneOf } from 'express-validator';
import {
  intQuery,
  regexQuery,
  intBody,
  regexBody,
  bodyUuids,
  queryUuids,
} from './commonMiddleware.js';

const appGroupIdFalsy = [
  queryUuids.app_id,
  intQuery('group_id', true, { checkFalsy: true }),
];

const validateGetDetails = [
  queryUuids.app_id,
  intQuery('group_id', true, { checkFalsy: true }),
];

const validateGetGroup = [queryUuids.app_id];

const validateGetAssets = [...appGroupIdFalsy];

const validateGetNestedAssets = [...appGroupIdFalsy];

const validateAssetsSearch = [
  ...appGroupIdFalsy,
  regexQuery('assetTypeFilter', true, {
    checkFalsy: true,
    regex: /^[a-zA-Z]{1}[a-zA-Z,]*$/,
  }),
  regexQuery('keywords', true, {
    checkFalsy: true,
    regex: /^[*"a-zA-Z]{1}[a-zA-Z0-9_ :.\-*"]*$/,
  }),
];

const validateCreateGroup = [
  intBody('parentGroupId', true, { checkFalsy: true }),
  intBody('id', true, { checkFalsy: true }),
  bodyUuids.applicationId,
  regexBody('name', false, { regex: /^[a-zA-Z0-9_. \-:]*$/ }),
];

const validateDeleteGroup = [bodyUuids.app_id, intBody('group_id')];

const validateMoveGroup = [
  bodyUuids.app_id,
  intBody('group_id'),
  intBody('destGroupId', true, { checkFalsy: true }),
];

const validateMoveAsset = [
  oneOf([check('assetId').isInt(), check('assetId').isUUID(4)]),
  bodyUuids.app_id,
  regexBody('assetType', false, { regex: /^[a-zA-Z]/ }),
  intBody('destGroupId', true, { checkFalsy: true }),
];

export {
  validateGetDetails,
  validateGetGroup,
  validateGetAssets,
  validateGetNestedAssets,
  validateAssetsSearch,
  validateCreateGroup,
  validateDeleteGroup,
  validateMoveGroup,
  validateMoveAsset,
};
