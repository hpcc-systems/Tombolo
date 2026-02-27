export interface RoleTypeAttributes {
  id: string;
  roleName: string;
  description: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;

  // Associations
  userRoles?: any[];
}

export type RoleDTO = RoleTypeAttributes;
