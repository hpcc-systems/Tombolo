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
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { User } from './User.js';
import { RoleType } from './RoleType.js';

@Table({
  tableName: 'user_roles',
  freezeTableName: true,
  paranoid: true,
  timestamps: true,
})
export class UserRole extends Model<
  InferAttributes<UserRole>,
  InferCreationAttributes<UserRole>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare userId: string;

  @AllowNull(false)
  @ForeignKey(() => RoleType)
  @Column(DataType.UUID)
  declare roleId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare createdBy: string;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date>;

  // Associations
  @BelongsTo(() => User, 'userId')
  declare user?: User;

  @BelongsTo(() => RoleType, 'roleId')
  declare role_details?: RoleType;
}
