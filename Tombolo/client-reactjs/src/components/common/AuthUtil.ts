import { getUser } from './userStorage';

export const getRoleNameArray = (): string[] => {
  try {
    const user = getUser();

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
