const {
  requiredStringBody,
  emailRegex,
  NAME_LENGTH,
  DESCRIPTION_LENGTH,
  PASSWORD_LENGTH,
} = require('./commonMiddleware');

const validateWizardPayload = [
  requiredStringBody('firstName', { ...NAME_LENGTH }),
  requiredStringBody('lastName', { ...NAME_LENGTH }),
  emailRegex('email'),
  requiredStringBody('password', { ...PASSWORD_LENGTH }),
  requiredStringBody('confirmPassword', { ...PASSWORD_LENGTH }),
  requiredStringBody('description', { ...DESCRIPTION_LENGTH }),
];

module.exports = { validateWizardPayload };
