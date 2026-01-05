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

@Table({
  tableName: 'user_archives',
  timestamps: true,
})
export class UserArchive extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

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
  declare verifiedUser: boolean;

  @Column(DataType.DATE)
  declare verifiedAt?: Date;

  @AllowNull(false)
  @Default('pending')
  @Column(DataType.STRING)
  declare registrationStatus: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare forcePasswordReset: boolean;

  @Column(DataType.DATE)
  declare passwordExpiresAt?: Date;

  @Column(DataType.DATE)
  declare lastLoginAt?: Date;

  @Column(DataType.DATE)
  declare lastAccessedAt?: Date;

  @Default({})
  @Column(DataType.JSON)
  declare metaData?: any;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
