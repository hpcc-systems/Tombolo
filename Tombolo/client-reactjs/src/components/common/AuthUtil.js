import { getUser } from './userStorage';

export const getRoleNameArray = () => {
  try {
    //get role Array to control options available in actions
    const user = getUser();

    if (!user) {
      return [];
    }
    let roles = [];
    //roleName is nested inside of role_details in the role array, build a list of roles
    roles = user?.roles?.map((role) => role.role_details.roleName);

    return roles;
  } catch (e) {
    console.log(e);
    return [];
  }
};
