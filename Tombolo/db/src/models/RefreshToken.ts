import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  Default,
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

@Table({
  tableName: 'refresh_tokens',
  paranoid: true,
  timestamps: true,
})
export class RefreshToken extends Model<
  InferAttributes<RefreshToken>,
  InferCreationAttributes<RefreshToken>
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
  declare token: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare deviceInfo: any;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare iat: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare exp: Date;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare revoked: CreationOptional<boolean>;

  @Column(DataType.DATE)
  declare revokedAt?: Date | null;

  @Column(DataType.JSON)
  declare metaData?: any | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @BelongsTo(() => User)
  declare user?: User;
}
