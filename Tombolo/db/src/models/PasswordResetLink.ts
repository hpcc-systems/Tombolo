import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { User } from './User.js';

@Table({
  tableName: 'password_reset_links',
  timestamps: true,
})
export class PasswordResetLink extends Model<
  InferAttributes<PasswordResetLink>,
  InferCreationAttributes<PasswordResetLink>
> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare userId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare resetLink: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare issuedAt: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare expiresAt: Date;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  // Associations
  @BelongsTo(() => User)
  declare user?: User;
}
