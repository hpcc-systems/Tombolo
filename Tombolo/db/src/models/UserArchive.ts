import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

@Table({
  tableName: 'user_archives',
  timestamps: true,
})
export class UserArchive extends Model<
  InferAttributes<UserArchive>,
  InferCreationAttributes<UserArchive>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare removedBy: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare removedAt: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare firstName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare lastName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare registrationMethod: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare verifiedUser: CreationOptional<boolean>;

  @Column(DataType.DATE)
  declare verifiedAt?: Date;

  @AllowNull(false)
  @Default('pending')
  @Column(DataType.STRING)
  declare registrationStatus: CreationOptional<string>;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare forcePasswordReset: CreationOptional<boolean>;

  @Column(DataType.DATE)
  declare passwordExpiresAt?: Date;

  @Column(DataType.DATE)
  declare lastLoginAt?: Date;

  @Column(DataType.DATE)
  declare lastAccessedAt?: Date;

  @Default({})
  @Column(DataType.JSON)
  declare metaData?: CreationOptional<any>;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;
}
