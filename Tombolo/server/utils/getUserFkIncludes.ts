import { User } from '../models/index.js';

interface UserInclude {
  model: typeof User;
  attributes: string[];
  as: string;
}

// Adds creator, updater and approver (if `includeApprover` is true)
function getUserFkIncludes(includeApprover = false): UserInclude[] {
  const includeUserFks: UserInclude[] = [
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

export { getUserFkIncludes };
