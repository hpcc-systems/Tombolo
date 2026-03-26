import { getUser } from './userStorage';

export const getRoleNameArray = (userFromState?: any): string[] => {
  try {
    const user = userFromState ?? getUser();

    if (!user) {
      return [];
    }
    let roles: string[] = [];
    roles = user?.roles?.map((role: any) => role.role_details.roleName) || [];

    return roles;
  } catch {
    return [];
  }
};
