import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  HasMany,
  BelongsTo,
  ForeignKey,
  DeletedAt,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { User } from './User.js';
import { UserApplication } from './UserApplication.js';
import { FileMonitoring } from './FileMonitoring.js';

@Table({
  tableName: 'applications',
  paranoid: true,
  timestamps: true,
})
export class Application extends Model<
  InferAttributes<Application>,
  InferCreationAttributes<Application>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare creator: string;

  @AllowNull(false)
  @Default('Private')
  @Column(DataType.ENUM('Public', 'Private'))
  declare visibility: CreationOptional<'Public' | 'Private'>;

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
  @HasMany(() => UserApplication)
  declare userApplications?: UserApplication[];

  @HasMany(() => FileMonitoring)
  declare fileMonitorings?: FileMonitoring[];

  @BelongsTo(() => User, 'creator')
  declare application_creator?: User;
}
