const { user: User } = require('../models');

// Adds creator, updater and approver (if `includeApprover` is true)
function getUserFkIncludes(includeApprover = false) {
  const includeUserFks = [
    {
      model: User,
      attributes: ['firstName', 'lastName', 'email'],
      as: 'creator',
    },
    {
      model: User,
      attributes: ['firstName', 'lastName', 'email'],
      as: 'updater',
    },
  ];

  if (includeApprover) {
    includeUserFks.push({
      model: User,
      attributes: ['firstName', 'lastName', 'email'],
      as: 'approver',
    });
  }
  return includeUserFks;
}

module.exports = {
  getUserFkIncludes,
};
