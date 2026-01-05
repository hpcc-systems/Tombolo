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
import { User } from './User.js';

@Table({
  tableName: 'password_reset_links',
  timestamps: true,
})
export class PasswordResetLink extends Model {
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
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => User)
  declare user?: User;
}
