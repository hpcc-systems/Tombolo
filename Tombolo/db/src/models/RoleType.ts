import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { User } from './User.js';
// import { UserRole } from './UserRole.js';

@Table({
  tableName: 'role_types',
  paranoid: true,
  timestamps: true,
})
export class RoleType extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare roleName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: Date;

  // Associations
  // @HasMany(() => UserRole)
  // declare userRoles?: UserRole[];
}
