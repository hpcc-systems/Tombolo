import {
  stringBody,
  DESCRIPTION_LENGTH,
  arrayBody,
  emailBody,
} from './commonMiddleware.js';

const validateInstancePayload = [
  stringBody('name', true),
  stringBody('description', true, { length: { ...DESCRIPTION_LENGTH } }),
  arrayBody('supportEmailRecipientsEmail', true),
  emailBody('supportEmailRecipientsEmail.*', true),
  arrayBody('accessRequestEmailRecipientsEmail', true),
  emailBody('accessRequestEmailRecipientsEmail.*', true),
  arrayBody('supportEmailRecipientsRoles', true),
  emailBody('supportEmailRecipientsRoles.*', true),
  arrayBody('accessRequestEmailRecipientsRoles', true),
  stringBody('accessRequestEmailRecipientsRoles.*', true),
];

export { validateInstancePayload };
