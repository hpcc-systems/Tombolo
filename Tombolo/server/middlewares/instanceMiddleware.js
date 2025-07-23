const {
  optionalStringBody,
  optionalArray,
  optionalEmailBody,
  DESCRIPTION_LENGTH,
} = require('./commonMiddleware');

const validateInstancePayload = [
  optionalStringBody('name', { max: 255 }),
  optionalStringBody('description', { ...DESCRIPTION_LENGTH }),
  optionalArray('supportEmailRecipientsEmail'),
  optionalEmailBody('supportEmailRecipientsEmail.*'),
  optionalArray('accessRequestEmailRecipientsEmail'),
  optionalEmailBody('accessRequestEmailRecipientsEmail.*'),
  optionalArray('supportEmailRecipientsRoles'),
  optionalStringBody('supportEmailRecipientsRoles.*'),
  optionalArray('accessRequestEmailRecipientsRoles'),
  optionalStringBody('accessRequestEmailRecipientsRoles.*'),
];

module.exports = {
  validateInstancePayload,
};
