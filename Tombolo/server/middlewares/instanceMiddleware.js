const {
  stringBody,
  DESCRIPTION_LENGTH,
  arrayBody,
  emailBody,
} = require('./commonMiddleware');

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

module.exports = {
  validateInstancePayload,
};
