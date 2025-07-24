const {
  NAME_LENGTH,
  DESCRIPTION_LENGTH,
  PASSWORD_LENGTH,
  stringBody,
  emailBody,
} = require('./commonMiddleware');

const validateWizardPayload = [
  stringBody('firstName', false, { length: { ...NAME_LENGTH } }),
  stringBody('lastName', false, { length: { ...NAME_LENGTH } }),
  emailBody('email'),
  stringBody('password', false, { length: { ...PASSWORD_LENGTH } }),
  stringBody('confirmPassword', false, { length: { ...PASSWORD_LENGTH } }),
  stringBody('description', false, { length: { ...DESCRIPTION_LENGTH } }),
];

module.exports = { validateWizardPayload };
