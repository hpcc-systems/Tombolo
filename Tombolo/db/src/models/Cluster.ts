import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
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
import { FileMonitoring } from './FileMonitoring.js';

@Table({
  tableName: 'clusters',
  paranoid: true,
  timestamps: true,
})
export class Cluster extends Model<
  InferAttributes<Cluster>,
  InferCreationAttributes<Cluster>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare thor_host: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare thor_port: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare roxie_host: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare roxie_port: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare username?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare hash?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare defaultEngine: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare timezone_offset: number;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare allowSelfSigned: CreationOptional<boolean>;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare containerized: CreationOptional<boolean>;

  @AllowNull(false)
  @Default('USD')
  @Column(DataType.STRING(10))
  declare currencyCode: CreationOptional<string>;

  @Default({})
  @Column(DataType.JSON)
  declare accountMetaData?: CreationOptional<Record<string, any>>;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare adminEmails?: any[];

  @AllowNull(true)
  @Default({})
  @Column(DataType.JSON)
  declare reachabilityInfo?: CreationOptional<Record<string, any>>;

  @AllowNull(true)
  @Default({})
  @Column(DataType.JSON)
  declare storageUsageHistory?: CreationOptional<Record<string, any>>;

  @AllowNull(true)
  @Default({})
  @Column(DataType.JSON)
  declare metaData?: CreationOptional<Record<string, any>>;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare createdBy: string;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare updatedBy?: string;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare deletedBy?: string;

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
  @HasMany(() => FileMonitoring)
  declare fileMonitorings?: FileMonitoring[];

  @BelongsTo(() => User, 'createdBy')
  declare creator?: User;

  @BelongsTo(() => User, 'updatedBy')
  declare updater?: User;

  @BelongsTo(() => User, 'deletedBy')
  declare deleter?: User;
}
